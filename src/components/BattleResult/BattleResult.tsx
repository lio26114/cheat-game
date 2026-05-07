// src/components/BattleResult/BattleResult.tsx
// 胜负演出组件 v3 — 洞察碎片改为关卡小总结

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BattleResultProps {
  isVictory: boolean;
  levelName: string;
  enemyName: string;
  rewardSummary: string;
  onContinue: () => void;
  onRetry: () => void;
}

export default function BattleResult({
  isVictory,
  levelName,
  enemyName,
  rewardSummary,
  onContinue,
  onRetry,
}: BattleResultProps) {
  return (
    <View style={styles.overlay}>
      <View style={[styles.container, isVictory && styles.containerVictory]}>
        {/* 结果标题 */}
        <Text style={[styles.title, isVictory ? styles.victoryTitle : styles.defeatTitle]}>
          {isVictory ? '胜 利' : '败 北'}
        </Text>

        {/* 关卡信息 */}
        <Text style={styles.levelInfo}>
          {levelName} — vs {enemyName}
        </Text>

        {/* 通关总结 */}
        {isVictory && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{rewardSummary}</Text>
          </View>
        )}

        {/* 操作按钮 */}
        {isVictory ? (
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>继续</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>再战一次</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={onContinue}>
              <Text style={styles.backButtonText}>返回</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 30,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  containerVictory: {
    borderColor: 'rgba(241,196,15,0.3)',
    // @ts-ignore web only
    boxShadow: '0 0 40px rgba(241,196,15,0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 6,
  },
  victoryTitle: {
    color: '#f1c40f',
    textShadowColor: 'rgba(241,196,15,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  defeatTitle: {
    color: '#e74c3c',
    textShadowColor: 'rgba(231,76,60,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  levelInfo: {
    color: '#888',
    fontSize: 13,
    marginBottom: 20,
    letterSpacing: 1,
  },
  summaryContainer: {
    backgroundColor: 'rgba(241,196,15,0.06)',
    padding: 16,
    borderRadius: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(241,196,15,0.12)',
    width: '100%',
  },
  summaryText: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'left',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  continueButton: {
    backgroundColor: '#f1c40f',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 6,
    // @ts-ignore web only
    boxShadow: '0 2px 12px rgba(241,196,15,0.3)',
  },
  continueButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backButton: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  backButtonText: {
    color: '#999',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

