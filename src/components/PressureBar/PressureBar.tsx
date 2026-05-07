// src/components/PressureBar/PressureBar.tsx
// 心理压力条组件 v2 — 样式优化

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPressureLevel, getPressureColor } from '../../engine/PressureSystem';

interface PressureBarProps {
  pressure: number;
  label: string;
}

export default function PressureBar({ pressure, label }: PressureBarProps) {
  const percentage = Math.min(100, Math.max(0, pressure));
  const color = getPressureColor(pressure);
  const level = getPressureLevel(pressure);

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.levelText, { color }]}>{level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 1,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  barBackground: {
    height: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
