import { MemoryDatabase } from '../../src/db/memoryDb';
import { runMigrations } from '../../src/db/migrations';

let db: MemoryDatabase;

jest.mock('../../src/db/client', () => ({
  getDb: jest.fn(),
}));

import { getDb } from '../../src/db/client';
import { getSettings, updateSetting } from '../../src/db/settingsRepository';
import { SettingsKey } from '../../src/constants/settingsKeys';

beforeEach(async () => {
  db = new MemoryDatabase();
  await runMigrations(db);
  (getDb as jest.Mock).mockResolvedValue(db);
});

describe('settingsRepository', () => {
  describe('getSettings', () => {
    it('설정이 없으면 기본값 반환', async () => {
      const s = await getSettings();
      expect(s.latinMode).toBe(false);
      expect(s.dailyNewLimit).toBe(10);
      expect(s.notificationEnabled).toBe(false);
      expect(s.notificationTime).toBe('20:00');
    });
  });

  describe('updateSetting + getSettings', () => {
    it('설정 변경 후 읽기', async () => {
      await updateSetting(SettingsKey.LatinMode, '1');
      await updateSetting(SettingsKey.DailyNewLimit, '20');

      const s = await getSettings();
      expect(s.latinMode).toBe(true);
      expect(s.dailyNewLimit).toBe(20);
    });

    it('같은 키를 덮어쓰기', async () => {
      await updateSetting(SettingsKey.LatinMode, '1');
      await updateSetting(SettingsKey.LatinMode, '0');

      const s = await getSettings();
      expect(s.latinMode).toBe(false);
    });

    it('notification 토글', async () => {
      await updateSetting(SettingsKey.NotificationEnabled, '1');
      expect((await getSettings()).notificationEnabled).toBe(true);

      await updateSetting(SettingsKey.NotificationEnabled, '0');
      expect((await getSettings()).notificationEnabled).toBe(false);
    });
  });
});
