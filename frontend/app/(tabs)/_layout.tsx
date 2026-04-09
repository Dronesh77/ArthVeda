import { Redirect, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { theme } from '@/admin/content';
import { useAuth } from '@/context/auth-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const portfolioTab = pathname.includes('/portfolio') || pathname === '/portfolio';
  const onDashboard = pathname.includes('dashboard') || portfolioTab;
  const tabBarHeight = 64 + (Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8));

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.textPrimary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.cardWhite,
          borderTopColor: theme.borderLight,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: onDashboard ? 'Portfolio' : 'History',
          tabBarIcon: ({ color }) => (
            <Ionicons
              name={onDashboard ? 'pie-chart-outline' : 'time-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
