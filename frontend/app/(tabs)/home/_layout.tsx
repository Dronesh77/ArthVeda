import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="ai-portfolio" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
