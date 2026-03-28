export const Colors = {
  primary: '#4A90D9',
  primaryDark: '#3A7BC8',
  secondary: '#6C757D',
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  border: '#DEE2E6',
  cardBackground: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',

  mastery: {
    0: '#ADB5BD', // 새카드 - 회색
    1: '#FFC107', // 학습중 - 노랑
    2: '#17A2B8', // 익숙함 - 파랑
    3: '#28A745', // 능숙함 - 초록
    4: '#6F42C1', // 완전숙달 - 보라
  } as Record<number, string>,
};
