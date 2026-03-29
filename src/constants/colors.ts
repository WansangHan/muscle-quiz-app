export const Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  secondary: '#64748B',
  accent: '#F59E0B',
  accentDark: '#D97706',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  cardBackground: '#FFFFFF',
  overlay: 'rgba(15,23,42,0.5)',

  region: {
    chest: '#EF4444',
    back: '#3B82F6',
    shoulder: '#8B5CF6',
    arm: '#10B981',
    abdomen: '#F59E0B',
    glute: '#EC4899',
    thigh_front: '#06B6D4',
    thigh_back: '#14B8A6',
    thigh_inner: '#6366F1',
    calf: '#84CC16',
    neck: '#F97316',
  } as Record<string, string>,

  mastery: {
    0: '#94A3B8', // 새카드 - 슬레이트
    1: '#F59E0B', // 학습중 - 앰버
    2: '#3B82F6', // 익숙함 - 블루
    3: '#10B981', // 능숙함 - 에메랄드
    4: '#8B5CF6', // 완전숙달 - 바이올렛
  } as Record<number, string>,
};
