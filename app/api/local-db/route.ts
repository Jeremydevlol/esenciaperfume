import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data", "db");

type Row = Record<string, unknown>;

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function tablePath(name: string) {
  return path.join(DB_DIR, `${name}.json`);
}

function readTable(name: string): Row[] {
  ensureDir();
  const fp = tablePath(name);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function writeTable(name: string, rows: Row[]) {
  ensureDir();
  fs.writeFileSync(tablePath(name), JSON.stringify(rows, null, 2));
}

function generateId(): string {
  return crypto.randomUUID();
}

const SERIAL_COLS: Record<string, string> = {
  orders: "order_number",
  purchase_orders: "po_number",
};

let _counters: Record<string, number> | null = null;
function getNextSerial(table: string): number {
  if (!_counters) {
    const fp = path.join(DB_DIR, "_counters.json");
    _counters = fs.existsSync(fp)
      ? JSON.parse(fs.readFileSync(fp, "utf-8"))
      : {};
  }
  const val = (_counters![table] || 0) + 1;
  _counters![table] = val;
  fs.writeFileSync(
    path.join(DB_DIR, "_counters.json"),
    JSON.stringify(_counters, null, 2),
  );
  return val;
}

function matchIlike(value: unknown, pattern: string): boolean {
  if (typeof value !== "string") return false;
  const regex = new RegExp(
    "^" + pattern.replace(/%/g, ".*").replace(/_/g, ".") + "$",
    "i",
  );
  return regex.test(value);
}

interface FilterDef {
  type: string;
  col: string;
  val: unknown;
}

function applyFilter(row: Row, f: FilterDef): boolean {
  switch (f.type) {
    case "eq":
      return row[f.col] === f.val;
    case "neq":
      return row[f.col] !== f.val;
    case "gt":
      return (row[f.col] as number) > (f.val as number);
    case "gte":
      return (row[f.col] as string | number) >= (f.val as string | number);
    case "lt":
      return (row[f.col] as number) < (f.val as number);
    case "lte":
      return (row[f.col] as string | number) <= (f.val as string | number);
    case "ilike":
      return matchIlike(row[f.col], f.val as string);
    case "in":
      return (f.val as unknown[]).includes(row[f.col]);
    case "or": {
      const parts = (f.val as string).split(",");
      return parts.some((part) => {
        const segs = part.split(".");
        const col = segs[0];
        const op = segs[1];
        const val = segs.slice(2).join(".");
        if (op === "ilike") return matchIlike(row[col], val);
        if (op === "eq") return row[col] === val;
        if (op === "neq") return row[col] !== val;
        return false;
      });
    }
    default:
      return true;
  }
}

function applyJoins(rows: Row[], selectCols: string): Row[] {
  if (!selectCols || selectCols === "*") return rows;

  const parts = selectCols.split(",").map((c) => c.trim());
  const joins: Record<string, string[]> = {};
  for (const part of parts) {
    const m = part.match(/^(\w+)\(([^)]+)\)$/);
    if (m) joins[m[1]] = m[2].split(",").map((c) => c.trim());
  }

  if (Object.keys(joins).length === 0) return rows;

  return rows.map((row) => {
    const result = { ...row };
    for (const [joinTable, joinCols] of Object.entries(joins)) {
      const fkCol = `${joinTable.replace(/s$/, "")}_id`;
      const fkVal =
        row[fkCol] || row.customer_id || row.order_id || row.supplier_id;
      if (fkVal) {
        const joinRows = readTable(joinTable);
        const match = joinRows.find((jr) => jr.id === fkVal);
        if (match) {
          const picked: Row = {};
          for (const c of joinCols) {
            if (c === "*") Object.assign(picked, match);
            else picked[c] = match[c];
          }
          result[joinTable] = picked;
        } else {
          result[joinTable] = null;
        }
      } else {
        result[joinTable] = null;
      }
    }
    return result;
  });
}

interface QueryDef {
  table: string;
  operation: string;
  data?: Row | Row[];
  filters: FilterDef[];
  orderBy: Array<{ col: string; asc: boolean }>;
  rangeFrom?: number;
  rangeTo?: number;
  limit?: number;
  selectCols?: string;
  countOnly?: boolean;
  headOnly?: boolean;
  single?: boolean;
  upsertConflict?: string;
  returnSelect?: boolean;
}

function handleSelect(q: QueryDef) {
  let rows = readTable(q.table);

  for (const f of q.filters) {
    rows = rows.filter((r) => applyFilter(r, f));
  }

  const count = rows.length;

  if (q.headOnly) {
    return { data: null, error: null, count };
  }

  for (const { col, asc } of q.orderBy) {
    rows.sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
  }

  const from = q.rangeFrom ?? 0;
  const to = q.rangeTo ?? rows.length - 1;
  rows = rows.slice(from, to + 1);

  if (q.limit != null) rows = rows.slice(0, q.limit);

  rows = applyJoins(rows, q.selectCols || "*");

  if (q.single) {
    return {
      data: rows[0] || null,
      error: rows[0] ? null : { message: "No rows found" },
      count: q.countOnly ? count : undefined,
    };
  }

  return { data: rows, error: null, count: q.countOnly ? count : undefined };
}

function handleInsert(q: QueryDef) {
  const rows = readTable(q.table);
  const items = Array.isArray(q.data) ? q.data : [q.data!];
  const newRows: Row[] = [];

  for (const item of items) {
    const row: Row = {
      id: generateId(),
      ...item,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const serialCol = SERIAL_COLS[q.table];
    if (serialCol && !row[serialCol]) {
      row[serialCol] = getNextSerial(q.table);
    }
    newRows.push(row);
  }

  rows.push(...newRows);
  writeTable(q.table, rows);

  return {
    data: q.single ? newRows[0] || null : newRows,
    error: null,
  };
}

function handleUpdate(q: QueryDef) {
  const rows = readTable(q.table);
  const updated: Row[] = [];

  for (let i = 0; i < rows.length; i++) {
    if (q.filters.every((f) => applyFilter(rows[i], f))) {
      rows[i] = {
        ...rows[i],
        ...(q.data as Row),
        updated_at: new Date().toISOString(),
      };
      updated.push(rows[i]);
    }
  }

  writeTable(q.table, rows);
  return { data: q.single ? updated[0] || null : updated, error: null };
}

function handleDelete(q: QueryDef) {
  const rows = readTable(q.table);
  const kept: Row[] = [];
  const deleted: Row[] = [];

  for (const r of rows) {
    if (q.filters.every((f) => applyFilter(r, f))) deleted.push(r);
    else kept.push(r);
  }

  writeTable(q.table, kept);
  return { data: deleted, error: null };
}

function handleUpsert(q: QueryDef) {
  const rows = readTable(q.table);
  const items = Array.isArray(q.data) ? q.data : [q.data!];
  const conflictCol = q.upsertConflict || "id";
  const upserted: Row[] = [];

  for (const item of items) {
    const idx = rows.findIndex((r) => r[conflictCol] === item[conflictCol]);
    if (idx >= 0) {
      rows[idx] = {
        ...rows[idx],
        ...item,
        updated_at: new Date().toISOString(),
      };
      upserted.push(rows[idx]);
    } else {
      const row: Row = {
        id: generateId(),
        ...item,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const serialCol = SERIAL_COLS[q.table];
      if (serialCol && !row[serialCol]) {
        row[serialCol] = getNextSerial(q.table);
      }
      rows.push(row);
      upserted.push(row);
    }
  }

  writeTable(q.table, rows);
  return {
    data: q.single ? upserted[0] || null : upserted,
    error: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const q: QueryDef = await req.json();

    if (!q.table || !q.operation) {
      return NextResponse.json(
        { data: null, error: { message: "table y operation requeridos" } },
        { status: 400 },
      );
    }

    let result;
    switch (q.operation) {
      case "select":
        result = handleSelect(q);
        break;
      case "insert":
        result = handleInsert(q);
        break;
      case "update":
        result = handleUpdate(q);
        break;
      case "delete":
        result = handleDelete(q);
        break;
      case "upsert":
        result = handleUpsert(q);
        break;
      default:
        return NextResponse.json(
          { data: null, error: { message: `Operación no válida: ${q.operation}` } },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: String(err) } },
      { status: 500 },
    );
  }
}
