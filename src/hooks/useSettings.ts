import { useCallback, useEffect, useState } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';
import { getSettings, updateSetting } from '../db/settingsRepository';
import { SettingsKey } from '../constants/settingsKeys';
import { useDatabase } from './useDatabase';

export function useSettings() {
  const { isReady } = useDatabase();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  const load = useCallback(async () => {
    if (!isReady) return;
    const s = await getSettings();
    setSettings(s);
  }, [isReady]);

  useEffect(() => {
    load();
  }, [load]);

  const setDailyNewLimit = useCallback(async (limit: number) => {
    await updateSetting(SettingsKey.DailyNewLimit, String(limit));
    setSettings((prev) => ({ ...prev, dailyNewLimit: limit }));
  }, []);

  const setLatinMode = useCallback(async (enabled: boolean) => {
    await updateSetting(SettingsKey.LatinMode, enabled ? '1' : '0');
    setSettings((prev) => ({ ...prev, latinMode: enabled }));
  }, []);

  return { settings, setDailyNewLimit, setLatinMode, reload: load };
}
