import { getDb } from './client';
import { BodyRegion } from '../types/muscle';

interface MuscleRow {
  id: string;
  korean_common: string;
  korean_anatomical: string;
  latin_english: string;
  body_region: string;
  muscle_group: string;
  difficulty: number;
  image_asset: string;
  related_muscles: string | null;
  tags: string | null;
}

export async function getAllMuscles(): Promise<MuscleRow[]> {
  const db = await getDb();
  return db.getAllAsync<MuscleRow>('SELECT * FROM muscles ORDER BY body_region, id');
}

export async function getMuscleById(id: string): Promise<MuscleRow | null> {
  const db = await getDb();
  return db.getFirstAsync<MuscleRow>('SELECT * FROM muscles WHERE id = ?', id);
}

export async function getMusclesByRegion(region: BodyRegion): Promise<MuscleRow[]> {
  const db = await getDb();
  return db.getAllAsync<MuscleRow>(
    'SELECT * FROM muscles WHERE body_region = ? ORDER BY id',
    region,
  );
}
