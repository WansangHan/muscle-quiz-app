import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider, useDatabase } from './src/hooks/useDatabase';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/constants/colors';

function AppContent() {
  const { isReady, error } = useDatabase();

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>DB 초기화 실패</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <StatusBar style="auto" />
        <AppContent />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
