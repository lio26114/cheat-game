// src/components/Card/FlipCard.tsx
// 翻牌动画组件 v2 — 质感提升

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Card, CardType } from '../../data/cards';

interface FlipCardProps {
  card: Card;
  delay?: number;
  size?: 'medium' | 'large';
}

const CARD_COLORS: Record<CardType, { main: string; bg: string }> = {
  attack:   { main: '#e74c3c', bg: 'rgba(231,76,60,0.08)' },
  defense:  { main: '#3498db', bg: 'rgba(52,152,219,0.08)' },
  mindread: { main: '#9b59b6', bg: 'rgba(155,89,182,0.08)' },
  trap:     { main: '#e67e22', bg: 'rgba(230,126,34,0.08)' },
  skip:     { main: '#2ecc71', bg: 'rgba(46,204,113,0.08)' },
};

const CARD_SIZE = {
  medium: { width: 82, height: 114, fontSize: 32, nameSize: 13 },
  large:  { width: 104, height: 144, fontSize: 40, nameSize: 15 },
};

export default function FlipCard({ card, delay: flipDelay = 0, size = 'large' }: FlipCardProps) {
  const rotation = useSharedValue(0);
  const s = CARD_SIZE[size];
  const colors = CARD_COLORS[card.type];

  useEffect(() => {
    rotation.value = withDelay(
      flipDelay,
      withSequence(
        withTiming(90, { duration: 250 }),
        withTiming(0, { duration: 250 })
      )
    );
  }, []);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = rotation.value;
    const opacity = interpolate(
      rotateY,
      [0, 89, 90, 180, 270, 271, 360],
      [1, 1, 0, 0, 0, 1, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ rotateY: `${rotateY}deg` }],
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = rotation.value;
    const opacity = interpolate(
      rotateY,
      [0, 89, 90, 180, 270, 271, 360],
      [0, 0, 1, 1, 1, 0, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ rotateY: `${rotateY - 180}deg` }],
    };
  });

  return (
    <View style={[styles.container, { width: s.width, height: s.height }]}>
      {/* 牌面（正面） */}
      <Animated.View
        style={[
          styles.cardFace,
          {
            width: s.width,
            height: s.height,
            backgroundColor: '#12121e',
            borderColor: colors.main,
          },
          frontAnimatedStyle,
        ]}
      >
        <View style={[styles.colorBar, { backgroundColor: colors.main }]} />
        <View style={[styles.cardTint, { backgroundColor: colors.bg }]} />
        <Text style={[styles.icon, { fontSize: s.fontSize }]}>{card.icon}</Text>
        <Text style={[styles.name, { fontSize: s.nameSize, color: colors.main }]}>{card.name}</Text>
      </Animated.View>

      {/* 牌背 */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          {
            width: s.width,
            height: s.height,
          },
          backAnimatedStyle,
        ]}
      >
        <View style={styles.cardBackPattern} />
        <Text style={[styles.backIcon, { fontSize: s.fontSize }]}>?</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: 4,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 2,
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  icon: {
    marginBottom: 2,
  },
  name: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardBack: {
    backgroundColor: '#12121e',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardBackPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // @ts-ignore web only
    background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(241,196,15,0.03) 8px, rgba(241,196,15,0.03) 16px)',
  },
  backIcon: {
    color: 'rgba(241,196,15,0.25)',
    fontWeight: 'bold',
  },
});
