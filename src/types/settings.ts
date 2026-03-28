import { Difficulty } from './quiz';

export interface UserSettings {
  difficulty: Difficulty;
  dailyNewLimit: number;
  notificationEnabled: boolean;
  notificationTime: string; // HH:mm
}

export const DEFAULT_SETTINGS: UserSettings = {
  difficulty: 'beginner',
  dailyNewLimit: 10,
  notificationEnabled: false,
  notificationTime: '20:00',
};
