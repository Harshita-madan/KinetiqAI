import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  showBadge?: boolean;
  badgeColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  style,
  showBadge = false,
  badgeColor = colors.success,
}) => {
  const getInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const sizeStyles = {
    sm: { width: 32, height: 32, fontSize: fontSize.xs },
    md: { width: 48, height: 48, fontSize: fontSize.sm },
    lg: { width: 64, height: 64, fontSize: fontSize.lg },
    xl: { width: 96, height: 96, fontSize: fontSize.xxl },
  };

  const badgeSizeStyles = {
    sm: { width: 10, height: 10 },
    md: { width: 12, height: 12 },
    lg: { width: 16, height: 16 },
    xl: { width: 20, height: 20 },
  };

  return (
    <View style={[styles.container, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[styles.image, { width: sizeStyles[size].width, height: sizeStyles[size].height }]}
        />
      ) : name ? (
        <View
          style={[
            styles.placeholder,
            { width: sizeStyles[size].width, height: sizeStyles[size].height },
          ]}
        >
          <Text style={[styles.initials, { fontSize: sizeStyles[size].fontSize }]}>
            {getInitials(name)}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: sizeStyles[size].width, height: sizeStyles[size].height },
          ]}
        >
          <Ionicons name="person" size={sizeStyles[size].width * 0.5} color={colors.gray400} />
        </View>
      )}
      {showBadge && (
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColor },
            badgeSizeStyles[size],
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderRadius: borderRadius.full,
  },
  placeholder: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.gray600,
    fontWeight: fontWeight.semibold,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
