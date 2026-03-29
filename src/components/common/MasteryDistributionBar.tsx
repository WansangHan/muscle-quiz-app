import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { MASTERY_LABELS } from '../../constants/quiz';
import { FontSize, Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  distribution: Record<number, number>;
  height?: number;
  showLegend?: boolean;
}

export function MasteryDistributionBar({ distribution, height = 12, showLegend = false }: Props) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const levels = [0, 1, 2, 3, 4];

  return (
    <View>
      <View style={[styles.bar, { height }]}>
        {levels.map((level) => {
          const count = distribution[level] ?? 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <View
              key={level}
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: Colors.mastery[level],
              }}
            />
          );
        })}
      </View>
      {showLegend && (
        <View style={styles.legend}>
          {levels.map((level) => {
            const count = distribution[level] ?? 0;
            if (count === 0) return null;
            return (
              <View key={level} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.mastery[level] }]} />
                <Text style={styles.legendText}>
                  {MASTERY_LABELS[level]} {count}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
