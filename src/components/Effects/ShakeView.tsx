// src/components/Effects/ShakeView.tsx
// 震屏效果 — 受伤时画面震动反馈

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ShakeViewProps {
  children: React.ReactNode;
  trigger: number;          // 每次变化时触发震动（传 damage 或递增 id）
  intensity?: number;       // 震动强度（像素偏移）
  style?: ViewStyle;
}

export default function ShakeView({ children, trigger, intensity = 8, style }: ShakeViewProps) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (trigger > 0) {
      // 快速左右抖动
      shakeX.value = withSequence(
        withTiming(-intensity, { duration: 40 }),
        withTiming(intensity, { duration: 40 }),
        withTiming(-intensity * 0.7, { duration: 40 }),
        withTiming(intensity * 0.7, { duration: 40 }),
        withTiming(-intensity * 0.3, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
