// src/components/HPBar/HPBar.tsx
// 血条组件 v3 — HP变化闪烁动画

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface HPBarProps {
  current: number;
  max: number;
  label: string;
  color?: string;
  isPlayer?: boolean;
}

export default function HPBar({
  current,
  max,
  label,
  color = '#e74c3c',
  isPlayer = false,
}: HPBarProps) {
  const filled = Math.max(0, Math.min(current, max));
  const ratio = max > 0 ? filled / max : 0;
  const cellColor = ratio > 0.5 ? color : ratio > 0.25 ? '#FF9800' : '#f44336';

  // HP变化闪烁
  const flashAnim = useRef(new Animated.Value(1)).current;
  const prevHP = useRef(current);

  useEffect(() => {
    if (current < prevHP.current) {
      // 受击闪烁
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
    prevHP.current = current;
  }, [current]);

  return (
    <Animated.View style={[styles.container, { opacity: flashAnim }]}>
      <View style={styles.barRow}>
        {Array.from({ length: max }, (_, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              i < filled
                ? {
                    backgroundColor: cellColor,
                    // @ts-ignore web only
                    boxShadow: `0 0 4px ${cellColor}40`,
                  }
                : styles.cellEmpty,
              i === 0 && styles.cellFirst,
              i === max - 1 && styles.cellLast,
            ]}
          />
        ))}
      </View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, isPlayer && styles.playerLabel]}>{label}</Text>
        <Text style={styles.hpText}>
          {current} / {max}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  playerLabel: {
    color: '#3498db',
  },
  hpText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  barRow: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    flex: 1,
    height: 10,
    backgroundColor: '#e74c3c',
  },
  cellEmpty: {
    backgroundColor: '#1a1a1a',
  },
  cellFirst: {
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  cellLast: {
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
});
