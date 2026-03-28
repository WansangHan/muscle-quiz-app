import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDb } from '../db/client';
import { runMigrations } from '../db/migrations';
import { seedDatabase } from '../data/seed';

interface DatabaseState {
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseState>({ isReady: false, error: null });

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseState>({ isReady: false, error: null });

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        await runMigrations(db);
        await seedDatabase(db);
        setState({ isReady: true, error: null });
      } catch (err) {
        console.error('Database init failed:', err);
        setState({ isReady: false, error: String(err) });
      }
    })();
  }, []);

  return React.createElement(DatabaseContext.Provider, { value: state }, children);
}

export function useDatabase(): DatabaseState {
  return useContext(DatabaseContext);
}
