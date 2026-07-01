import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { colors, fonts } from '../theme';
import DateHeader from '../components/DateHeader';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function CalendarScreen() {
  const { transactions } = useFinance();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  function dayKey(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function totalsForDay(day: number) {
    const dk = dayKey(day);
    const dayTx = transactions.filter((t) => t.date.startsWith(dk));
    const expense = dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const income = dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    return { expense, income, count: dayTx.length };
  }

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const monthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthTotalExpense = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);

  const selectedDayTransactions = selectedDay
    ? transactions.filter((t) => t.date.startsWith(selectedDay))
    : [];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <DateHeader />
      <View style={s.calHeader}>
        <TouchableOpacity onPress={() => { setCalendarDate(new Date(calYear, calMonth - 1, 1)); setSelectedDay(null); }}>
          <Text style={s.calNavBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.calMonthTitle}>{MONTHS[calMonth]} {calYear}</Text>
        <TouchableOpacity onPress={() => { setCalendarDate(new Date(calYear, calMonth + 1, 1)); setSelectedDay(null); }}>
          <Text style={s.calNavBtn}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.monthTotal}>Total de gastos no mês: <Text style={{ color: colors.expense, fontFamily: fonts.semibold }}>{formatCurrency(monthTotalExpense)}</Text></Text>

      <View style={s.weekRow}>
        {WEEKDAYS.map((d) => <Text key={d} style={s.weekDay}>{d}</Text>)}
      </View>

      <View style={s.calGrid}>
        {calendarCells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={s.calCell} />;
          const dk = dayKey(day);
          const { expense, income, count } = totalsForDay(day);
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
              {expense > 0 && <Text style={s.calDayExpense}>{formatCurrency(expense)}</Text>}
              {income > 0 && <Text style={s.calDayIncome}>{formatCurrency(income)}</Text>}
              {count > 0 && <View style={[s.dot, isSelected && { backgroundColor: '#fff' }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDay && (
        <View style={s.dayDetail}>
          <Text style={s.dayDetailTitle}>
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', weekday: 'long' })}
          </Text>
          {selectedDayTransactions.length === 0
            ? <Text style={s.empty}>Nenhuma transação neste dia.</Text>
            : selectedDayTransactions.map((t) => (
              <View key={t.id} style={s.dayTxRow}>
                <View>
                  <Text style={s.dayTxCategory}>{t.category}</Text>
                  {!!t.description && <Text style={s.dayTxDesc}>{t.description}</Text>}
                </View>
                <Text style={[s.dayTxAmount, { color: t.type === 'income' ? colors.income : colors.expense }]}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </Text>
              </View>
            ))
          }
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calNavBtn: { fontSize: 32, color: colors.primary, paddingHorizontal: 12 },
  calMonthTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.bold },
  monthTotal: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular, marginBottom: 16 },
  weekRow: { flexDirection: 'row', marginBottom: 4, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.subtext, fontFamily: fonts.semibold },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 2 },
  calCell: { width: '14%', aspectRatio: 0.85, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, borderRadius: 10, marginBottom: 2 },
  calCellToday: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  calCellSelected: { backgroundColor: colors.primary },
  calDayNum: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  calDayNumToday: { color: colors.primary },
  calDayNumSelected: { color: '#fff' },
  calDayExpense: { fontSize: 7, color: colors.expense, fontFamily: fonts.medium, marginTop: 2 },
  calDayIncome: { fontSize: 7, color: colors.income, fontFamily: fonts.medium, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.subtext, marginTop: 3 },
  dayDetail: { borderTopWidth: 1, borderColor: colors.border, marginTop: 16, paddingTop: 16 },
  dayDetailTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, marginBottom: 10, textTransform: 'capitalize' },
  empty: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular },
  dayTxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
  dayTxCategory: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  dayTxDesc: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  dayTxAmount: { fontFamily: fonts.semibold, fontSize: 14 },
});
