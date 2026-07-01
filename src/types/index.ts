export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  recurringId?: string; // se for gerado por um template recorrente
}

export interface RecurringTemplate {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  dayOfMonth: number; // dia do mês para lançar
  lastAppliedMonth: string; // 'YYYY-MM' do último mês gerado
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string; // 'YYYY-MM'
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string; // ISO string
}
