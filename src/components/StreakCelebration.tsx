import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { spacing, fontSize } from '../theme';

const { width, height } = Dimensions.get('window');

const StreakCelebration: React.FC<{ visible: boolean; days: number; onDismiss?: () => void; durationMs?: number }> = ({ visible, days, onDismiss, durationMs = 2500 }) => {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        if (onDismiss) onDismiss();
      });
    }, durationMs);

    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="box-none">
      <View style={styles.center}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}> 
          <Text style={styles.fire}>🔥</Text>
          <Text style={styles.title}>{days} Day Streak</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fire: {
    fontSize: 60,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  }
});

export default StreakCelebration;
