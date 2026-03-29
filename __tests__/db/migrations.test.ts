import { MemoryDatabase } from '../../src/db/memoryDb';
import { runMigrations } from '../../src/db/migrations';

describe('migrations', () => {
  describe('Version 2: difficulty → latinMode', () => {
    async function setupAtVersion1(db: MemoryDatabase) {
      // Run migrations once (creates schema at version 2)
      // But we want to simulate version 1 state, so run manually:
      await runMigrations(db);
      // Reset to version 1 to simulate upgrade scenario
      await db.runAsync("UPDATE _meta SET value = '1' WHERE key = 'schema_version'");
      // Remove any latin_mode that migration 2 may have set (it won't since no difficulty key)
      await db.runAsync("DELETE FROM user_settings WHERE key = 'latin_mode'");
    }

    it('beginner → latin_mode 0', async () => {
      const db = new MemoryDatabase();
      await setupAtVersion1(db);
      await db.runAsync(
        "INSERT INTO user_settings (key, value) VALUES ('difficulty', 'beginner')"
      );

      await runMigrations(db);

      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'latin_mode'"
      );
      expect(row?.value).toBe('0');

      const old = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'difficulty'"
      );
      expect(old).toBeNull();
    });

    it('intermediate → latin_mode 1', async () => {
      const db = new MemoryDatabase();
      await setupAtVersion1(db);
      await db.runAsync(
        "INSERT INTO user_settings (key, value) VALUES ('difficulty', 'intermediate')"
      );

      await runMigrations(db);

      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'latin_mode'"
      );
      expect(row?.value).toBe('1');
    });

    it('advanced → latin_mode 1', async () => {
      const db = new MemoryDatabase();
      await setupAtVersion1(db);
      await db.runAsync(
        "INSERT INTO user_settings (key, value) VALUES ('difficulty', 'advanced')"
      );

      await runMigrations(db);

      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'latin_mode'"
      );
      expect(row?.value).toBe('1');
    });

    it('difficulty 키가 없으면 latin_mode도 생성하지 않음', async () => {
      const db = new MemoryDatabase();
      await setupAtVersion1(db);

      await runMigrations(db);

      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'latin_mode'"
      );
      expect(row).toBeNull();
    });
  });

  describe('schema version tracking', () => {
    it('최신 버전이면 마이그레이션 스킵', async () => {
      const db = new MemoryDatabase();
      await runMigrations(db);

      const before = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM _meta WHERE key = 'schema_version'"
      );

      // Run again — should be a no-op
      await runMigrations(db);

      const after = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM _meta WHERE key = 'schema_version'"
      );
      expect(after?.value).toBe(before?.value);
    });

    it('중간 버전에서 업그레이드 시 schema_version UPDATE', async () => {
      const db = new MemoryDatabase();
      await runMigrations(db);
      // Simulate being at version 1
      await db.runAsync("UPDATE _meta SET value = '1' WHERE key = 'schema_version'");

      await runMigrations(db);

      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM _meta WHERE key = 'schema_version'"
      );
      expect(row?.value).toBe('2');
    });
  });
});
