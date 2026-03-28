import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

interface Props {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function ScreenWrapper({ children, noPadding }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, noPadding && styles.noPadding]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  noPadding: {
    padding: 0,
  },
});
