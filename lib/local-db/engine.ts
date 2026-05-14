/**
 * Motor de BD local basado en archivos JSON.
 *
 * Imita la interfaz de Supabase PostgREST para que los módulos
 * del admin funcionen sin cambios. Cuando se configure Supabase,
 * basta con cambiar NEXT_PUBLIC_SUPABASE_URL en .env.local.
 *
 * Cada "tabla" es un archivo JSON en data/db/.
 */

import * as fs from "fs";
import * as path from "path";

const DB_DIR = path.join(process.cwd(), "data", "db");

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function tablePath(name: string) {
  return path.join(DB_DIR, `${name}.json`);
}

function readTable(name: string): Record<string, unknown>[] {
  ensureDir();
  const fp = tablePath(name);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function writeTable(name: string, rows: Record<string, unknown>[]) {
  ensureDir();
  fs.writeFileSync(tablePath(name), JSON.stringify(rows, null, 2));
}

function generateId(): string {
  return crypto.randomUUID();
}

let _counters: Record<string, number> | null = null;
function getNextSerial(name: string): number {
  if (!_counters) {
    const fp = path.join(DB_DIR, "_counters.json");
    _counters = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf-8")) : {};
  }
  const val = (_counters![name] || 0) + 1;
  _counters![name] = val;
  fs.writeFileSync(path.join(DB_DIR, "_counters.json"), JSON.stringify(_counters, null, 2));
  return val;
}

// Serial columns per table
const SERIAL_COLS: Record<string, string> = {
  orders: "order_number",
  purchase_orders: "po_number",
};

type Row = Record<string, unknown>;

interface QueryResult {
  data: Row[] | Row | null;
  error: { message: string } | null;
  count?: number | null;
}

function matchIlike(value: unknown, pattern: string): boolean {
  if (typeof value !== "string") return false;
  const regex = new RegExp(
    "^" + pattern.replace(/%/g, ".*").replace(/_/g, ".") + "$",
    "i",
  );
  return regex.test(value);
}

class QueryBuilder {
  private _table: string;
  private _rows: Row[];
  private _filters: Array<(r: Row) => boolean> = [];
  private _orderBy: { col: string; asc: boolean }[] = [];
  private _rangeFrom = 0;
  private _rangeTo = Infinity;
  private _limit: number | null = null;
  private _selectCols: string | null = null;
  private _countOnly = false;
  private _headOnly = false;
  private _single = false;
  private _joinTables: Record<string, string[]> = {};

  constructor(table: string) {
    this._table = table;
    this._rows = readTable(table);
  }

  select(cols?: string, opts?: { count?: string; head?: boolean }) {
    this._selectCols = cols || "*";
    if (opts?.count === "exact") this._countOnly = true;
    if (opts?.head) this._headOnly = true;

    if (cols && cols !== "*") {
      const parts = cols.split(",").map((c) => c.trim());
      for (const part of parts) {
        const joinMatch = part.match(/^(\w+)\(([^)]+)\)$/);
        if (joinMatch) {
          this._joinTables[joinMatch[1]] = joinMatch[2].split(",").map((c) => c.trim());
        }
      }
    }

    return this;
  }

  eq(col: string, val: unknown) {
    this._filters.push((r) => r[col] === val);
    return this;
  }

  neq(col: string, val: unknown) {
    this._filters.push((r) => r[col] !== val);
    return this;
  }

  gt(col: string, val: unknown) {
    this._filters.push((r) => (r[col] as number) > (val as number));
    return this;
  }

  gte(col: string, val: unknown) {
    this._filters.push((r) => (r[col] as string | number) >= (val as string | number));
    return this;
  }

  lt(col: string, val: unknown) {
    this._filters.push((r) => (r[col] as number) < (val as number));
    return this;
  }

  lte(col: string, val: unknown) {
    this._filters.push((r) => (r[col] as string | number) <= (val as string | number));
    return this;
  }

  ilike(col: string, pattern: string) {
    this._filters.push((r) => matchIlike(r[col], pattern));
    return this;
  }

  in(col: string, values: unknown[]) {
    this._filters.push((r) => values.includes(r[col]));
    return this;
  }

  or(orString: string) {
    const parts = orString.split(",");
    const conditions = parts.map((part) => {
      const [colOp, ...rest] = part.split(".");
      const col = colOp;
      const op = rest[0];
      const val = rest.slice(1).join(".");
      return { col, op, val };
    });

    this._filters.push((r) =>
      conditions.some(({ col, op, val }) => {
        if (op === "ilike") return matchIlike(r[col], val);
        if (op === "eq") return r[col] === val;
        if (op === "neq") return r[col] !== val;
        return false;
      }),
    );
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._orderBy.push({ col, asc: opts?.ascending ?? true });
    return this;
  }

  range(from: number, to: number) {
    this._rangeFrom = from;
    this._rangeTo = to;
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  private _resolve(): Row[] {
    let rows = [...this._rows];
    for (const f of this._filters) {
      rows = rows.filter(f);
    }
    for (const { col, asc } of this._orderBy) {
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
    return rows;
  }

  private _applyJoins(rows: Row[]): Row[] {
    if (Object.keys(this._joinTables).length === 0) return rows;

    return rows.map((row) => {
      const result = { ...row };
      for (const [joinTable, joinCols] of Object.entries(this._joinTables)) {
        const fkCol = `${joinTable.replace(/s$/, "")}_id`;
        const fkVal = row[fkCol] || row.customer_id || row.order_id || row.supplier_id;
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

  then(resolve: (result: QueryResult) => void) {
    const allFiltered = this._resolve();
    const count = allFiltered.length;

    if (this._headOnly) {
      resolve({ data: null, error: null, count });
      return;
    }

    let rows = allFiltered.slice(
      this._rangeFrom,
      this._rangeTo === Infinity ? undefined : this._rangeTo + 1,
    );
    if (this._limit !== null) rows = rows.slice(0, this._limit);

    rows = this._applyJoins(rows);

    if (this._single) {
      resolve({
        data: rows[0] || null,
        error: rows[0] ? null : { message: "No rows found" },
        count: this._countOnly ? count : undefined,
      });
    } else {
      resolve({
        data: rows,
        error: null,
        count: this._countOnly ? count : undefined,
      });
    }
  }
}

class MutationBuilder {
  private _table: string;
  private _operation: "insert" | "update" | "delete" | "upsert";
  private _data: Row | Row[] | null;
  private _filters: Array<(r: Row) => boolean> = [];
  private _returnSelect = false;
  private _single = false;
  private _upsertConflict: string | null = null;

  constructor(
    table: string,
    operation: "insert" | "update" | "delete" | "upsert",
    data?: Row | Row[],
    opts?: { onConflict?: string },
  ) {
    this._table = table;
    this._operation = operation;
    this._data = data || null;
    if (opts?.onConflict) this._upsertConflict = opts.onConflict;
  }

  eq(col: string, val: unknown) {
    this._filters.push((r) => r[col] === val);
    return this;
  }

  in(col: string, values: unknown[]) {
    this._filters.push((r) => values.includes(r[col]));
    return this;
  }

  select(cols?: string) {
    this._returnSelect = true;
    void cols;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  then(resolve: (result: QueryResult) => void) {
    const rows = readTable(this._table);
    let result: Row[] = [];

    switch (this._operation) {
      case "insert": {
        const items = Array.isArray(this._data) ? this._data : [this._data!];
        const newRows: Row[] = [];
        for (const item of items) {
          const row: Row = {
            id: generateId(),
            ...item,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const serialCol = SERIAL_COLS[this._table];
          if (serialCol && !row[serialCol]) {
            row[serialCol] = getNextSerial(this._table);
          }
          newRows.push(row);
        }
        rows.push(...newRows);
        writeTable(this._table, rows);
        result = newRows;
        break;
      }

      case "update": {
        const updated: Row[] = [];
        for (let i = 0; i < rows.length; i++) {
          if (this._filters.every((f) => f(rows[i]))) {
            rows[i] = {
              ...rows[i],
              ...(this._data as Row),
              updated_at: new Date().toISOString(),
            };
            updated.push(rows[i]);
          }
        }
        writeTable(this._table, rows);
        result = updated;
        break;
      }

      case "delete": {
        const kept: Row[] = [];
        const deleted: Row[] = [];
        for (const r of rows) {
          if (this._filters.every((f) => f(r))) deleted.push(r);
          else kept.push(r);
        }
        writeTable(this._table, kept);
        result = deleted;
        break;
      }

      case "upsert": {
        const items = Array.isArray(this._data) ? this._data : [this._data!];
        const conflictCol = this._upsertConflict || "id";
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
            const serialCol = SERIAL_COLS[this._table];
            if (serialCol && !row[serialCol]) {
              row[serialCol] = getNextSerial(this._table);
            }
            rows.push(row);
            upserted.push(row);
          }
        }
        writeTable(this._table, rows);
        result = upserted;
        break;
      }
    }

    if (this._returnSelect) {
      resolve({
        data: this._single ? (result[0] || null) : result,
        error: null,
      });
    } else {
      resolve({ data: null, error: null });
    }
  }
}

class TableRef {
  constructor(private _table: string) {}

  select(cols?: string, opts?: { count?: string; head?: boolean }) {
    const qb = new QueryBuilder(this._table);
    return qb.select(cols, opts);
  }

  insert(data: Row | Row[]) {
    return new MutationBuilder(this._table, "insert", data);
  }

  update(data: Row) {
    return new MutationBuilder(this._table, "update", data);
  }

  delete() {
    return new MutationBuilder(this._table, "delete");
  }

  upsert(data: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    return new MutationBuilder(this._table, "upsert", data, opts);
  }
}

export class LocalDBClient {
  from(table: string) {
    return new TableRef(table);
  }
}

export function createLocalClient() {
  return new LocalDBClient();
}
