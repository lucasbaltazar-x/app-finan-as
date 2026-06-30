import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';

export default function BudgetGoalsScreen() {
  const {
    budgets,
    addBudget,
    removeBudget,
    goals,
    addGoal,
    updateGoalSavedAmount,
    removeGoal,
  } = useFinance();

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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>Orçamentos do mês</Text>
      <View style={styles.formRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Categoria"
          value={budgetCategory}
          onChangeText={setBudgetCategory}
        />
        <TextInput
          style={[styles.input, { width: 100 }]}
          placeholder="Limite"
          keyboardType="decimal-pad"
          value={budgetLimit}
          onChangeText={setBudgetLimit}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddBudget}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {monthBudgets.length === 0 && <Text style={styles.empty}>Nenhum orçamento ainda.</Text>}
      {monthBudgets.map((b) => (
        <View key={b.id} style={styles.listItem}>
          <Text style={styles.listItemTitle}>{b.category}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.listItemValue}>{formatCurrency(b.limit)}</Text>
            <TouchableOpacity onPress={() => removeBudget(b.id)}>
              <Text style={styles.removeText}>remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Metas de economia</Text>
      <View style={styles.formRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Nome da meta"
          value={goalName}
          onChangeText={setGoalName}
        />
        <TextInput
          style={[styles.input, { width: 100 }]}
          placeholder="Valor alvo"
          keyboardType="decimal-pad"
          value={goalTarget}
          onChangeText={setGoalTarget}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddGoal}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {goals.length === 0 && <Text style={styles.empty}>Nenhuma meta ainda.</Text>}
      {goals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min(g.savedAmount / g.targetAmount, 1) : 0;
        return (
          <View key={g.id} style={styles.goalItem}>
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>{g.name}</Text>
              <TouchableOpacity onPress={() => removeGoal(g.id)}>
                <Text style={styles.removeText}>remover</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.goalAmounts}>
              {formatCurrency(g.savedAmount)} / {formatCurrency(g.targetAmount)}
            </Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
            </View>
            <View style={styles.goalActions}>
              <TouchableOpacity
                style={styles.goalActionBtn}
                onPress={() =>
                  updateGoalSavedAmount(g.id, Math.max(0, g.savedAmount - 50))
                }
              >
                <Text style={styles.goalActionText}>-50</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goalActionBtn}
                onPress={() => updateGoalSavedAmount(g.id, g.savedAmount + 50)}
              >
                <Text style={styles.goalActionText}>+50</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1b5e20', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 20, lineHeight: 22 },
  empty: { color: '#888', fontSize: 13, marginBottom: 10 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  listItemTitle: { fontWeight: '600' },
  listItemValue: { color: '#555' },
  removeText: { color: '#c62828', fontSize: 12 },
  goalItem: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  goalAmounts: { color: '#555', fontSize: 13, marginTop: 4, marginBottom: 6 },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#1565c0' },
  goalActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  goalActionBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6, backgroundColor: '#e3f2fd' },
  goalActionText: { color: '#1565c0', fontWeight: '600' },
});
