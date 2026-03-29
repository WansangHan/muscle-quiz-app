import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing, BorderRadius } from '../../constants/spacing';
import { MasteryLevel } from '../../types/progress';

interface Props {
  streak: number;
  threshold: number;
  level: MasteryLevel;
}

export function StreakProgress({ streak, threshold, level }: Props) {
  const color = Colors.mastery[level];
  const pct = Math.min((streak / threshold) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
      <Text style={styles.text}>
        연속 {streak}/{threshold} 정답
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  text: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
