import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { MUSCLES, BODY_REGION_LABELS } from '../data/muscles';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { BrowseStackParamList } from './BodyRegionScreen';

export function MuscleDetailScreen() {
  const route = useRoute<RouteProp<BrowseStackParamList, 'MuscleDetail'>>();
  const muscle = MUSCLES.find((m) => m.id === route.params.muscleId);

  if (!muscle) {
    return (
      <ScreenWrapper>
        <Text>근육을 찾을 수 없습니다.</Text>
      </ScreenWrapper>
    );
  }

  const relatedMuscles = muscle.relatedMuscles
    .map((id) => MUSCLES.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={muscle.imageAsset} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.nameCard}>
          <NameRow label="일반명" value={muscle.names.koreanCommon} />
          <NameRow label="해부학 용어" value={muscle.names.koreanAnatomical} />
          <NameRow label="영문/라틴" value={muscle.names.latinEnglish} />
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="부위" value={BODY_REGION_LABELS[muscle.bodyRegion] ?? muscle.bodyRegion} />
          <InfoRow label="근육군" value={muscle.muscleGroup} />
          <InfoRow label="난이도" value={'★'.repeat(muscle.difficulty) + '☆'.repeat(3 - muscle.difficulty)} />
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
                {m.names.koreanCommon} ({m.names.koreanAnatomical})
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
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
});
