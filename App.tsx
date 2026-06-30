import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { FinanceProvider } from './src/context/FinanceContext';
import HomeScreen from './src/screens/HomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import BudgetGoalsScreen from './src/screens/BudgetGoalsScreen';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  Início: '🏠',
  Transações: '💸',
  'Orçamento': '🎯',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FinanceProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
              tabBarActiveTintColor: '#1b5e20',
              headerStyle: { backgroundColor: '#1b5e20' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            })}
          >
            <Tab.Screen name="Início" component={HomeScreen} />
            <Tab.Screen name="Transações" component={TransactionsScreen} />
            <Tab.Screen name="Orçamento" component={BudgetGoalsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </FinanceProvider>
    </SafeAreaProvider>
  );
}
