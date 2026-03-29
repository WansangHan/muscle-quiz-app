import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { AnimatedListItem } from '../components/common/AnimatedListItem';
import { MUSCLES, BODY_REGION_LABELS } from '../data/muscles';
import { BodyRegion, MuscleData } from '../types/muscle';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export type BrowseStackParamList = {
  BodyRegion: undefined;
  MuscleDetail: { muscleId: string };
};

interface RegionItem {
  region: BodyRegion;
  label: string;
  muscles: MuscleData[];
}

const musclesByRegion = new Map<string, MuscleData[]>();
for (const m of MUSCLES) {
  const list = musclesByRegion.get(m.bodyRegion) ?? [];
  list.push(m);
  musclesByRegion.set(m.bodyRegion, list);
}

const REGIONS: RegionItem[] = Object.entries(BODY_REGION_LABELS).map(([key, label]) => ({
  region: key as BodyRegion,
  label,
  muscles: musclesByRegion.get(key) ?? [],
}));

function ChevronIcon({ expanded }: { expanded: boolean }) {
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  const rotateZ = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotateZ }] }}>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </Animated.View>
  );
}

export function BodyRegionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BrowseStackParamList>>();
  const [expandedRegion, setExpandedRegion] = useState<BodyRegion | null>(null);

  const handleToggle = (region: BodyRegion) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRegion((prev) => (prev === region ? null : region));
  };

  return (
    <ScreenWrapper>
      <Text style={styles.header}>부위별 탐색</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {REGIONS.map((item, index) => {
          const isExpanded = expandedRegion === item.region;
          return (
            <AnimatedListItem key={item.region} index={index}>
              <View style={styles.regionContainer}>
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handleToggle(item.region)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.colorBar,
                      { backgroundColor: Colors.region[item.region] ?? Colors.primary },
                    ]}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardLabel}>{item.label}</Text>
                    <Text style={styles.cardCount}>{item.muscles.length}개 근육</Text>
                  </View>
                  <ChevronIcon expanded={isExpanded} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.muscleList}>
                    {item.muscles.map((muscle) => (
                      <TouchableOpacity
                        key={muscle.id}
                        style={styles.muscleCard}
                        onPress={() => navigation.navigate('MuscleDetail', { muscleId: muscle.id })}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thumbnailContainer}>
                          <Image
                            source={muscle.imageAsset}
                            style={styles.thumbnail}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={styles.muscleCardContent}>
                          <Text style={styles.namePrimary}>{muscle.names.koreanAnatomical}</Text>
                          <Text style={styles.nameSecondary}>{muscle.names.koreanCommon}</Text>
                          <Text style={styles.nameLatin}>{muscle.names.latinEnglish}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.separator} />
            </AnimatedListItem>
          );
        })}
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
  regionContainer: {
    overflow: 'hidden',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  cardLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  cardCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: Spacing.sm,
  },
  muscleList: {
    marginTop: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  muscleCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnailContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnail: {
    width: '85%',
    height: '85%',
  },
  muscleCardContent: {
    flex: 1,
  },
  namePrimary: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  nameSecondary: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nameLatin: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
});
