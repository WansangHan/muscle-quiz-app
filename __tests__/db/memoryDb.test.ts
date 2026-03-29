import { MemoryDatabase } from '../../src/db/memoryDb';

describe('MemoryDatabase', () => {
  let db: MemoryDatabase;

  beforeEach(() => {
    db = new MemoryDatabase();
  });

  describe('execAsync - CREATE TABLE', () => {
    it('테이블 생성', async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS t (id TEXT)');
      const rows = await db.getAllAsync('SELECT * FROM t');
      expect(rows).toEqual([]);
    });

    it('하나의 호출로 여러 테이블 생성', async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS a (id TEXT);
        CREATE TABLE IF NOT EXISTS b (id TEXT);
      `);
      expect(await db.getAllAsync('SELECT * FROM a')).toEqual([]);
      expect(await db.getAllAsync('SELECT * FROM b')).toEqual([]);
    });
  });

  describe('runAsync - INSERT', () => {
    beforeEach(async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS users (name TEXT, age INTEGER)');
    });

    it('기본 INSERT', async () => {
      await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
      const rows = await db.getAllAsync<any>('SELECT * FROM users');
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Alice');
      expect(rows[0].age).toBe(30);
    });

    it('INSERT OR REPLACE', async () => {
      await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
      await db.runAsync('INSERT OR REPLACE INTO users (name, age) VALUES (?, ?)', 'Alice', 35);
      const rows = await db.getAllAsync<any>('SELECT * FROM users');
      expect(rows).toHaveLength(1);
      expect(rows[0].age).toBe(35);
    });

    it('INSERT OR IGNORE', async () => {
      await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
      await db.runAsync('INSERT OR IGNORE INTO users (name, age) VALUES (?, ?)', 'Alice', 99);
      const rows = await db.getAllAsync<any>('SELECT * FROM users');
      expect(rows).toHaveLength(1);
      expect(rows[0].age).toBe(30);
    });

    it('자동 증가 ID', async () => {
      const r1 = await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'A', 1);
      const r2 = await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'B', 2);
      expect(r2.lastInsertRowId).toBe(r1.lastInsertRowId + 1);
    });
  });

  describe('runAsync - UPDATE', () => {
    beforeEach(async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS items (id TEXT, count INTEGER, label TEXT)');
      await db.runAsync('INSERT INTO items (id, count, label) VALUES (?, ?, ?)', 'a', 0, 'old');
    });

    it('단일행 UPDATE', async () => {
      await db.runAsync('UPDATE items SET label = ? WHERE id = ?', 'new', 'a');
      const row = await db.getFirstAsync<any>('SELECT * FROM items WHERE id = ?', 'a');
      expect(row.label).toBe('new');
    });

    it('멀티라인 UPDATE (dotAll 플래그 검증)', async () => {
      await db.runAsync(
        `UPDATE items SET
           count = ?,
           label = ?
         WHERE id = ?`,
        5, 'updated', 'a',
      );
      const row = await db.getFirstAsync<any>('SELECT * FROM items WHERE id = ?', 'a');
      expect(row.count).toBe(5);
      expect(row.label).toBe('updated');
    });

    it('산술 연산: column + 1', async () => {
      await db.runAsync('UPDATE items SET count = count + 1 WHERE id = ?', 'a');
      await db.runAsync('UPDATE items SET count = count + 1 WHERE id = ?', 'a');
      const row = await db.getFirstAsync<any>('SELECT * FROM items WHERE id = ?', 'a');
      expect(row.count).toBe(2);
    });

    it('산술 연산: column + ?', async () => {
      await db.runAsync('UPDATE items SET count = count + ? WHERE id = ?', 7, 'a');
      const row = await db.getFirstAsync<any>('SELECT * FROM items WHERE id = ?', 'a');
      expect(row.count).toBe(7);
    });

    it('WHERE 불일치 시 변경 없음', async () => {
      const result = await db.runAsync('UPDATE items SET label = ? WHERE id = ?', 'x', 'zzz');
      expect(result.changes).toBe(0);
    });
  });

  describe('SELECT', () => {
    beforeEach(async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS products (name TEXT, price INTEGER, cat TEXT)');
      await db.runAsync('INSERT INTO products (name, price, cat) VALUES (?, ?, ?)', 'A', 10, 'food');
      await db.runAsync('INSERT INTO products (name, price, cat) VALUES (?, ?, ?)', 'B', 20, 'food');
      await db.runAsync('INSERT INTO products (name, price, cat) VALUES (?, ?, ?)', 'C', 30, 'drink');
    });

    it('SELECT * 전체 반환', async () => {
      const rows = await db.getAllAsync('SELECT * FROM products');
      expect(rows).toHaveLength(3);
    });

    it('SELECT * WHERE =', async () => {
      const rows = await db.getAllAsync('SELECT * FROM products WHERE cat = ?', 'food');
      expect(rows).toHaveLength(2);
    });

    it('SELECT COUNT(*)', async () => {
      const row = await db.getFirstAsync<any>('SELECT COUNT(*) as cnt FROM products');
      expect(row.cnt).toBe(3);
    });

    it('SELECT COUNT(*) WHERE', async () => {
      const row = await db.getFirstAsync<any>('SELECT COUNT(*) as cnt FROM products WHERE cat = ?', 'food');
      expect(row.cnt).toBe(2);
    });

    it('WHERE >= 연산자', async () => {
      const rows = await db.getAllAsync('SELECT * FROM products WHERE price >= ?', 20);
      expect(rows).toHaveLength(2);
    });

    it('WHERE <= 연산자', async () => {
      const rows = await db.getAllAsync('SELECT * FROM products WHERE price <= ?', 20);
      expect(rows).toHaveLength(2);
    });

    it('WHERE > 연산자', async () => {
      const rows = await db.getAllAsync('SELECT * FROM products WHERE price > ?', 20);
      expect(rows).toHaveLength(1);
    });

    it('WHERE < 연산자', async () => {
      const rows = await db.getAllAsync('SELECT * FROM products WHERE price < ?', 20);
      expect(rows).toHaveLength(1);
    });

    it('다중 AND 조건', async () => {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM products WHERE cat = ? AND price >= ?', 'food', 15,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('B');
    });

    it('getFirstAsync 결과 없으면 null', async () => {
      expect(await db.getFirstAsync('SELECT * FROM products WHERE name = ?', 'Z')).toBeNull();
    });

    it('단일 컬럼 SELECT', async () => {
      const rows = await db.getAllAsync<any>('SELECT name FROM products WHERE cat = ?', 'drink');
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('C');
    });

    it('key-value SELECT', async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT, value TEXT)');
      await db.runAsync('INSERT INTO kv (key, value) VALUES (?, ?)', 'a', '1');
      const rows = await db.getAllAsync<any>('SELECT key, value FROM kv');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual(expect.objectContaining({ key: 'a', value: '1' }));
    });
  });

  describe('runAsync - DELETE', () => {
    beforeEach(async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS items (id TEXT, label TEXT)');
      await db.runAsync('INSERT INTO items (id, label) VALUES (?, ?)', 'a', 'alpha');
      await db.runAsync('INSERT INTO items (id, label) VALUES (?, ?)', 'b', 'beta');
      await db.runAsync('INSERT INTO items (id, label) VALUES (?, ?)', 'c', 'gamma');
    });

    it('WHERE 조건으로 삭제', async () => {
      const result = await db.runAsync('DELETE FROM items WHERE id = ?', 'b');
      expect(result.changes).toBe(1);
      const rows = await db.getAllAsync('SELECT * FROM items');
      expect(rows).toHaveLength(2);
    });

    it('WHERE 없이 전체 삭제', async () => {
      const result = await db.runAsync('DELETE FROM items');
      expect(result.changes).toBe(3);
      const rows = await db.getAllAsync('SELECT * FROM items');
      expect(rows).toHaveLength(0);
    });

    it('일치하는 행이 없으면 changes 0', async () => {
      const result = await db.runAsync('DELETE FROM items WHERE id = ?', 'zzz');
      expect(result.changes).toBe(0);
      const rows = await db.getAllAsync('SELECT * FROM items');
      expect(rows).toHaveLength(3);
    });
  });

  describe('runAsync - unrecognized SQL', () => {
    it('인식 못하는 SQL은 무시', async () => {
      const result = await db.runAsync('DROP TABLE IF EXISTS foo');
      expect(result.changes).toBe(0);
    });
  });

  describe('closeAsync', () => {
    it('테이블 초기화', async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS t (id TEXT)');
      await db.runAsync('INSERT INTO t (id) VALUES (?)', 'x');
      await db.closeAsync();
      // after close, tables are cleared
      const rows = await db.getAllAsync('SELECT * FROM t');
      expect(rows).toEqual([]);
    });
  });
});
