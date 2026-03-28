import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { ProgressBar } from '../components/quiz/ProgressBar';
import { QuizCardComponent } from '../components/quiz/QuizCard';
import { AnswerFeedback } from '../components/quiz/AnswerFeedback';
import { useQuizEngine } from '../hooks/useQuizEngine';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { HomeStackParamList } from './HomeScreen';

export function QuizScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'Quiz'>>();
  const navigation = useNavigation();
  const { cards } = route.params;

  const engine = useQuizEngine(cards);

  if (engine.state === 'complete') {
    const summary = engine.getSummary();
    return (
      <ScreenWrapper>
        <View style={styles.completeContainer}>
          <Text style={styles.completeTitle}>학습 완료!</Text>

          <View style={styles.summaryCard}>
            <SummaryRow label="총 문제" value={`${summary.totalCards}문제`} />
            <SummaryRow label="정답" value={`${summary.correctCount}문제`} color={Colors.success} />
            <SummaryRow label="오답" value={`${summary.wrongCount}문제`} color={Colors.error} />
            <SummaryRow
              label="정답률"
              value={`${Math.round(summary.accuracy * 100)}%`}
              color={Colors.primary}
            />
          </View>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
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
            <AnswerFeedback
              isCorrect={engine.state === 'correct_feedback'}
              correctAnswer={engine.currentCard.requiredAnswers.join(' / ')}
              userAnswer={engine.results[engine.results.length - 1]?.userAnswer ?? ''}
            />
            {engine.state === 'correct_feedback' && (
              <TouchableOpacity style={styles.nextButton} onPress={engine.nextCard}>
                <Text style={styles.nextButtonText}>다음 문제</Text>
              </TouchableOpacity>
            )}
            {engine.state === 'wrong_feedback' && (
              <Text style={styles.waitText}>잠시 후 다음 문제로 넘어갑니다...</Text>
            )}
          </View>
        ) : engine.currentCard ? (
          <QuizCardComponent
            card={engine.currentCard}
            hintLevel={engine.hintLevel}
            answerIndex={engine.currentAnswerIndex}
            totalAnswers={engine.totalAnswersForCard}
            isClose={engine.isClose}
            onSubmit={engine.submitAnswer}
            onHint={engine.useHint}
          />
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
  },
  nextButtonText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  waitText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
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
  homeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
