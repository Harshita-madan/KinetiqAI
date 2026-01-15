import React from 'react';
import { 
  View, 
  Text,              // ✅ add this
  StyleSheet, 
  ViewProps, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { spacing, borderRadius, fontSize, fontWeight, useTheme } from '../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;  // ✅ allow single style, array, null, etc.
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  variant = 'default',
  ...rest
}) => {
  const { colors } = useTheme();
  
  const variantStyles = {
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
    },
  };
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        variantStyles[variant],
        style,
      ]}
      {...rest}
    >
      {(title || subtitle) && (
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
          {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  content: {
    padding: spacing.md,
  },
});
