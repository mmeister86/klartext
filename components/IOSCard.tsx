import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface IOSCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  elevated?: boolean;
}

/**
 * Modern iOS-style Card Component
 * Basiert auf den Apple Human Interface Guidelines für Card-Design
 */
export function IOSCard({
  children,
  style,
  padding = 16,
  margin = 0,
  elevated = true,
}: IOSCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const cardStyle: ViewStyle = {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    padding,
    margin,
    overflow: "hidden",

    ...(elevated &&
      Platform.select({
        ios: {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      })),

    ...style,
  };

  return <View style={cardStyle}>{children}</View>;
}

/**
 * iOS-style Section Header
 * Für die Verwendung in Listen und Gruppierungen
 */
interface IOSSectionHeaderProps {
  title: string;
  style?: ViewStyle;
}

export function IOSSectionHeader({ title, style }: IOSSectionHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[styles.sectionHeaderText, { color: colors.secondaryText }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

/**
 * iOS-style List Item
 * Für Listen mit nativer iOS-Optik
 */
interface IOSListItemProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function IOSListItem({
  title,
  subtitle,
  rightElement,
  onPress,
  style,
}: IOSListItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const content = (
    <View
      style={[styles.listItem, { backgroundColor: colors.background }, style]}
    >
      <View style={styles.listItemContent}>
        <Text style={[styles.listItemTitle, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.listItemSubtitle, { color: colors.secondaryText }]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View style={styles.listItemRight}>{rightElement}</View>}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.listItemPressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingTop: 16,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  listItemPressable: {
    width: "100%",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  listItemSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.24,
    marginTop: 2,
  },
  listItemRight: {
    marginLeft: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
