import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

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

const TAB_NAMES = ['Início', 'Gráfico', 'Calendário', 'Orçamento'];

function TabDot({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: focused ? colors.primary : 'transparent',
        marginBottom: 2,
      }}
    />
  );
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

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
              tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.subtext,
              tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
              tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingTop: 6 },
              headerStyle: { backgroundColor: colors.surface, shadowOpacity: 0, elevation: 0 },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
            })}
          >
            <Tab.Screen name="Início" component={HomeScreen} />
            <Tab.Screen name="Gráfico" component={ChartScreen} />
            <Tab.Screen name="Calendário" component={CalendarScreen} />
            <Tab.Screen name="Orçamento" component={BudgetGoalsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </FinanceProvider>
    </SafeAreaProvider>
  );
}
