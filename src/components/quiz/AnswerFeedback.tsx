import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';

interface Props {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
}

export function AnswerFeedback({ isCorrect, correctAnswer, userAnswer }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCorrect) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [isCorrect, scaleAnim, shakeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        isCorrect ? styles.correct : styles.wrong,
        {
          transform: [
            { scale: scaleAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      <Ionicons
        name={isCorrect ? 'checkmark-circle' : 'close-circle'}
        size={56}
        color={isCorrect ? Colors.success : Colors.error}
      />
      <Text style={[styles.label, { color: isCorrect ? Colors.success : Colors.error }]}>
        {isCorrect ? '정답!' : '오답'}
      </Text>
      {!isCorrect && (
        <View style={styles.answerSection}>
          <Text style={styles.wrongAnswer}>내 답: {userAnswer}</Text>
          <Text style={styles.correctAnswer}>정답: {correctAnswer}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
    width: '100%',
  },
  correct: {
    backgroundColor: '#D1FAE5',
    borderColor: Colors.success,
    borderWidth: 2,
  },
  wrong: {
    backgroundColor: '#FEE2E2',
    borderColor: Colors.error,
    borderWidth: 2,
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
