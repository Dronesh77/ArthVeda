import { Redirect, type Href } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function TabsIndex() {
  const { user } = useAuth();
  if (!user) return <Redirect href={'/login' as Href} />;
  return <Redirect href={'/home' as Href} />;
}
