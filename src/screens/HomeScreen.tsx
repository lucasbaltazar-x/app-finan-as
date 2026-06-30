import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors } from '../theme';
import { TransactionType } from '../types';

interface QuickShortcut {
  label: string;
  emoji: string;
  category: string;
  type: TransactionType;
  defaultAmount?: number;
}

const SHORTCUTS: QuickShortcut[] = [
  { label: 'Salário', emoji: '💰', category: 'Salário', type: 'income' },
  { label: 'Mercado', emoji: '🛒', category: 'Supermercado', type: 'expense' },
  { label: 'Uber', emoji: '🚗', category: 'Transporte', type: 'expense' },
  { label: 'Aluguel', emoji: '🏠', category: 'Aluguel', type: 'expense' },
  { label: 'Restaurante', emoji: '🍽️', category: 'Alimentação', type: 'expense' },
  { label: 'Academia', emoji: '💪', category: 'Academia', type: 'expense' },
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
      {/* Saldo */}
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Saldo total</Text>
        <Text style={[s.balance, balance < 0 && s.negative]}>{formatCurrency(balance)}</Text>
        <View style={s.monthRow}>
          <View style={s.monthStat}>
            <Text style={s.monthStatLabel}>↑ Receitas</Text>
            <Text style={[s.monthStatValue, { color: colors.income }]}>{formatCurrency(income)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.monthStat}>
            <Text style={s.monthStatLabel}>↓ Despesas</Text>
            <Text style={[s.monthStatValue, { color: colors.expense }]}>{formatCurrency(expense)}</Text>
          </View>
        </View>
      </View>

      {/* Atalhos rápidos */}
      <Text style={s.sectionTitle}>Lançamento rápido</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.shortcutsScroll}>
        {SHORTCUTS.map((sc) => (
          <TouchableOpacity
            key={sc.label}
            style={[s.shortcutBtn, { borderColor: sc.type === 'income' ? colors.income : colors.expense }]}
            onPress={() => { setQuickShortcut(sc); setQuickAmount(''); }}
          >
            <Text style={s.shortcutEmoji}>{sc.emoji}</Text>
            <Text style={s.shortcutLabel}>{sc.label}</Text>
            <Text style={[s.shortcutType, { color: sc.type === 'income' ? colors.income : colors.expense }]}>
              {sc.type === 'income' ? '+ receita' : '- despesa'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orçamentos */}
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

      {/* Modal atalho rápido */}
      <Modal visible={!!quickShortcut} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              {quickShortcut?.emoji} {quickShortcut?.label}
            </Text>
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
  balanceCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24 },
  balanceLabel: { color: colors.subtext, fontSize: 13, marginBottom: 4 },
  balance: { fontSize: 36, fontWeight: '800', color: colors.primary, marginBottom: 16 },
  negative: { color: colors.expense },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthStat: { flex: 1, alignItems: 'center' },
  monthStatLabel: { color: colors.subtext, fontSize: 12, marginBottom: 2 },
  monthStatValue: { fontSize: 16, fontWeight: '700' },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  shortcutsScroll: { marginBottom: 16 },
  shortcutBtn: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginRight: 10,
    alignItems: 'center', borderWidth: 1, minWidth: 90,
  },
  shortcutEmoji: { fontSize: 24, marginBottom: 4 },
  shortcutLabel: { color: colors.text, fontWeight: '600', fontSize: 13 },
  shortcutType: { fontSize: 10, marginTop: 2 },
  empty: { color: colors.subtext, fontSize: 13, marginBottom: 8 },
  budgetItem: { marginBottom: 14 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetCategory: { color: colors.text, fontWeight: '600' },
  budgetAmounts: { color: colors.subtext, fontSize: 13 },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { color: colors.subtext, fontSize: 13, marginBottom: 16 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, fontSize: 18, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: colors.card },
  cancelText: { color: colors.subtext, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontWeight: '700' },
});
