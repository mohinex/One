import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Home, MessageSquare, Compass, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#EF4444", // Glowing Crimson
        tabBarInactiveTintColor: "#6B7280", // Muted Gray
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "black",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
          fontFamily: "System",
        },
        tabBarStyle: {
          backgroundColor: "#090D1A",
          borderTopColor: "#101726",
          borderTopWidth: 1.5,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 22 : 8,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      {/* Home Dashboard */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <Home size={18} color={color} />
            </View>
          ),
        }}
      />

      {/* Conversations Index */}
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <MessageSquare size={18} color={color} />
            </View>
          ),
        }}
      />

      {/* Tools Index */}
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <Compass size={18} color={color} />
            </View>
          ),
        }}
      />

      {/* Profile Page */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <User size={18} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrap: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
