import React, { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ImageZoomModal } from '../components/common/ImageZoomModal';
import { MasteryBadge } from '../components/common/MasteryBadge';
import { StreakProgress } from '../components/common/StreakProgress';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { MUSCLES, BODY_REGION_LABELS } from '../data/muscles';
import { Colors } from '../constants/colors';
import { PROMOTION_THRESHOLDS } from '../constants/quiz';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { BrowseStackParamList } from './BodyRegionScreen';
import { UserProgress } from '../types/progress';
import { getProgress } from '../db/progressRepository';
import { useDatabase } from '../hooks/useDatabase';
import attributionsData from '../../assets/images/muscles/_attributions.json';

export function MuscleDetailScreen() {
  const route = useRoute<RouteProp<BrowseStackParamList, 'MuscleDetail'>>();
  const muscle = MUSCLES.find((m) => m.id === route.params.muscleId);
  const attribution = muscle
    ? (attributionsData.images as Record<string, { author: string; license: string; sourceUrl: string }>)[muscle.id]
    : undefined;

  if (!muscle) {
    return (
      <ScreenWrapper>
        <Text>근육을 찾을 수 없습니다.</Text>
      </ScreenWrapper>
    );
  }

  const [zoomVisible, setZoomVisible] = useState(false);
  const { isReady } = useDatabase();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !muscle) return;
      getProgress(muscle.id).then(setProgress);
    }, [isReady, muscle]),
  );

  const relatedMuscles = muscle.relatedMuscles
    .map((id) => MUSCLES.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setZoomVisible(true)}>
          <View style={styles.imageContainer}>
            <Image source={muscle.imageAsset} style={styles.image} resizeMode="contain" />
            <View style={styles.zoomHint}>
              <MaterialCommunityIcons name="magnify-plus-outline" size={16} color={Colors.textSecondary} />
            </View>
          </View>
        </Pressable>
        <ImageZoomModal
          visible={zoomVisible}
          imageSource={muscle.imageAsset}
          onClose={() => setZoomVisible(false)}
        />

        {attribution && (
          <View style={styles.attributionContainer}>
            <Text style={styles.attributionText}>
              이미지: {attribution.author} · {attribution.license}
              {' · '}
              <Text
                style={styles.attributionLink}
                onPress={() => Linking.openURL(attribution.sourceUrl)}
              >
                출처
              </Text>
            </Text>
          </View>
        )}

        <View style={styles.nameCard}>
          <NameRow label="근육명" value={muscle.names.koreanAnatomical} />
          <NameRow label="현대 해부학 용어" value={muscle.names.koreanCommon} />
          <NameRow label="영문/라틴" value={muscle.names.latinEnglish} />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>학습 진도</Text>
          {progress && progress.isUnlocked ? (
            <View>
              <View style={styles.progressHeader}>
                <MasteryBadge level={progress.masteryLevel} size="md" />
                <Text style={styles.progressStats}>
                  총 {progress.totalReviews}회 학습 · 정답률{' '}
                  {progress.totalReviews > 0
                    ? Math.round((progress.totalCorrect / progress.totalReviews) * 100)
                    : 0}%
                </Text>
              </View>
              {progress.masteryLevel < 4 && (
                <View style={styles.streakContainer}>
                  <StreakProgress
                    streak={progress.streak}
                    threshold={PROMOTION_THRESHOLDS[Math.min(progress.masteryLevel, 3)]}
                    level={progress.masteryLevel}
                  />
                </View>
              )}
              <Text style={styles.nextReview}>
                다음 복습:{' '}
                {new Date(progress.nextReviewAt) <= new Date()
                  ? '복습 대기 중'
                  : formatRelativeDate(progress.nextReviewAt)}
              </Text>
            </View>
          ) : (
            <Text style={styles.notStarted}>아직 학습하지 않은 근육입니다</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="부위" value={BODY_REGION_LABELS[muscle.bodyRegion] ?? muscle.bodyRegion} />
          <InfoRow label="근육군" value={muscle.muscleGroup} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>난이도</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3].map((i) => (
                <MaterialCommunityIcons
                  key={i}
                  name={i <= muscle.difficulty ? 'star' : 'star-outline'}
                  size={18}
                  color={i <= muscle.difficulty ? Colors.accent : Colors.textLight}
                />
              ))}
            </View>
          </View>
        </View>

        {muscle.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>관련 운동</Text>
            <View style={styles.tagsRow}>
              {muscle.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {relatedMuscles.length > 0 && (
          <View style={styles.relatedCard}>
            <Text style={styles.sectionTitle}>관련 근육</Text>
            {relatedMuscles.map((m) => m && (
              <Text key={m.id} style={styles.relatedName}>
                {m.names.koreanAnatomical}({m.names.koreanCommon})
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function formatRelativeDate(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 1) return '곧';
  if (hours < 24) return `${hours}시간 후`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}일 후`;
  if (days < 30) return `${Math.round(days / 7)}주 후`;
  return `${Math.round(days / 30)}개월 후`;
}

function NameRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.nameRow}>
      <Text style={styles.nameLabel}>{label}</Text>
      <Text style={styles.nameValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  zoomHint: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: BorderRadius.round,
    padding: 4,
  },
  attributionContainer: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  attributionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.xs * 1.4,
  },
  attributionLink: {
    color: Colors.primary,
    textDecorationLine: 'underline' as const,
  },
  nameCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  nameRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nameLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nameValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  tagText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  relatedCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  relatedName: {
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  progressCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressStats: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  streakContainer: {
    marginTop: Spacing.md,
  },
  nextReview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  notStarted: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});
