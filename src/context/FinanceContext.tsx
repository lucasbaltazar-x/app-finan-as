import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, Goal } from '../types';

const STORAGE_KEY = '@app_financas:data';

interface StoredData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
}

interface FinanceContextValue extends StoredData {
  loaded: boolean;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  addBudget: (b: Omit<Budget, 'id'>) => void;
  removeBudget: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
  updateGoalSavedAmount: (id: string, savedAmount: number) => void;
  removeGoal: (id: string) => void;
  balance: number;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const data: StoredData = JSON.parse(raw);
        setTransactions(data.transactions ?? []);
        setBudgets(data.budgets ?? []);
        setGoals(data.goals ?? []);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data: StoredData = { transactions, budgets, goals };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [transactions, budgets, goals, loaded]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setTransactions((prev) => [{ ...t, id: genId() }, ...prev]);
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addBudget = useCallback((b: Omit<Budget, 'id'>) => {
    setBudgets((prev) => [{ ...b, id: genId() }, ...prev]);
  }, []);

  const removeBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, 'id'>) => {
    setGoals((prev) => [{ ...g, id: genId() }, ...prev]);
  }, []);

  const updateGoalSavedAmount = useCallback((id: string, savedAmount: number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, savedAmount } : g)));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  );

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        goals,
        loaded,
        selectedDate,
        setSelectedDate,
        addTransaction,
        removeTransaction,
        addBudget,
        removeBudget,
        addGoal,
        updateGoalSavedAmount,
        removeGoal,
        balance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
  return ctx;
}
