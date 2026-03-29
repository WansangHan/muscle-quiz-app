import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { MASTERY_LABELS } from '../../constants/quiz';
import { FontSize, Spacing, BorderRadius } from '../../constants/spacing';
import { MasteryLevel } from '../../types/progress';

interface Props {
  level: MasteryLevel;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function MasteryBadge({ level, size = 'sm', showLabel = true }: Props) {
  const color = Colors.mastery[level];
  const isMd = size === 'md';

  return (
    <View style={[styles.badge, { backgroundColor: color + '1A' }, isMd && styles.badgeMd]}>
      <View style={[styles.dot, { backgroundColor: color }, isMd && styles.dotMd]} />
      {showLabel && (
        <Text style={[styles.label, { color }, isMd && styles.labelMd]}>
          {MASTERY_LABELS[level]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotMd: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  labelMd: {
    fontSize: FontSize.sm,
  },
});
