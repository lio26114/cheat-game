// App.tsx
// 应用入口 + 导航配置

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import Home from './app/index';
import Map from './app/map';
import Battle from './app/battle';
import { useProgressStore } from './src/store/progressStore';

// 简易占位页面
function DeckScreen() {
  return null; // 后续版本实现
}

function SettingsScreen() {
  return null; // 后续版本实现
}

export type RootStackParamList = {
  Home: undefined;
  StoryMap: undefined;
  Battle: { levelId: number };
  Deck: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // 启动时恢复存档
  useEffect(() => {
    useProgressStore.getState()._hydrate();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#f1c40f',
          headerTitleStyle: { color: '#fff' },
          headerBackTitle: '返回',
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StoryMap"
          component={Map}
          options={{ title: '选择关卡', headerShown: false }}
        />
        <Stack.Screen
          name="Battle"
          component={Battle}
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="Deck"
          component={DeckScreen}
          options={{ title: '牌库' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '设置' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
