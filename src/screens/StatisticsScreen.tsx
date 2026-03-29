import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PressableScale } from '../components/common/PressableScale';
import { MasteryBadge } from '../components/common/MasteryBadge';
import { MasteryDistributionBar } from '../components/common/MasteryDistributionBar';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { getAllProgress } from '../db/progressRepository';
import { useScheduler } from '../hooks/useScheduler';
import { useSettings } from '../hooks/useSettings';
import { MUSCLES, BODY_REGION_LABELS } from '../data/muscles';
import { BodyRegion } from '../constants/bodyRegion';
import { Colors } from '../constants/colors';
import { MASTERY_LABELS } from '../constants/quiz';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { MasteryLevel } from '../types/progress';
import { Routes } from '../constants/routes';
import { useDatabase } from '../hooks/useDatabase';

interface RegionStats {
  region: BodyRegion;
  label: string;
  total: number;
  mastered: number;
  avgLevel: number;
  distribution: Record<number, number>;
}

interface WeakMuscle {
  id: string;
  name: string;
  correctRate: number;
  totalReviews: number;
  masteryLevel: MasteryLevel;
}

export function StatisticsScreen() {
  const { isReady } = useDatabase();
  const navigation = useNavigation<any>();
  const { buildCardsForMuscleIds } = useScheduler();
  const { settings } = useSettings();
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakMuscle[]>([]);
  const [overallStats, setOverallStats] = useState({ total: 0, unlocked: 0, mastered: 0, accuracy: 0 });

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      loadStats();
    }, [isReady]),
  );

  const loadStats = async () => {
    const progress = await getAllProgress();
    const progressMap = new Map(progress.map((p) => [p.muscleId, p]));
    const muscleMap = new Map(MUSCLES.map((m) => [m.id, m]));

    // Overall
    const unlocked = progress.filter((p) => p.isUnlocked);
    const mastered = progress.filter((p) => p.masteryLevel >= 4);
    const totalReviews = progress.reduce((sum, p) => sum + p.totalReviews, 0);
    const totalCorrect = progress.reduce((sum, p) => sum + p.totalCorrect, 0);

    setOverallStats({
      total: MUSCLES.length,
      unlocked: unlocked.length,
      mastered: mastered.length,
      accuracy: totalReviews > 0 ? totalCorrect / totalReviews : 0,
    });

    // Region stats
    const regions = new Map<BodyRegion, { total: number; levels: number[]; mastered: number; distribution: Record<number, number> }>();
    for (const muscle of MUSCLES) {
      const entry = regions.get(muscle.bodyRegion) ?? { total: 0, levels: [], mastered: 0, distribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 } };
      entry.total++;
      const p = progressMap.get(muscle.id);
      if (p && p.isUnlocked) {
        entry.levels.push(p.masteryLevel);
        entry.distribution[p.masteryLevel] = (entry.distribution[p.masteryLevel] ?? 0) + 1;
        if (p.masteryLevel >= 4) entry.mastered++;
      }
      regions.set(muscle.bodyRegion, entry);
    }

    const stats: RegionStats[] = [];
    regions.forEach((data, region) => {
      stats.push({
        region,
        label: BODY_REGION_LABELS[region] ?? region,
        total: data.total,
        mastered: data.mastered,
        avgLevel: data.levels.length > 0
          ? data.levels.reduce((a: number, b: number) => a + b, 0) / data.levels.length
          : 0,
        distribution: data.distribution,
      });
    });
    setRegionStats(stats);

    // Weak spots (lowest accuracy, at least 1 review)
    const weak: WeakMuscle[] = [];
    for (const p of progress) {
      if (p.totalReviews >= 1) {
        const muscle = muscleMap.get(p.muscleId);
        if (muscle) {
          weak.push({
            id: p.muscleId,
            name: `${muscle.names.koreanAnatomical}(${muscle.names.koreanCommon})`,
            correctRate: p.totalCorrect / p.totalReviews,
            totalReviews: p.totalReviews,
            masteryLevel: p.masteryLevel,
          });
        }
      }
    }
    weak.sort((a, b) => a.correctRate - b.correctRate);
    setWeakSpots(weak.slice(0, 5));
  };

  // Build overall distribution for the bar
  const overallDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  regionStats.forEach((stat) => {
    for (let i = 0; i <= 4; i++) {
      overallDistribution[i] += stat.distribution[i] ?? 0;
    }
  });

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>통계</Text>

        <View style={styles.overallCard}>
          <View style={styles.overallRow}>
            <View style={styles.overallItem}>
              <Text style={styles.overallValue}>{overallStats.unlocked}/{overallStats.total}</Text>
              <Text style={styles.overallLabel}>학습 중</Text>
            </View>
            <View style={styles.overallItem}>
              <Text style={[styles.overallValue, { color: Colors.success }]}>{overallStats.mastered}</Text>
              <Text style={styles.overallLabel}>완전숙달</Text>
            </View>
            <View style={styles.overallItem}>
              <Text style={[styles.overallValue, { color: Colors.primary }]}>
                {Math.round(overallStats.accuracy * 100)}%
              </Text>
              <Text style={styles.overallLabel}>정답률</Text>
            </View>
          </View>
          {overallStats.unlocked > 0 && (
            <View style={styles.overallDistribution}>
              <MasteryDistributionBar distribution={overallDistribution} height={10} showLegend />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>부위별 숙련도</Text>
        <View style={styles.legendRow}>
          {([MasteryLevel.New, MasteryLevel.Learning, MasteryLevel.Familiar, MasteryLevel.Proficient, MasteryLevel.Mastered] as const).map((level) => (
            <View key={level} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.mastery[level] }]} />
              <Text style={styles.legendText}>{MASTERY_LABELS[level]}</Text>
            </View>
          ))}
        </View>
        <View style={styles.heatmapCard}>
          {regionStats.map((stat) => {
            const hasProgress = Object.values(stat.distribution).some((v) => v > 0);
            return (
              <View key={stat.region} style={styles.regionRow}>
                <View style={[styles.regionDot, { backgroundColor: Colors.region[stat.region] ?? Colors.primary }]} />
                <Text style={styles.regionLabel}>{stat.label}</Text>
                <View style={styles.regionBar}>
                  {hasProgress ? (
                    <MasteryDistributionBar distribution={stat.distribution} height={12} />
                  ) : (
                    <View style={styles.emptyBar} />
                  )}
                </View>
                <Text style={styles.regionCount}>
                  {stat.mastered}/{stat.total}
                </Text>
              </View>
            );
          })}
        </View>

        {weakSpots.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>약점 TOP 5</Text>
            <View style={styles.weakCard}>
              {weakSpots.map((w, i) => (
                <View key={w.id} style={styles.weakRow}>
                  <Text style={styles.weakRank}>{i + 1}</Text>
                  <View style={styles.weakNameRow}>
                    <Text style={styles.weakName} numberOfLines={1}>{w.name}</Text>
                    <MasteryBadge level={w.masteryLevel} />
                  </View>
                  <Text style={[styles.weakRate, { color: w.correctRate < 0.5 ? Colors.error : Colors.warning }]}>
                    {Math.round(w.correctRate * 100)}%
                  </Text>
                </View>
              ))}
            </View>
            <PressableScale
              style={styles.reviewButton}
              onPress={async () => {
                const cards = await buildCardsForMuscleIds(weakSpots.map((w) => w.id));
                if (cards.length > 0) {
                  navigation.navigate(Routes.HomeTab, { screen: Routes.Quiz, params: { cards, latinMode: settings.latinMode } });
                }
              }}
            >
              <Text style={styles.reviewButtonText}>이 근육들 복습하기</Text>
            </PressableScale>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  overallCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overallItem: {
    alignItems: 'center',
  },
  overallValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  overallLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  overallDistribution: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  heatmapCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  regionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  regionLabel: {
    width: 70,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  regionBar: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  emptyBar: {
    height: '100%',
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
  },
  regionCount: {
    width: 40,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  weakCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  weakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weakRank: {
    width: 24,
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  weakNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weakName: {
    fontSize: FontSize.md,
    color: Colors.text,
    flexShrink: 1,
  },
  weakRate: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  reviewButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
