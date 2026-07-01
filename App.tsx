import React, { useCallback, useEffect, useState } from 'react';
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
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FinanceProvider } from './src/context/FinanceContext';
import HomeScreen from './src/screens/HomeScreen';
import ChartScreen from './src/screens/ChartScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import BudgetGoalsScreen from './src/screens/BudgetGoalsScreen';
import { colors, fonts } from './src/theme';

const Tab = createBottomTabNavigator();
const WELCOMED_KEY = '@app_financas:welcomed';

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
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => { requestNotificationPermission(); }, []);

  useEffect(() => {
    AsyncStorage.getItem(WELCOMED_KEY).then((val) => {
      if (!val) setShowWelcome(true);
    });
  }, []);

  function handleWelcomeDone() {
    AsyncStorage.setItem(WELCOMED_KEY, '1');
    setShowWelcome(false);
  }

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

        {/* ── Modal de boas-vindas ── */}
        <Modal visible={showWelcome} transparent animationType="fade">
          <View style={ws.overlay}>
            <View style={ws.card}>
              <Text style={ws.title}>Bem-vindo ao Grana+</Text>
              <View style={ws.bullets}>
                <Text style={ws.bullet}>• Lançar custos e rendas por categoria</Text>
                <Text style={ws.bullet}>• Acompanhe seu orçamento mensal</Text>
                <Text style={ws.bullet}>• Defina metas de economia</Text>
              </View>
              <TouchableOpacity style={ws.btn} onPress={handleWelcomeDone}>
                <Text style={ws.btnText}>Começar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </FinanceProvider>
    </SafeAreaProvider>
  );
}

const ws = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  card: {
    backgroundColor: '#16171f', borderRadius: 12, padding: 28,
    width: '100%', alignItems: 'center',
  },
  title: {
    color: '#f5f5f7', fontFamily: 'Inter_700Bold', fontSize: 22,
    textAlign: 'center', marginBottom: 20,
  },
  bullets: { alignSelf: 'stretch', marginBottom: 28, gap: 10 },
  bullet: { color: '#f5f5f7', fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  btn: {
    backgroundColor: '#4caf50', borderRadius: 8,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  btnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16 },
});
