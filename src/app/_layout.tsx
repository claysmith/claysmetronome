import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useThemePreference } from '@/hooks/use-theme';

function LayoutContent() {
  const { resolved } = useThemePreference();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: resolved === 'dark' ? '#0D0D12' : '#F2F2F7',
          },
        }}
      />
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
