import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { BodyRegionScreen } from '../screens/BodyRegionScreen';
import { MuscleListScreen } from '../screens/MuscleListScreen';
import { MuscleDetailScreen } from '../screens/MuscleDetailScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const BrowseStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </HomeStack.Navigator>
  );
}

function BrowseStackNavigator() {
  return (
    <BrowseStack.Navigator>
      <BrowseStack.Screen
        name="BodyRegion"
        component={BodyRegionScreen}
        options={{ headerShown: false }}
      />
      <BrowseStack.Screen
        name="MuscleList"
        component={MuscleListScreen}
        options={({ route }: any) => ({
          title: route.params?.label ?? '근육 목록',
          headerBackTitle: '뒤로',
        })}
      />
      <BrowseStack.Screen
        name="MuscleDetail"
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
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: '홈' }}
      />
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStackNavigator}
        options={{ tabBarLabel: '탐색' }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ tabBarLabel: '통계' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: '설정' }}
      />
    </Tab.Navigator>
  );
}
