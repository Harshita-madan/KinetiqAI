import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { Card } from '../components';

interface ToolCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: [string, string];
  onPress: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, gradient, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.toolCardContainer}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.toolCard}
    >
      <View style={styles.toolIconContainer}>
        <Ionicons name={icon} size={32} color={colors.white} />
      </View>
      <Text style={styles.toolTitle}>{title}</Text>
      <Text style={styles.toolDescription}>{description}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export const ExploreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const tools = [
    {
      icon: 'camera' as const,
      title: 'AI Vision',
      description: 'Scan and analyze images using AI',
      gradient: [colors.primary, colors.primaryLight] as [string, string],
    },
    {
      icon: 'document-text' as const,
      title: 'Document Scanner',
      description: 'Extract text from documents',
      gradient: [colors.secondary, colors.secondaryLight] as [string, string],
    },
    {
      icon: 'mic' as const,
      title: 'Voice Assistant',
      description: 'Hands-free voice commands',
      gradient: [colors.accent, colors.accentLight] as [string, string],
    },
    {
      icon: 'analytics' as const,
      title: 'Data Insights',
      description: 'Analyze patterns and trends',
      gradient: [colors.info, '#60A5FA'] as [string, string],
    },
  ];

  const categories = [
    { icon: 'bulb-outline' as const, title: 'Smart Tips', count: 24 },
    { icon: 'book-outline' as const, title: 'Tutorials', count: 12 },
    { icon: 'code-slash-outline' as const, title: 'Templates', count: 8 },
    { icon: 'people-outline' as const, title: 'Community', count: 156 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Discover AI-powered tools and features</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Ionicons name="search" size={20} color={colors.gray400} />
          <Text style={styles.searchPlaceholder}>Search tools and features...</Text>
        </TouchableOpacity>

        {/* AI Tools */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Tools</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toolsGrid}>
            {tools.map((tool, index) => (
              <ToolCard
                key={index}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                gradient={tool.gradient}
                onPress={() => {}}
              />
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryItem}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryCount}>{category.count} items</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Article */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <Card variant="elevated">
            <View style={styles.featuredContent}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>NEW</Text>
              </View>
              <Text style={styles.featuredTitle}>
                Getting Started with KinetiqAI
              </Text>
              <Text style={styles.featuredDescription}>
                Learn how to maximize your productivity with our AI-powered features
              </Text>
              <TouchableOpacity style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Read More</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Recent Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's New</Text>
          <View style={styles.updatesList}>
            {[
              { version: 'v1.0.0', title: 'Initial Release', date: 'Jan 2026' },
              { version: 'Coming', title: 'Multi-language Support', date: 'Soon' },
              { version: 'Coming', title: 'Cloud Sync', date: 'Soon' },
            ].map((update, index) => (
              <View key={index} style={styles.updateItem}>
                <View style={styles.updateVersion}>
                  <Text style={styles.updateVersionText}>{update.version}</Text>
                </View>
                <View style={styles.updateContent}>
                  <Text style={styles.updateTitle}>{update.title}</Text>
                  <Text style={styles.updateDate}>{update.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.gray400,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  toolCardContainer: {
    width: '48%',
  },
  toolCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  toolIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  toolTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  toolDescription: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  categoriesContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  categoryCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  featuredContent: {
    padding: spacing.sm,
  },
  featuredBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  featuredBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  featuredTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  featuredDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
    marginBottom: spacing.md,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featuredButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  updatesList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  updateVersion: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  updateVersionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  updateDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
