import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { useSettings } from '../hooks/useSettings';
import { Colors } from '../constants/colors';
import { Spacing, FontSize, BorderRadius } from '../constants/spacing';

export function SettingsScreen() {
  const { settings, setDailyNewLimit } = useSettings();

  const handleLimitChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1 && num <= 50) {
      setDailyNewLimit(num);
    }
  };

  return (
    <ScreenWrapper>
      <Text style={styles.header}>설정</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>학습</Text>

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>일일 새 카드 수</Text>
            <Text style={styles.description}>하루에 학습할 새로운 근육 카드 수</Text>
          </View>
          <TextInput
            style={styles.numberInput}
            value={String(settings.dailyNewLimit)}
            onChangeText={handleLimitChange}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>난이도</Text>
            <Text style={styles.description}>현재: 초급 (일반명만)</Text>
          </View>
          <Text style={styles.comingSoon}>Phase 2</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>정보</Text>
        <View style={styles.row}>
          <Text style={styles.label}>버전</Text>
          <Text style={styles.value}>1.0.0 (Phase 1)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>이미지 출처</Text>
          <Text style={styles.value}>Servier Medical Art (CC BY 4.0)</Text>
        </View>
      </View>
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
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  numberInput: {
    width: 60,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    textAlign: 'center',
    backgroundColor: Colors.background,
  },
  comingSoon: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});
