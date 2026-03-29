import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { PressableScale } from '../components/common/PressableScale';
import { MasteryDistributionBar } from '../components/common/MasteryDistributionBar';
import { TodaySummary } from '../components/home/TodaySummary';
import { StreakBadge } from '../components/home/StreakBadge';
import { useScheduler } from '../hooks/useScheduler';
import { useSettings } from '../hooks/useSettings';
import { getCurrentStreak, getTotalStudyDays } from '../db/streakRepository';
import { getMasteryDistribution, getNearPromotionCount, getUnlockedCount } from '../db/progressRepository';
import { MUSCLES } from '../data/muscles';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { QuizCard } from '../types/quiz';
import { Routes } from '../constants/routes';

export type HomeStackParamList = {
  Home: undefined;
  Quiz: { cards: QuizCard[]; latinMode: boolean };
};

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { dueCount, newCardsRemaining, studiedToday, loading, refresh, buildQuizDeck } =
    useScheduler();
  const { settings } = useSettings();
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
  const [nearPromotion, setNearPromotion] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refresh();
      getCurrentStreak().then(setStreak).catch(() => {});
      getTotalStudyDays().then(setTotalDays).catch(() => {});
      getMasteryDistribution().then(setDistribution).catch(() => {});
      getNearPromotionCount().then(setNearPromotion).catch(() => {});
      getUnlockedCount().then(setUnlockedCount).catch(() => {});
    }, [refresh]),
  );

  const handleStartQuiz = async () => {
    const cards = await buildQuizDeck(20);
    if (cards.length === 0) {
      return; // No cards available
    }
    navigation.navigate(Routes.Quiz, { cards, latinMode: settings.latinMode });
  };

  const totalAvailable = dueCount + newCardsRemaining;

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Text style={styles.header}>근육 퀴즈</Text>

      <StreakBadge streak={streak} totalDays={totalDays} />

      <TodaySummary
        dueCount={dueCount}
        newCardsRemaining={newCardsRemaining}
        studiedToday={studiedToday}
        nearPromotion={nearPromotion}
      />

      <PressableScale
        style={[styles.startButton, totalAvailable === 0 && styles.startButtonDisabled]}
        onPress={handleStartQuiz}
        disabled={totalAvailable === 0}
      >
        <Text style={styles.startButtonText}>
          {totalAvailable > 0 ? '학습 시작' : '오늘 학습 완료!'}
        </Text>
        {totalAvailable > 0 && (
          <Text style={styles.startButtonSub}>
            복습 {dueCount}장 + 새 카드 {newCardsRemaining}장
          </Text>
        )}
      </PressableScale>

      {unlockedCount > 0 && (
        <View style={styles.distributionCard}>
          <Text style={styles.distributionTitle}>전체 숙련도</Text>
          <MasteryDistributionBar distribution={distribution} height={14} showLegend />
          <Text style={styles.distributionSub}>
            {MUSCLES.length}개 중 {unlockedCount}개 학습 중
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>학습 방법</Text>
        <Text style={styles.infoText}>
          {unlockedCount === 0
            ? '근육 이미지를 보고 이름을 타이핑하며 학습해요.\n반복할수록 숙련도가 올라갑니다!'
            : distribution[4] > 0
              ? `완전숙달 ${distribution[4]}개! 숙달한 근육은 간격을 넓혀 복습해요.`
              : nearPromotion > 0
                ? `연속 정답을 쌓으면 숙련도가 올라가요.\n현재 ${nearPromotion}개 근육이 레벨업 직전!`
                : '근육 이미지를 보고 이름을 직접 타이핑하세요.\n틀린 문제는 자동으로 복습 일정에 추가됩니다.'}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonDisabled: {
    backgroundColor: Colors.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  startButtonSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  distributionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  distributionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  distributionSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
});
