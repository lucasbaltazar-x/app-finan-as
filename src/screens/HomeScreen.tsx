import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function HomeScreen() {
  const { transactions, balance, budgets } = useFinance();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthKey = currentMonthKey();
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));
  const income = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBudgets = budgets.filter((b) => b.month === monthKey);

  // Calendar helpers
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calMonthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  function dayKey(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function expenseForDay(day: number) {
    const dk = dayKey(day);
    return transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(dk))
      .reduce((s, t) => s + t.amount, 0);
  }

  function transactionsForDay(day: number) {
    const dk = dayKey(day);
    return transactions.filter((t) => t.date.startsWith(dk));
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

      {/* Botão Calendário de Gastos */}
      <TouchableOpacity style={styles.calendarBtn} onPress={() => setCalendarVisible(true)}>
        <Text style={styles.calendarBtnIcon}>📅</Text>
        <Text style={styles.calendarBtnText}>Ver gastos por dia</Text>
      </TouchableOpacity>

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

      {/* Modal Calendário */}
      <Modal visible={calendarVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Cabeçalho do mês */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => {
                const d = new Date(calYear, calMonth - 1, 1);
                setCalendarDate(d);
                setSelectedDay(null);
              }}>
                <Text style={styles.calNavBtn}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calMonthTitle}>{MONTHS[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={() => {
                const d = new Date(calYear, calMonth + 1, 1);
                setCalendarDate(d);
                setSelectedDay(null);
              }}>
                <Text style={styles.calNavBtn}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Dias da semana */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekDay}>{d}</Text>
              ))}
            </View>

            {/* Grade do calendário */}
            <View style={styles.calGrid}>
              {calendarCells.map((day, idx) => {
                if (!day) return <View key={`empty-${idx}`} style={styles.calCell} />;
                const dayExpense = expenseForDay(day);
                const dk = dayKey(day);
                const isSelected = selectedDay === dk;
                return (
                  <TouchableOpacity
                    key={dk}
                    style={[
                      styles.calCell,
                      isToday(day) && styles.calCellToday,
                      isSelected && styles.calCellSelected,
                    ]}
                    onPress={() => setSelectedDay(isSelected ? null : dk)}
                  >
                    <Text style={[styles.calDayNum, isToday(day) && styles.calDayNumToday]}>
                      {day}
                    </Text>
                    {dayExpense > 0 && (
                      <Text style={styles.calDayExpense}>
                        {formatCurrency(dayExpense)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Transações do dia selecionado */}
            {selectedDay && (
              <View style={styles.dayDetail}>
                <Text style={styles.dayDetailTitle}>
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </Text>
                {selectedDayTransactions.length === 0 ? (
                  <Text style={styles.empty}>Nenhuma transação neste dia.</Text>
                ) : (
                  selectedDayTransactions.map((t) => (
                    <View key={t.id} style={styles.dayTxRow}>
                      <Text style={styles.dayTxCategory}>{t.category}</Text>
                      <Text style={[styles.dayTxAmount, { color: t.type === 'income' ? '#2e7d32' : '#c62828' }]}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => { setCalendarVisible(false); setSelectedDay(null); }}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 20 },
  label: { fontSize: 14, color: '#666' },
  balance: { fontSize: 36, fontWeight: '700', color: '#1b5e20', marginBottom: 20 },
  negative: { color: '#c62828' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, borderRadius: 12, padding: 16 },
  incomeCard: { backgroundColor: '#e8f5e9' },
  expenseCard: { backgroundColor: '#ffebee' },
  cardLabel: { fontSize: 12, color: '#555' },
  cardValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  calendarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#e0e0e0',
  },
  calendarBtnIcon: { fontSize: 22 },
  calendarBtnText: { fontSize: 15, fontWeight: '600', color: '#1b5e20' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { color: '#888', fontSize: 13, marginVertical: 4 },
  budgetItem: { marginBottom: 14 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  budgetCategory: { fontWeight: '600' },
  budgetAmounts: { color: '#555', fontSize: 13 },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calNavBtn: { fontSize: 28, color: '#1b5e20', paddingHorizontal: 10 },
  calMonthTitle: { fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, color: '#888', fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6, borderRadius: 8, marginBottom: 4 },
  calCellToday: { backgroundColor: '#e8f5e9' },
  calCellSelected: { backgroundColor: '#1b5e20' },
  calDayNum: { fontSize: 13, fontWeight: '600', color: '#333' },
  calDayNumToday: { color: '#1b5e20' },
  calDayExpense: { fontSize: 9, color: '#c62828', marginTop: 1 },
  dayDetail: { borderTopWidth: 1, borderColor: '#eee', marginTop: 12, paddingTop: 12 },
  dayDetailTitle: { fontWeight: '700', fontSize: 15, marginBottom: 8 },
  dayTxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  dayTxCategory: { fontSize: 14 },
  dayTxAmount: { fontWeight: '600', fontSize: 14 },
  closeBtn: { marginTop: 16, backgroundColor: '#1b5e20', borderRadius: 10, padding: 14, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
