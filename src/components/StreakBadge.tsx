import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, fontSize } from '../theme';

const StreakBadge: React.FC<{ count: number }> = ({ count }) => {
  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel={`Streak ${count} days`}> 
      <Text style={styles.fire}>🔥</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 90, 0, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  fire: {
    marginRight: 6,
    fontSize: 16,
  },
  count: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  }
});

export default StreakBadge;
