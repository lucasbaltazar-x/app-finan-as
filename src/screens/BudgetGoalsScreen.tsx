import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors } from '../theme';

export default function BudgetGoalsScreen() {
  const { budgets, addBudget, removeBudget, goals, addGoal, updateGoalSavedAmount, removeGoal } = useFinance();
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const monthKey = currentMonthKey();
  const monthBudgets = budgets.filter((b) => b.month === monthKey);

  function handleAddBudget() {
    const limit = parseFloat(budgetLimit.replace(',', '.'));
    if (!budgetCategory.trim() || !limit || limit <= 0) return;
    addBudget({ category: budgetCategory.trim(), limit, month: monthKey });
    setBudgetCategory('');
    setBudgetLimit('');
  }

  function handleAddGoal() {
    const target = parseFloat(goalTarget.replace(',', '.'));
    if (!goalName.trim() || !target || target <= 0) return;
    addGoal({ name: goalName.trim(), targetAmount: target, savedAmount: 0 });
    setGoalName('');
    setGoalTarget('');
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={s.sectionTitle}>Orçamentos do mês</Text>
      <View style={s.formRow}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Categoria" placeholderTextColor={colors.placeholder} value={budgetCategory} onChangeText={setBudgetCategory} />
        <TextInput style={[s.input, { width: 110 }]} placeholder="Limite R$" placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" value={budgetLimit} onChangeText={setBudgetLimit} />
        <TouchableOpacity style={s.addBtn} onPress={handleAddBudget}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {monthBudgets.length === 0 && <Text style={s.empty}>Nenhum orçamento ainda.</Text>}
      {monthBudgets.map((b) => (
        <View key={b.id} style={s.listItem}>
          <Text style={s.listItemTitle}>{b.category}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={s.listItemValue}>{formatCurrency(b.limit)}</Text>
            <TouchableOpacity onPress={() => removeBudget(b.id)}>
              <Text style={s.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={[s.sectionTitle, { marginTop: 28 }]}>Metas de economia</Text>
      <View style={s.formRow}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Nome da meta" placeholderTextColor={colors.placeholder} value={goalName} onChangeText={setGoalName} />
        <TextInput style={[s.input, { width: 110 }]} placeholder="Valor R$" placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" value={goalTarget} onChangeText={setGoalTarget} />
        <TouchableOpacity style={s.addBtn} onPress={handleAddGoal}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {goals.length === 0 && <Text style={s.empty}>Nenhuma meta ainda.</Text>}
      {goals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min(g.savedAmount / g.targetAmount, 1) : 0;
        return (
          <View key={g.id} style={s.goalItem}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.listItemTitle}>{g.name}</Text>
              <TouchableOpacity onPress={() => removeGoal(g.id)}>
                <Text style={s.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.goalAmounts}>{formatCurrency(g.savedAmount)} / {formatCurrency(g.targetAmount)}</Text>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={s.pctText}>{Math.round(pct * 100)}% concluído</Text>
            <View style={s.goalActions}>
              <TouchableOpacity style={s.goalActionBtnMinus} onPress={() => updateGoalSavedAmount(g.id, Math.max(0, g.savedAmount - 50))}>
                <Text style={s.goalActionTextMinus}>- R$ 50</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.goalActionBtnPlus} onPress={() => updateGoalSavedAmount(g.id, g.savedAmount + 50)}>
                <Text style={s.goalActionTextPlus}>+ R$ 50</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'center' },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text },
  addBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 24 },
  empty: { color: colors.subtext, fontSize: 13, marginBottom: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8 },
  listItemTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  listItemValue: { color: colors.subtext },
  removeText: { color: colors.expense, fontSize: 14, fontWeight: '700' },
  goalItem: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  goalAmounts: { color: colors.subtext, fontSize: 13, marginTop: 8, marginBottom: 8 },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  pctText: { color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 4, marginBottom: 10 },
  goalActions: { flexDirection: 'row', gap: 8 },
  goalActionBtnMinus: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.expenseSubtle, alignItems: 'center', borderWidth: 1, borderColor: colors.expense },
  goalActionBtnPlus: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.incomeSubtle, alignItems: 'center', borderWidth: 1, borderColor: colors.income },
  goalActionTextMinus: { color: colors.expense, fontWeight: '700' },
  goalActionTextPlus: { color: colors.income, fontWeight: '700' },
});
