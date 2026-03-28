import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { MUSCLES, BODY_REGION_LABELS } from '../data/muscles';
import { BodyRegion } from '../types/muscle';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';

export type BrowseStackParamList = {
  BodyRegion: undefined;
  MuscleList: { region: BodyRegion; label: string };
  MuscleDetail: { muscleId: string };
};

interface RegionItem {
  region: BodyRegion;
  label: string;
  count: number;
}

export function BodyRegionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BrowseStackParamList>>();

  const regionCounts = new Map<string, number>();
  for (const m of MUSCLES) {
    regionCounts.set(m.bodyRegion, (regionCounts.get(m.bodyRegion) ?? 0) + 1);
  }

  const regions: RegionItem[] = Object.entries(BODY_REGION_LABELS).map(([key, label]) => ({
    region: key as BodyRegion,
    label,
    count: regionCounts.get(key) ?? 0,
  }));

  return (
    <ScreenWrapper>
      <Text style={styles.header}>부위별 탐색</Text>
      <FlatList
        data={regions}
        keyExtractor={(item) => item.region}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('MuscleList', { region: item.region, label: item.label })}
          >
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardCount}>{item.count}개 근육</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  cardCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  separator: {
    height: Spacing.sm,
  },
});
