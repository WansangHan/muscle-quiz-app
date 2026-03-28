import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { TodaySummary } from '../components/home/TodaySummary';
import { useScheduler } from '../hooks/useScheduler';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { QuizCard } from '../types/quiz';

export type HomeStackParamList = {
  Home: undefined;
  Quiz: { cards: QuizCard[] };
};

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { dueCount, newCardsRemaining, totalMastered, loading, refresh, buildQuizDeck } =
    useScheduler();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleStartQuiz = async () => {
    const cards = await buildQuizDeck(20);
    if (cards.length === 0) {
      return; // No cards available
    }
    navigation.navigate('Quiz', { cards });
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

      <TodaySummary
        dueCount={dueCount}
        newCardsRemaining={newCardsRemaining}
        totalMastered={totalMastered}
      />

      <TouchableOpacity
        style={[styles.startButton, totalAvailable === 0 && styles.startButtonDisabled]}
        onPress={handleStartQuiz}
        disabled={totalAvailable === 0}
      >
        <Text style={styles.startButtonText}>
          {totalAvailable > 0 ? '학습 시작' : '오늘 학습 완료!'}
        </Text>
        {totalAvailable > 0 && (
          <Text style={styles.startButtonSub}>{totalAvailable}장 학습 가능</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>학습 방법</Text>
        <Text style={styles.infoText}>
          근육 이미지를 보고 이름을 직접 타이핑하세요.{'\n'}
          틀린 문제는 자동으로 복습 일정에 추가됩니다.
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
});
