import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { requestNotificationPermission } from './src/utils/notifications';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';

import { FinanceProvider } from './src/context/FinanceContext';
import HomeScreen from './src/screens/HomeScreen';
import ChartScreen from './src/screens/ChartScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import BudgetGoalsScreen from './src/screens/BudgetGoalsScreen';
import { colors, fonts } from './src/theme';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconsName; outline: IoniconsName }> = {
  'Lançar':     { focused: 'wallet',        outline: 'wallet-outline' },
  'Resumo':     { focused: 'bar-chart',     outline: 'bar-chart-outline' },
  'Calendário': { focused: 'calendar',      outline: 'calendar-outline' },
  'Orçamento':  { focused: 'pie-chart',     outline: 'pie-chart-outline' },
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => { requestNotificationPermission(); }, []);

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayout}>
      <FinanceProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color }) => {
                const icons = TAB_ICONS[route.name];
                const name = focused ? icons.focused : icons.outline;
                return <Ionicons name={name} size={22} color={color} />;
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.subtext,
              tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
              tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingTop: 4 },
              headerStyle: { backgroundColor: colors.surface, shadowOpacity: 0, elevation: 0 },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
            })}
          >
            <Tab.Screen name="Lançar"     component={HomeScreen} />
            <Tab.Screen name="Resumo"     component={ChartScreen} />
            <Tab.Screen name="Calendário" component={CalendarScreen} />
            <Tab.Screen name="Orçamento"  component={BudgetGoalsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </FinanceProvider>
    </SafeAreaProvider>
  );
}
