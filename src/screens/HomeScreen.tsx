import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors } from '../theme';
import { TransactionType } from '../types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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

  // Calendar
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  function dayKey(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function expenseForDay(day: number) {
    return transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(dayKey(day)))
      .reduce((s, t) => s + t.amount, 0);
  }

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const selectedDayTransactions = selectedDay
    ? transactions.filter((t) => t.date.startsWith(selectedDay))
    : [];

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

      {/* Botão calendário */}
      <TouchableOpacity style={s.calendarBtn} onPress={() => setCalendarVisible(true)}>
        <Text style={s.calendarBtnIcon}>📅</Text>
        <Text style={s.calendarBtnText}>Ver gastos por dia</Text>
      </TouchableOpacity>

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

      {/* Modal Calendário */}
      <Modal visible={calendarVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.calHeader}>
              <TouchableOpacity onPress={() => { setCalendarDate(new Date(calYear, calMonth - 1, 1)); setSelectedDay(null); }}>
                <Text style={s.calNavBtn}>‹</Text>
              </TouchableOpacity>
              <Text style={s.calMonthTitle}>{MONTHS[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={() => { setCalendarDate(new Date(calYear, calMonth + 1, 1)); setSelectedDay(null); }}>
                <Text style={s.calNavBtn}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={s.weekRow}>
              {WEEKDAYS.map((d) => <Text key={d} style={s.weekDay}>{d}</Text>)}
            </View>

            <View style={s.calGrid}>
              {calendarCells.map((day, idx) => {
                if (!day) return <View key={`e-${idx}`} style={s.calCell} />;
                const dk = dayKey(day);
                const dayExp = expenseForDay(day);
                const isSelected = selectedDay === dk;
                return (
                  <TouchableOpacity
                    key={dk}
                    style={[s.calCell, isToday(day) && s.calCellToday, isSelected && s.calCellSelected]}
                    onPress={() => setSelectedDay(isSelected ? null : dk)}
                  >
                    <Text style={[s.calDayNum, isToday(day) && s.calDayNumToday, isSelected && s.calDayNumSelected]}>
                      {day}
                    </Text>
                    {dayExp > 0 && <Text style={s.calDayExpense}>{formatCurrency(dayExp)}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDay && (
              <View style={s.dayDetail}>
                <Text style={s.dayDetailTitle}>
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </Text>
                {selectedDayTransactions.length === 0
                  ? <Text style={s.empty}>Nenhuma transação neste dia.</Text>
                  : selectedDayTransactions.map((t) => (
                    <View key={t.id} style={s.dayTxRow}>
                      <Text style={s.dayTxCategory}>{t.category}</Text>
                      <Text style={[s.dayTxAmount, { color: t.type === 'income' ? colors.income : colors.expense }]}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </Text>
                    </View>
                  ))
                }
              </View>
            )}

            <TouchableOpacity style={s.saveBtn} onPress={() => { setCalendarVisible(false); setSelectedDay(null); }}>
              <Text style={s.saveText}>Fechar</Text>
            </TouchableOpacity>
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
  calendarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    marginBottom: 24, borderWidth: 1, borderColor: colors.border,
  },
  calendarBtnIcon: { fontSize: 20 },
  calendarBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
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
  // Calendar
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calNavBtn: { fontSize: 28, color: colors.primary, paddingHorizontal: 10 },
  calMonthTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.subtext, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6, borderRadius: 8, marginBottom: 2 },
  calCellToday: { backgroundColor: colors.primaryLight },
  calCellSelected: { backgroundColor: colors.primary },
  calDayNum: { fontSize: 13, fontWeight: '600', color: colors.text },
  calDayNumToday: { color: colors.primary },
  calDayNumSelected: { color: '#fff' },
  calDayExpense: { fontSize: 8, color: colors.expense, marginTop: 1 },
  dayDetail: { borderTopWidth: 1, borderColor: colors.border, marginTop: 10, paddingTop: 12, marginBottom: 12 },
  dayDetailTitle: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  dayTxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.border },
  dayTxCategory: { color: colors.text, fontSize: 14 },
  dayTxAmount: { fontWeight: '600', fontSize: 14 },
});
