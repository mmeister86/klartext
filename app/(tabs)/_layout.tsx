import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

// Modern iOS-style tab bar icons mit besserer Größe und Spacing
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  focused?: boolean;
}) {
  return (
    <FontAwesome
      size={props.focused ? 24 : 22}
      style={{
        marginBottom: Platform.OS === "ios" ? -2 : 0,
        opacity: props.focused ? 1 : 0.7,
      }}
      {...props}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,

        // Modern iOS tab bar styling
        tabBarStyle: {
          backgroundColor:
            colorScheme === "dark"
              ? colors.tertiaryBackground
              : colors.background,
          borderTopColor: colors.separator,
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          height: Platform.OS === "ios" ? 88 : 68,

          // iOS-style blur effect
          ...(Platform.OS === "ios" && {
            position: "absolute",
            backgroundColor: "transparent",
          }),
        },

        // Modern tab bar label styling
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 0.1,
          marginTop: 4,
        },

        // iOS-style tab bar item positioning
        tabBarItemStyle: {
          paddingTop: 4,
        },

        // Modern iOS animations
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Aufnehmen",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="microphone" color={color} focused={focused} />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={22}
                    color={colors.text}
                    style={{
                      marginRight: 16,
                      opacity: pressed ? 0.4 : 0.7,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Verlauf",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="history" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
