import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';

interface Props {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
}

export function AnswerFeedback({ isCorrect, correctAnswer, userAnswer }: Props) {
  return (
    <View style={[styles.container, isCorrect ? styles.correct : styles.wrong]}>
      <Text style={styles.icon}>{isCorrect ? 'O' : 'X'}</Text>
      <Text style={styles.label}>
        {isCorrect ? '정답!' : '오답'}
      </Text>
      {!isCorrect && (
        <View style={styles.answerSection}>
          <Text style={styles.wrongAnswer}>내 답: {userAnswer}</Text>
          <Text style={styles.correctAnswer}>정답: {correctAnswer}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  correct: {
    backgroundColor: '#d4edda',
    borderColor: Colors.success,
    borderWidth: 2,
  },
  wrong: {
    backgroundColor: '#f8d7da',
    borderColor: Colors.error,
    borderWidth: 2,
  },
  icon: {
    fontSize: 48,
    fontWeight: '800',
  },
  label: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  answerSection: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  wrongAnswer: {
    fontSize: FontSize.md,
    color: Colors.error,
    textDecorationLine: 'line-through',
  },
  correctAnswer: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.success,
    marginTop: Spacing.xs,
  },
});
