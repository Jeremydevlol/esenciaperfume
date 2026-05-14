/**
 * Proxy de BD local para componentes "use client".
 *
 * Imita la interfaz del cliente Supabase pero envía las consultas
 * a /api/local-db donde se ejecutan contra archivos JSON.
 */

type Row = Record<string, unknown>;

interface QueryResult {
  data: Row[] | Row | null;
  error: { message: string } | null;
  count?: number | null;
}

interface QueryDef {
  table: string;
  operation: "select" | "insert" | "update" | "delete" | "upsert";
  data?: Row | Row[];
  filters: Array<{ type: string; col: string; val: unknown }>;
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

class ProxyChain {
  private _def: QueryDef;

  constructor(def: QueryDef) {
    this._def = def;
  }

  select(cols?: string, opts?: { count?: string; head?: boolean }) {
    this._def.selectCols = cols || "*";
    if (opts?.count === "exact") this._def.countOnly = true;
    if (opts?.head) this._def.headOnly = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this._def.filters.push({ type: "eq", col, val });
    return this;
  }

  neq(col: string, val: unknown) {
    this._def.filters.push({ type: "neq", col, val });
    return this;
  }

  gt(col: string, val: unknown) {
    this._def.filters.push({ type: "gt", col, val });
    return this;
  }

  gte(col: string, val: unknown) {
    this._def.filters.push({ type: "gte", col, val });
    return this;
  }

  lt(col: string, val: unknown) {
    this._def.filters.push({ type: "lt", col, val });
    return this;
  }

  lte(col: string, val: unknown) {
    this._def.filters.push({ type: "lte", col, val });
    return this;
  }

  ilike(col: string, pattern: string) {
    this._def.filters.push({ type: "ilike", col, val: pattern });
    return this;
  }

  in(col: string, values: unknown[]) {
    this._def.filters.push({ type: "in", col, val: values });
    return this;
  }

  or(orString: string) {
    this._def.filters.push({ type: "or", col: "", val: orString });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._def.orderBy.push({ col, asc: opts?.ascending ?? true });
    return this;
  }

  range(from: number, to: number) {
    this._def.rangeFrom = from;
    this._def.rangeTo = to;
    return this;
  }

  limit(n: number) {
    this._def.limit = n;
    return this;
  }

  single() {
    this._def.single = true;
    return this;
  }

  async then(
    resolve: (value: QueryResult) => void,
    reject?: (reason: unknown) => void,
  ) {
    try {
      const res = await fetch("/api/local-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this._def),
      });
      const result = await res.json();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: { message: String(err) } });
    }
  }
}

class ProxyTable {
  constructor(private _table: string) {}

  select(cols?: string, opts?: { count?: string; head?: boolean }) {
    const chain = new ProxyChain({
      table: this._table,
      operation: "select",
      filters: [],
      orderBy: [],
      selectCols: cols || "*",
      countOnly: opts?.count === "exact",
      headOnly: opts?.head,
    });
    return chain;
  }

  insert(data: Row | Row[]) {
    return new ProxyChain({
      table: this._table,
      operation: "insert",
      data,
      filters: [],
      orderBy: [],
    });
  }

  update(data: Row) {
    return new ProxyChain({
      table: this._table,
      operation: "update",
      data,
      filters: [],
      orderBy: [],
    });
  }

  delete() {
    return new ProxyChain({
      table: this._table,
      operation: "delete",
      filters: [],
      orderBy: [],
    });
  }

  upsert(data: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    return new ProxyChain({
      table: this._table,
      operation: "upsert",
      data,
      filters: [],
      orderBy: [],
      upsertConflict: opts?.onConflict,
    });
  }
}

export class LocalDBProxy {
  from(table: string) {
    return new ProxyTable(table);
  }
}

export function createLocalProxy() {
  return new LocalDBProxy();
}
