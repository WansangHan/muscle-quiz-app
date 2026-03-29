import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../../constants/spacing';

interface Props {
  dueCount: number;
  newCardsRemaining: number;
  studiedToday: number;
  nearPromotion?: number;
}

export function TodaySummary({ dueCount, newCardsRemaining, studiedToday, nearPromotion = 0 }: Props) {
  const todayTotal = studiedToday + dueCount + newCardsRemaining;
  const progressPct = todayTotal > 0 ? studiedToday / todayTotal : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 학습</Text>
      <View style={styles.statsRow}>
        <StatBox label="복습 대기" value={dueCount} color={Colors.accent} />
        <StatBox label="새 카드" value={newCardsRemaining} color={Colors.primary} />
        {nearPromotion > 0 && (
          <StatBox label="레벨업 직전" value={nearPromotion} color={Colors.success} />
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>오늘 진행률</Text>
          <Text style={styles.progressValue}>{studiedToday} / {todayTotal} 완료</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
        </View>
        <Text style={styles.progressBreakdown}>
          학습 완료 {studiedToday} + 복습 대기 {dueCount} + 새 카드 {newCardsRemaining}
        </Text>
      </View>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBreakdown: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
});
