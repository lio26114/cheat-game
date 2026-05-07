// src/components/DialogBox/DialogBox.tsx
// 剧情对话框组件 v5 — 打字机效果

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { StoryDialog } from '../../data/story';

interface DialogBoxProps {
  lines: StoryDialog[];
  onComplete: () => void;
}

// 打字机逐字显示 hook
function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 重置
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    if (!text) return;

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setDone(true);
      }
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, speed]);

  // 跳过：直接显示全文
  const skip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDisplayed(text);
    setDone(true);
  };

  return { displayed, done, skip };
}

export default function DialogBox({ lines, onComplete }: DialogBoxProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentLine = lines[currentIndex];
  const { displayed, done, skip } = useTypewriter(currentLine?.text ?? '');

  // 换行时淡入
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const handleTap = () => {
    // 打字未完成 → 跳过（直接显示全文）
    if (!done) {
      skip();
      return;
    }
    // 打字完成 → 下一行 or 结束
    if (currentIndex < lines.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  if (!currentLine) return null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleTap}
      style={styles.overlay}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* 角色名字行 */}
        <View style={styles.speakerRow}>
          <View style={[
            styles.speakerBadge,
            currentLine.isPlayer && styles.speakerBadgePlayer,
            currentLine.speaker === '旁白' && styles.speakerBadgeNarrator,
          ]}>
            <Text style={[
              styles.speaker,
              currentLine.isPlayer && styles.playerSpeaker,
              currentLine.speaker === '旁白' && styles.narratorSpeaker,
            ]}>
              {currentLine.speaker}
            </Text>
          </View>
        </View>

        {/* 对话内容（打字机效果） */}
        <Text style={styles.text}>{displayed}</Text>

        {/* 点击继续提示（打字完成后才显示） */}
        {done && (
          <Text style={styles.continueHint}>
            {currentIndex < lines.length - 1 ? '点击继续 ▸' : '点击开始 ▸'}
          </Text>
        )}
        {/* 打字中提示 */}
        {!done && (
          <Text style={styles.typingHint}>▌</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f0f18',
    borderTopWidth: 1,
    borderTopColor: 'rgba(241,196,15,0.4)',
    padding: 20,
    paddingBottom: 40,
    minHeight: 140,
  },
  speakerRow: {
    marginBottom: 10,
  },
  speakerBadge: {
    backgroundColor: 'rgba(241,196,15,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 3,
    alignSelf: 'flex-start',
    borderLeftWidth: 2,
    borderLeftColor: '#f1c40f',
  },
  speakerBadgePlayer: {
    backgroundColor: 'rgba(52,152,219,0.1)',
    borderLeftColor: '#3498db',
  },
  speaker: {
    color: '#f1c40f',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  playerSpeaker: {
    color: '#3498db',
  },
  speakerBadgeNarrator: {
    backgroundColor: 'rgba(155,155,176,0.08)',
    borderLeftColor: '#666',
  },
  narratorSpeaker: {
    color: '#888',
  },
  text: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 24,
    paddingLeft: 4,
    letterSpacing: 0.5,
    minHeight: 48,
  },
  continueHint: {
    color: '#555',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 14,
    letterSpacing: 1,
  },
  typingHint: {
    color: '#f1c40f',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 14,
    opacity: 0.7,
  },
});
