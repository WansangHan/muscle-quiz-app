import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MasteryBadge } from '../common/MasteryBadge';
import { StreakProgress } from '../common/StreakProgress';
import { Colors } from '../../constants/colors';
import { MASTERY_LABELS } from '../../constants/quiz';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';
import { MasteryLevel } from '../../types/progress';

interface Props {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  previousLevel: MasteryLevel;
  newLevel: MasteryLevel;
  newStreak: number;
  promotionThreshold: number;
  didLevelUp: boolean;
}

export function AnswerFeedback({
  isCorrect,
  correctAnswer,
  userAnswer,
  previousLevel,
  newLevel,
  newStreak,
  promotionThreshold,
  didLevelUp,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const levelUpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCorrect) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 5,
        useNativeDriver: true,
      }).start();
      if (didLevelUp) {
        Animated.spring(levelUpAnim, {
          toValue: 1,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }
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
  }, [isCorrect, scaleAnim, shakeAnim, levelUpAnim, didLevelUp]);

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

      {isCorrect && !didLevelUp && (
        <View style={styles.masterySection}>
          <MasteryBadge level={newLevel} />
          {newLevel < 4 && (
            <View style={styles.streakContainer}>
              <StreakProgress
                streak={newStreak}
                threshold={promotionThreshold}
                level={newLevel}
              />
            </View>
          )}
        </View>
      )}

      {isCorrect && didLevelUp && (
        <Animated.View
          style={[
            styles.levelUpSection,
            { transform: [{ scale: levelUpAnim }] },
          ]}
        >
          <Text style={styles.levelUpLabel}>레벨업!</Text>
          <View style={styles.levelTransition}>
            <View style={[styles.levelPill, { backgroundColor: Colors.mastery[previousLevel] + '33' }]}>
              <Text style={[styles.levelPillText, { color: Colors.mastery[previousLevel] }]}>
                {MASTERY_LABELS[previousLevel]}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} style={styles.arrow} />
            <View style={[styles.levelPill, { backgroundColor: Colors.mastery[newLevel] + '33' }]}>
              <Text style={[styles.levelPillText, { color: Colors.mastery[newLevel] }]}>
                {MASTERY_LABELS[newLevel]}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {!isCorrect && (
        <View style={styles.answerSection}>
          <Text style={styles.wrongAnswer}>내 답: {userAnswer}</Text>
          <Text style={styles.correctAnswer}>정답: {correctAnswer}</Text>
          <View style={styles.demoteInfo}>
            <MasteryBadge level={newLevel} />
            <Text style={styles.demoteText}>· 다음 복습: 12시간 후</Text>
          </View>
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
  masterySection: {
    marginTop: Spacing.md,
    alignItems: 'center',
    width: '80%',
  },
  streakContainer: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  levelUpSection: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  levelUpLabel: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  levelTransition: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  levelPillText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  arrow: {
    marginHorizontal: Spacing.sm,
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
  demoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  demoteText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
});
