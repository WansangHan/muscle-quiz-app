import { Platform } from 'react-native';
import { Database } from './types';
import { MemoryDatabase } from './memoryDb';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    if (Platform.OS === 'web') {
      dbInstance = new MemoryDatabase();
    } else {
      const SQLite = await import('expo-sqlite');
      const nativeDb = await SQLite.openDatabaseAsync('muscle-quiz.db');
      await nativeDb.execAsync('PRAGMA journal_mode = WAL;');
      dbInstance = nativeDb as unknown as Database;
    }
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
