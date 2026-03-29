export interface UserSettings {
  latinMode: boolean;
  dailyNewLimit: number;
  notificationEnabled: boolean;
  notificationTime: string; // HH:mm
}

export const DEFAULT_SETTINGS: UserSettings = {
  latinMode: false,
  dailyNewLimit: 10,
  notificationEnabled: false,
  notificationTime: '20:00',
};
