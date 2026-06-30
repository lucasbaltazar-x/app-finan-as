import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';

export default function HomeScreen() {
  const { transactions, balance, budgets } = useFinance();

  const monthKey = currentMonthKey();
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));
  const income = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const monthBudgets = budgets.filter((b) => b.month === monthKey);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Saldo total</Text>
      <Text style={[styles.balance, balance < 0 && styles.negative]}>
        {formatCurrency(balance)}
      </Text>

      <View style={styles.row}>
        <View style={[styles.card, styles.incomeCard]}>
          <Text style={styles.cardLabel}>Receitas (mês)</Text>
          <Text style={styles.cardValue}>{formatCurrency(income)}</Text>
        </View>
        <View style={[styles.card, styles.expenseCard]}>
          <Text style={styles.cardLabel}>Despesas (mês)</Text>
          <Text style={styles.cardValue}>{formatCurrency(expense)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Orçamentos do mês</Text>
      {monthBudgets.length === 0 && (
        <Text style={styles.empty}>Nenhum orçamento definido para este mês.</Text>
      )}
      {monthBudgets.map((b) => {
        const spent = monthTransactions
          .filter((t) => t.type === 'expense' && t.category === b.category)
          .reduce((s, t) => s + t.amount, 0);
        const pct = b.limit > 0 ? Math.min(spent / b.limit, 1) : 0;
        return (
          <View key={b.id} style={styles.budgetItem}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetCategory}>{b.category}</Text>
              <Text style={styles.budgetAmounts}>
                {formatCurrency(spent)} / {formatCurrency(b.limit)}
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct * 100}%`, backgroundColor: pct >= 1 ? '#e53935' : '#43a047' },
                ]}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 20 },
  label: { fontSize: 14, color: '#666' },
  balance: { fontSize: 36, fontWeight: '700', color: '#1b5e20', marginBottom: 20 },
  negative: { color: '#c62828' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  card: { flex: 1, borderRadius: 12, padding: 16 },
  incomeCard: { backgroundColor: '#e8f5e9' },
  expenseCard: { backgroundColor: '#ffebee' },
  cardLabel: { fontSize: 12, color: '#555' },
  cardValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { color: '#888', fontSize: 13 },
  budgetItem: { marginBottom: 14 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  budgetCategory: { fontWeight: '600' },
  budgetAmounts: { color: '#555', fontSize: 13 },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
});
