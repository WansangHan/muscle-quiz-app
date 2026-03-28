import { useCallback, useEffect, useState } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';
import { getSettings, updateSetting } from '../db/settingsRepository';
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
    await updateSetting('daily_new_limit', String(limit));
    setSettings((prev) => ({ ...prev, dailyNewLimit: limit }));
  }, []);

  return { settings, setDailyNewLimit, reload: load };
}
