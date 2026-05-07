// src/components/Card/CardComponent.tsx
// 单张卡牌组件 v2 — 质感提升

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Card, CardType } from '../../data/cards';

interface CardComponentProps {
  card: Card;
  isSelected?: boolean;
  isDisabled?: boolean;
  isRevealed?: boolean;
  isEnemy?: boolean;
  onPress?: (card: Card) => void;
  size?: 'small' | 'medium' | 'large';
}

const CARD_COLORS: Record<CardType, { main: string; glow: string; bg: string }> = {
  attack:   { main: '#e74c3c', glow: 'rgba(231,76,60,0.4)',  bg: 'rgba(231,76,60,0.08)' },
  defense:  { main: '#3498db', glow: 'rgba(52,152,219,0.4)', bg: 'rgba(52,152,219,0.08)' },
  mindread: { main: '#9b59b6', glow: 'rgba(155,89,182,0.4)', bg: 'rgba(155,89,182,0.08)' },
  trap:     { main: '#e67e22', glow: 'rgba(230,126,34,0.4)', bg: 'rgba(230,126,34,0.08)' },
  skip:     { main: '#2ecc71', glow: 'rgba(46,204,113,0.4)', bg: 'rgba(46,204,113,0.08)' },
};

const CARD_SIZE = {
  small:  { width: 60,  height: 84,  fontSize: 24, nameSize: 10, descSize: 8  },
  medium: { width: 82,  height: 114, fontSize: 32, nameSize: 13, descSize: 9  },
  large:  { width: 104, height: 144, fontSize: 40, nameSize: 15, descSize: 10 },
};

export default function CardComponent({
  card,
  isSelected = false,
  isDisabled = false,
  isRevealed = true,
  isEnemy = false,
  onPress,
  size = 'medium',
}: CardComponentProps) {
  const s = CARD_SIZE[size];
  const colors = CARD_COLORS[card.type];

  // 选中态呼吸动画 + 上浮效果
  const glowAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected) {
      // 上浮
      Animated.spring(liftAnim, {
        toValue: -10,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
      // 呼吸发光
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.spring(liftAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
      glowAnim.setValue(0);
    }
  }, [isSelected]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  if (!isRevealed) {
    return (
      <View
        style={[
          styles.cardBack,
          {
            width: s.width,
            height: s.height,
          },
        ]}
      >
        <View style={styles.cardBackPattern} />
        <Text style={[styles.cardBackText, { fontSize: s.fontSize }]}>?</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ translateY: liftAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={isDisabled}
        onPress={() => onPress?.(card)}
        style={[
          styles.card,
          {
            width: s.width,
            height: s.height,
            backgroundColor: isSelected ? colors.bg : '#12121e',
            borderColor: isSelected ? colors.main : 'rgba(255,255,255,0.08)',
          },
          isDisabled && styles.disabledCard,
        ]}
      >
        {/* 选中发光边框 */}
        {isSelected && (
          <Animated.View
            style={[
              styles.glowBorder,
              {
                borderColor: colors.main,
                opacity: glowOpacity,
                // @ts-ignore web only
                boxShadow: `0 0 12px ${colors.glow}, inset 0 0 8px ${colors.glow}`,
              },
            ]}
          />
        )}

        {/* 顶部类型色条 */}
        <View style={[styles.colorBar, { backgroundColor: colors.main }]} />

        {/* 底纹 */}
        <View style={[styles.cardTint, { backgroundColor: colors.bg }]} />

        {/* 图标 */}
        <Text style={[styles.icon, { fontSize: s.fontSize }]}>{card.icon}</Text>

        {/* 名称 */}
        <Text style={[styles.name, { fontSize: s.nameSize, color: isSelected ? colors.main : '#ddd' }]}>
          {card.name}
        </Text>


        {/* 描述 */}
        <Text style={[styles.description, { fontSize: s.descSize }]} numberOfLines={2}>
          {card.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  // 选中发光边框
  glowBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 9,
    borderWidth: 2,
    pointerEvents: 'none',
  },
  // 顶部色条
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  // 底纹
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
    marginBottom: 1,
    letterSpacing: 1,
  },
  damage: {
    fontWeight: 'bold',
  },
  description: {
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  disabledCard: {
    opacity: 0.35,
  },
  // 牌背
  cardBack: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#12121e',
    overflow: 'hidden',
  },
  cardBackPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // @ts-ignore web only — 牌背暗纹
    background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(241,196,15,0.03) 8px, rgba(241,196,15,0.03) 16px)',
  },
  cardBackText: {
    color: 'rgba(241,196,15,0.25)',
    fontWeight: 'bold',
  },
});
