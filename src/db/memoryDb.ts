// In-memory database stub for web platform where expo-sqlite Worker fails.
// Implements the subset of SQLiteDatabase API used by our repositories.

interface Row {
  [key: string]: string | number | null;
}

export class MemoryDatabase {
  private tables: Map<string, Row[]> = new Map();
  private autoIncrements: Map<string, number> = new Map();

  async execAsync(sql: string): Promise<void> {
    // Parse CREATE TABLE statements to initialize storage
    let createMatch: RegExpExecArray | null;
    const createRegex = /CREATE TABLE IF NOT EXISTS (\w+)/g;
    while ((createMatch = createRegex.exec(sql)) !== null) {
      if (!this.tables.has(createMatch[1])) {
        this.tables.set(createMatch[1], []);
      }
    }
  }

  async runAsync(sql: string, ...params: (string | number | null)[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const insertMatch = sql.match(/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const table = insertMatch[1];
      const cols = insertMatch[2].split(',').map((c) => c.trim());
      const rows = this.tables.get(table) ?? [];

      const row: Row = {};
      let paramIdx = 0;
      const valuePlaceholders = insertMatch[3].split(',').map((v) => v.trim());

      for (let i = 0; i < cols.length; i++) {
        const placeholder = valuePlaceholders[i];
        if (placeholder === '?') {
          row[cols[i]] = params[paramIdx++] ?? null;
        } else if (placeholder.includes("datetime('now')")) {
          row[cols[i]] = new Date().toISOString();
        } else {
          // Parse literal values, preserving number types
          const cleaned = placeholder.replace(/'/g, '').trim();
          const asNum = Number(cleaned);
          row[cols[i]] = !isNaN(asNum) && cleaned !== '' ? asNum : cleaned;
        }
      }

      // Handle auto-increment for 'id' column
      if (cols.includes('id') && row['id'] === null) {
        const nextId = (this.autoIncrements.get(table) ?? 0) + 1;
        this.autoIncrements.set(table, nextId);
        row['id'] = nextId;
      } else if (!cols.includes('id')) {
        const nextId = (this.autoIncrements.get(table) ?? 0) + 1;
        this.autoIncrements.set(table, nextId);
        row['id'] = nextId;
      }

      // Handle INSERT OR REPLACE / INSERT OR IGNORE
      if (/OR\s+REPLACE/i.test(sql)) {
        const pkCol = cols[0]; // Assume first column is PK
        const idx = rows.findIndex((r) => r[pkCol] === row[pkCol]);
        if (idx >= 0) rows[idx] = row;
        else rows.push(row);
      } else if (/OR\s+IGNORE/i.test(sql)) {
        const pkCol = cols[0];
        if (!rows.find((r) => r[pkCol] === row[pkCol])) {
          rows.push(row);
        }
      } else {
        rows.push(row);
      }

      this.tables.set(table, rows);
      return { lastInsertRowId: row['id'] as number, changes: 1 };
    }

    const updateMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const table = updateMatch[1];
      const rows = this.tables.get(table) ?? [];

      // Parse SET clauses
      const setClauses = updateMatch[2].split(/,(?![^(]*\))/).map((c) => c.trim());
      // Parse WHERE clause - simple: column = ?
      const whereCol = updateMatch[3].match(/(\w+)\s*=\s*\?/)?.[1];
      const whereVal = params[params.length - 1];

      let changes = 0;
      let paramIdx = 0;
      for (const row of rows) {
        if (whereCol && row[whereCol] !== whereVal) continue;
        for (const clause of setClauses) {
          const eqMatch = clause.match(/(\w+)\s*=\s*(.+)/);
          if (!eqMatch) continue;
          const col = eqMatch[1];
          const val = eqMatch[2].trim();
          if (val === '?') {
            row[col] = params[paramIdx++] ?? null;
          } else if (val.includes('+ 1')) {
            row[col] = ((row[col] as number) ?? 0) + 1;
          } else if (val.includes('+ ?')) {
            row[col] = ((row[col] as number) ?? 0) + (params[paramIdx++] as number ?? 0);
          } else if (val.includes("datetime('now')")) {
            row[col] = new Date().toISOString();
          }
        }
        changes++;
      }

      return { lastInsertRowId: 0, changes };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null> {
    const results = await this.getAllAsync<T>(sql, ...params);
    return results[0] ?? null;
  }

  async getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]> {
    // Parse SELECT with COUNT(*)
    const countMatch = sql.match(/SELECT\s+COUNT\(\*\)\s+as\s+(\w+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (countMatch) {
      const table = countMatch[2];
      const rows = this.tables.get(table) ?? [];
      const filtered = countMatch[3] ? this.filterRows(rows, countMatch[3], params) : rows;
      return [{ [countMatch[1]]: filtered.length } as unknown as T];
    }

    // Parse SELECT *
    const selectMatch = sql.match(/SELECT\s+\*\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+.+)?$/i);
    if (selectMatch) {
      const table = selectMatch[1];
      const rows = this.tables.get(table) ?? [];
      if (selectMatch[2]) {
        return this.filterRows(rows, selectMatch[2], params) as unknown as T[];
      }
      return [...rows] as unknown as T[];
    }

    // Parse SELECT specific columns
    const selectColMatch = sql.match(/SELECT\s+(\w+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+.+)?$/i);
    if (selectColMatch) {
      const col = selectColMatch[1];
      const table = selectColMatch[2];
      const rows = this.tables.get(table) ?? [];
      const filtered = selectColMatch[3] ? this.filterRows(rows, selectColMatch[3], params) : rows;
      return filtered.map((r) => ({ [col]: r[col] })) as unknown as T[];
    }

    // SELECT key, value FROM table
    const kvMatch = sql.match(/SELECT\s+(\w+),\s*(\w+)\s+FROM\s+(\w+)/i);
    if (kvMatch) {
      const rows = this.tables.get(kvMatch[3]) ?? [];
      return rows.map((r) => ({ [kvMatch[1]]: r[kvMatch[1]], [kvMatch[2]]: r[kvMatch[2]] })) as unknown as T[];
    }

    return [];
  }

  private filterRows(rows: Row[], whereClause: string, params: (string | number | null)[]): Row[] {
    // Handle multiple AND conditions
    const conditions = whereClause.split(/\s+AND\s+/i);
    let paramIdx = 0;
    let result = [...rows];

    for (const condition of conditions) {
      const eqMatch = condition.trim().match(/(\w+)\s*(=|<=|>=)\s*\??/);
      if (!eqMatch) continue;
      const col = eqMatch[1];
      const op = eqMatch[2];
      const val = condition.includes('?') ? params[paramIdx++] : null;

      result = result.filter((row) => {
        // eslint-disable-next-line eqeqeq
        if (op === '=') return row[col] == val;
        if (op === '<=') return (row[col] ?? '') <= (val ?? '');
        if (op === '>=') return (row[col] ?? '') >= (val ?? '');
        return true;
      });
    }

    return result;
  }

  async closeAsync(): Promise<void> {
    this.tables.clear();
  }
}
