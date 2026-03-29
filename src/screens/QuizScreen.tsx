import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { PressableScale } from '../components/common/PressableScale';
import { ProgressBar } from '../components/quiz/ProgressBar';
import { QuizCardComponent } from '../components/quiz/QuizCard';
import { AnswerFeedback } from '../components/quiz/AnswerFeedback';
import { useQuizEngine } from '../hooks/useQuizEngine';
import { WRONG_ANSWER_DISPLAY_MS } from '../constants/quiz';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { HomeStackParamList } from './HomeScreen';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

function CountdownBar({ durationMs }: { durationMs: number }) {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: durationMs,
      useNativeDriver: false,
    }).start();
  }, [progress, durationMs]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={countdownStyles.track}>
      <Animated.View style={[countdownStyles.fill, { width }]} />
    </View>
  );
}

const countdownStyles = StyleSheet.create({
  track: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.error,
    borderRadius: 2,
  },
});

export function QuizScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'Quiz'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { cards } = route.params;

  const engine = useQuizEngine(cards);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevIndexRef = useRef(0);

  useEffect(() => {
    if (engine.currentIndex !== prevIndexRef.current) {
      prevIndexRef.current = engine.currentIndex;
      slideAnim.setValue(80);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [engine.currentIndex, slideAnim, fadeAnim]);

  if (engine.state === 'complete') {
    const summary = engine.getSummary();
    const accuracyPct = Math.round(summary.accuracy * 100);
    const encouragement =
      accuracyPct === 100 ? '완벽해요!' :
      accuracyPct >= 80 ? '훌륭해요!' :
      accuracyPct >= 60 ? '좋은 출발이에요!' :
      '다음엔 더 잘할 수 있어요!';
    const encouragementColor =
      accuracyPct === 100 ? Colors.accent :
      accuracyPct >= 80 ? Colors.success :
      accuracyPct >= 60 ? Colors.primary :
      Colors.textSecondary;

    return (
      <ScreenWrapper>
        <View style={styles.completeContainer}>
          <Ionicons name="trophy" size={64} color={encouragementColor} />
          <Text style={[styles.encouragement, { color: encouragementColor }]}>
            {encouragement}
          </Text>
          <Text style={styles.completeTitle}>학습 완료!</Text>

          <View style={styles.summaryCard}>
            <SummaryRow label="총 문제" value={`${summary.totalCards}문제`} />
            <SummaryRow label="정답" value={`${summary.correctCount}문제`} color={Colors.success} />
            <SummaryRow label="오답" value={`${summary.wrongCount}문제`} color={Colors.error} />
            <SummaryRow
              label="정답률"
              value={`${accuracyPct}%`}
              color={Colors.primary}
            />
          </View>

          {summary.wrongCount > 0 && (
            <PressableScale
              style={styles.retryButton}
              onPress={() => {
                const wrongCards = cards.filter((c) =>
                  engine.wrongMuscleIds.includes(c.muscle.id)
                );
                if (wrongCards.length > 0) {
                  navigation.replace('Quiz', { cards: wrongCards });
                }
              }}
            >
              <Text style={styles.retryButtonText}>틀린 문제 다시 풀기</Text>
            </PressableScale>
          )}

          <PressableScale
            style={styles.homeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
          </PressableScale>
        </View>
      </ScreenWrapper>
    );
  }

  const showFeedback = engine.state === 'correct_feedback' || engine.state === 'wrong_feedback';

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ProgressBar current={engine.currentIndex + 1} total={engine.totalCards} />

        {showFeedback && engine.currentCard ? (
          <View style={styles.feedbackContainer}>
            {engine.state === 'wrong_feedback' && (
              <View style={styles.wrongImageContainer}>
                <Image
                  source={engine.currentCard.muscle.imageAsset}
                  style={styles.wrongImage}
                  resizeMode="contain"
                />
              </View>
            )}
            <AnswerFeedback
              isCorrect={engine.state === 'correct_feedback'}
              correctAnswer={engine.currentCard.requiredAnswers.join(' / ')}
              userAnswer={engine.results[engine.results.length - 1]?.userAnswer ?? ''}
            />
            <PressableScale style={styles.nextButton} onPress={engine.nextCard}>
              <Text style={styles.nextButtonText}>
                {engine.state === 'correct_feedback' ? '다음 문제' : '이미 외웠어요'}
              </Text>
            </PressableScale>
            {engine.state === 'wrong_feedback' && (
              <CountdownBar durationMs={WRONG_ANSWER_DISPLAY_MS} />
            )}
          </View>
        ) : engine.currentCard ? (
          <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
            <QuizCardComponent
              card={engine.currentCard}
              hintLevel={engine.hintLevel}
              answerIndex={engine.currentAnswerIndex}
              totalAnswers={engine.totalAnswersForCard}
              isClose={engine.isClose}
              onSubmit={engine.submitAnswer}
              onHint={engine.useHint}
            />
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  feedbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    alignItems: 'center' as const,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  wrongImageContainer: {
    width: 160,
    height: 120,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  wrongImage: {
    width: '80%',
    height: '80%',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  encouragement: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  completeTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    alignItems: 'center' as const,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  homeButton: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
  },
  homeButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
