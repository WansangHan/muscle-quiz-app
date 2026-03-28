import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { MUSCLES } from '../data/muscles';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';
import { BrowseStackParamList } from './BodyRegionScreen';

export function MuscleListScreen() {
  const route = useRoute<RouteProp<BrowseStackParamList, 'MuscleList'>>();
  const navigation = useNavigation<NativeStackNavigationProp<BrowseStackParamList>>();
  const { region, label } = route.params;

  const muscles = MUSCLES.filter((m) => m.bodyRegion === region);

  return (
    <ScreenWrapper>
      <Text style={styles.header}>{label}</Text>
      <FlatList
        data={muscles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('MuscleDetail', { muscleId: item.id })}
          >
            <View>
              <Text style={styles.nameCommon}>{item.names.koreanAnatomical}</Text>
              <Text style={styles.nameAnatomical}>{item.names.koreanCommon}</Text>
            </View>
            <Text style={styles.nameLatin}>{item.names.latinEnglish}</Text>
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
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nameCommon: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  nameAnatomical: {
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
  separator: {
    height: Spacing.sm,
  },
});
