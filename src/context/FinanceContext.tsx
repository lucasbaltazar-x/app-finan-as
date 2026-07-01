import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, Goal, RecurringTemplate } from '../types';
import { checkBudgetAndNotify } from '../utils/notifications';
import { exportBackup, importBackup } from '../utils/backup';

const STORAGE_KEY = '@app_financas:data';

interface StoredData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurringTemplates: RecurringTemplate[];
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
  addRecurring: (t: Omit<RecurringTemplate, 'id' | 'lastAppliedMonth'>) => void;
  removeRecurring: (id: string) => void;
  balance: number;
  exportData: () => Promise<boolean>;
  importData: () => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const data: StoredData = JSON.parse(raw);
        setTransactions(data.transactions ?? []);
        setBudgets(data.budgets ?? []);
        setGoals(data.goals ?? []);
        setRecurringTemplates(data.recurringTemplates ?? []);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data: StoredData = { transactions, budgets, goals, recurringTemplates };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [transactions, budgets, goals, recurringTemplates, loaded]);

  // Aplica templates recorrentes ao abrir o app
  useEffect(() => {
    if (!loaded || recurringTemplates.length === 0) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    setRecurringTemplates((prev) => {
      const toApply = prev.filter((t) => t.lastAppliedMonth !== currentMonth);
      if (toApply.length === 0) return prev;

      const newTxs: Transaction[] = toApply.map((t) => {
        const day = Math.min(t.dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        return { id: genId(), type: t.type, amount: t.amount, category: t.category, description: t.description, date: date.toISOString(), recurringId: t.id };
      });

      setTransactions((txPrev) => [...newTxs, ...txPrev]);
      return prev.map((t) => toApply.find((a) => a.id === t.id) ? { ...t, lastAppliedMonth: currentMonth } : t);
    });
  }, [loaded]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...t, id: genId() };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];

      if (t.type === 'expense') {
        const monthKey = t.date.slice(0, 7);
        const relevantBudgets = budgets.filter((b) => b.month === monthKey && b.category === t.category);
        relevantBudgets.forEach((b) => {
          const spent = updated
            .filter((tx) => tx.type === 'expense' && tx.category === b.category && tx.date.startsWith(monthKey))
            .reduce((s, tx) => s + tx.amount, 0);
          checkBudgetAndNotify(b.category, spent, b.limit);
        });
      }

      return updated;
    });
  }, [budgets]);

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

  const addRecurring = useCallback((t: Omit<RecurringTemplate, 'id' | 'lastAppliedMonth'>) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setRecurringTemplates((prev) => [{ ...t, id: genId(), lastAppliedMonth: currentMonth }, ...prev]);
  }, []);

  const removeRecurring = useCallback((id: string) => {
    setRecurringTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const exportData = useCallback(async () => {
    return exportBackup({ transactions, budgets, goals, recurringTemplates });
  }, [transactions, budgets, goals, recurringTemplates]);

  const importData = useCallback(async () => {
    const data = await importBackup() as StoredData | null;
    if (!data || !data.transactions) return false;
    setTransactions(data.transactions ?? []);
    setBudgets(data.budgets ?? []);
    setGoals(data.goals ?? []);
    setRecurringTemplates(data.recurringTemplates ?? []);
    return true;
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
        recurringTemplates,
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
        addRecurring,
        removeRecurring,
        balance,
        exportData,
        importData,
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
