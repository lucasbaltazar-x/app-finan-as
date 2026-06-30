import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors, fonts } from '../theme';
import { TransactionType } from '../types';

interface QuickShortcut {
  label: string;
  category: string;
  type: TransactionType;
}

const SHORTCUTS: QuickShortcut[] = [
  { label: 'Salário', category: 'Salário', type: 'income' },
  { label: 'Mercado', category: 'Supermercado', type: 'expense' },
  { label: 'Transporte', category: 'Transporte', type: 'expense' },
  { label: 'Aluguel', category: 'Aluguel', type: 'expense' },
  { label: 'Restaurante', category: 'Alimentação', type: 'expense' },
  { label: 'Academia', category: 'Academia', type: 'expense' },
];

export default function HomeScreen() {
  const { transactions, balance, budgets, addTransaction } = useFinance();
  const [quickShortcut, setQuickShortcut] = useState<QuickShortcut | null>(null);
  const [quickAmount, setQuickAmount] = useState('');

  const monthKey = currentMonthKey();
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));
  const income = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBudgets = budgets.filter((b) => b.month === monthKey);

  function handleQuickSave() {
    if (!quickShortcut) return;
    const parsed = parseFloat(quickAmount.replace(',', '.'));
    if (!parsed || parsed <= 0) return;
    addTransaction({
      type: quickShortcut.type,
      amount: parsed,
      category: quickShortcut.category,
      description: '',
      date: new Date().toISOString(),
    });
    setQuickShortcut(null);
    setQuickAmount('');
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>SALDO TOTAL</Text>
        <Text style={[s.balance, balance < 0 && s.negative]}>{formatCurrency(balance)}</Text>
        <View style={s.monthRow}>
          <View style={s.monthStat}>
            <Text style={s.monthStatLabel}>Receitas</Text>
            <Text style={[s.monthStatValue, { color: colors.income }]}>{formatCurrency(income)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.monthStat}>
            <Text style={s.monthStatLabel}>Despesas</Text>
            <Text style={[s.monthStatValue, { color: colors.expense }]}>{formatCurrency(expense)}</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Lançamento rápido</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.shortcutsScroll}>
        {SHORTCUTS.map((sc) => (
          <TouchableOpacity
            key={sc.label}
            style={s.shortcutBtn}
            onPress={() => { setQuickShortcut(sc); setQuickAmount(''); }}
          >
            <View style={[s.shortcutIndicator, { backgroundColor: sc.type === 'income' ? colors.income : colors.expense }]} />
            <Text style={s.shortcutLabel}>{sc.label}</Text>
            <Text style={[s.shortcutType, { color: sc.type === 'income' ? colors.income : colors.expense }]}>
              {sc.type === 'income' ? '+ receita' : '− despesa'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.sectionTitle}>Orçamentos do mês</Text>
      {monthBudgets.length === 0 && <Text style={s.empty}>Nenhum orçamento definido para este mês.</Text>}
      {monthBudgets.map((b) => {
        const spent = monthTransactions
          .filter((t) => t.type === 'expense' && t.category === b.category)
          .reduce((sum, t) => sum + t.amount, 0);
        const pct = b.limit > 0 ? Math.min(spent / b.limit, 1) : 0;
        return (
          <View key={b.id} style={s.budgetItem}>
            <View style={s.budgetHeader}>
              <Text style={s.budgetCategory}>{b.category}</Text>
              <Text style={s.budgetAmounts}>{formatCurrency(spent)} / {formatCurrency(b.limit)}</Text>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: pct >= 1 ? colors.expense : colors.primary }]} />
            </View>
          </View>
        );
      })}

      <Modal visible={!!quickShortcut} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{quickShortcut?.label}</Text>
            <Text style={s.modalSubtitle}>{quickShortcut?.category}</Text>
            <TextInput
              style={s.input}
              placeholder="Valor (ex: 150.00)"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={quickAmount}
              onChangeText={setQuickAmount}
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setQuickShortcut(null)}>
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleQuickSave}>
                <Text style={s.saveText}>Lançar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  balanceCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, marginBottom: 28 },
  balanceLabel: { color: colors.subtext, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1, marginBottom: 6 },
  balance: { fontSize: 38, fontFamily: fonts.bold, color: colors.text, marginBottom: 20, letterSpacing: -0.5 },
  negative: { color: colors.expense },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthStat: { flex: 1 },
  monthStatLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginBottom: 3 },
  monthStatValue: { fontSize: 16, fontFamily: fonts.semibold },
  divider: { width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 16 },
  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },
  shortcutsScroll: { marginBottom: 28 },
  shortcutBtn: {
    backgroundColor: colors.card, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, marginRight: 10,
    minWidth: 110,
  },
  shortcutIndicator: { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
  shortcutLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 13 },
  shortcutType: { fontSize: 11, fontFamily: fonts.regular, marginTop: 3 },
  empty: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular, marginBottom: 8 },
  budgetItem: { marginBottom: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  budgetCategory: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  budgetAmounts: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular },
  progressBg: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.semibold, marginBottom: 4 },
  modalSubtitle: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular, marginBottom: 20 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, color: colors.text, fontSize: 18, fontFamily: fonts.medium, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.card },
  cancelText: { color: colors.subtext, fontFamily: fonts.medium },
  saveBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontFamily: fonts.semibold },
});
