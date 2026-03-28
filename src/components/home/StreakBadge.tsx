import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';

interface Props {
  streak: number;
  totalDays: number;
}

export function StreakBadge({ streak, totalDays }: Props) {
  if (streak === 0 && totalDays === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.streakBox}>
        <Text style={styles.streakIcon}>{'🔥'}</Text>
        <Text style={styles.streakValue}>{streak}</Text>
        <Text style={styles.streakLabel}>일 연속</Text>
      </View>
      <View style={styles.totalBox}>
        <Text style={styles.totalValue}>{totalDays}일</Text>
        <Text style={styles.totalLabel}>총 학습</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
  },
  streakIcon: {
    fontSize: 18,
  },
  streakValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#E65100',
  },
  streakLabel: {
    fontSize: FontSize.sm,
    color: '#E65100',
  },
  totalBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  totalLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
