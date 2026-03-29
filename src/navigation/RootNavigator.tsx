import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { BodyRegionScreen } from '../screens/BodyRegionScreen';
import { MuscleDetailScreen } from '../screens/MuscleDetailScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../constants/colors';
import { Routes } from '../constants/routes';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const BrowseStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name={Routes.Home}
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name={Routes.Quiz}
        component={QuizScreen}
        options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom' }}
      />
    </HomeStack.Navigator>
  );
}

function BrowseStackNavigator() {
  return (
    <BrowseStack.Navigator>
      <BrowseStack.Screen
        name={Routes.BodyRegion}
        component={BodyRegionScreen}
        options={{ headerShown: false }}
      />
      <BrowseStack.Screen
        name={Routes.MuscleDetail}
        component={MuscleDetailScreen}
        options={{ title: '근육 상세', headerBackTitle: '뒤로' }}
      />
    </BrowseStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tab.Screen
        name={Routes.HomeTab}
        component={HomeStackNavigator}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={Routes.BrowseTab}
        component={BrowseStackNavigator}
        options={{
          tabBarLabel: '탐색',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={Routes.Statistics}
        component={StatisticsScreen}
        options={{
          tabBarLabel: '통계',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={Routes.Settings}
        component={SettingsScreen}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
