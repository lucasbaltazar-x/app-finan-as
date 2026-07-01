import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Modal, KeyboardAvoidingView, Platform, InputAccessoryView, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors, fonts } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface BudgetCategory {
  label: string;
  color: string;
  icon: IconName;
}

const BUDGET_CATS: BudgetCategory[] = [
  { label: 'Comida',          color: '#ff9800', icon: 'fast-food-outline' },
  { label: 'Itens diários',   color: '#2196f3', icon: 'bag-handle-outline' },
  { label: 'Roupas',          color: '#e91e63', icon: 'shirt-outline' },
  { label: 'Cosméticos',      color: '#9c27b0', icon: 'sparkles-outline' },
  { label: 'Entretenimento',  color: '#00bcd4', icon: 'game-controller-outline' },
  { label: 'Saúde',           color: '#4caf50', icon: 'medkit-outline' },
  { label: 'Educação',        color: '#3f51b5', icon: 'school-outline' },
  { label: 'Luz, Água e Gás', color: '#ff5722', icon: 'flash-outline' },
  { label: 'Transporte',      color: '#607d8b', icon: 'car-outline' },
  { label: 'Comunicação',     color: '#009688', icon: 'call-outline' },
  { label: 'Contas de casa',  color: '#795548', icon: 'home-outline' },
];

export default function BudgetGoalsScreen() {
  const { budgets, addBudget, removeBudget, goals, addGoal, updateGoalSavedAmount, removeGoal, transactions } = useFinance();

  const [selCat, setSelCat] = useState<BudgetCategory | null>(null);
  const [limitValue, setLimitValue] = useState('');

  const [goalModal, setGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const monthKey = currentMonthKey();
  const monthBudgets = budgets.filter((b) => b.month === monthKey);
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));

  function handleAddBudget() {
    if (!selCat) return;
    const limit = parseFloat(limitValue.replace(',', '.'));
    if (!limit || limit <= 0) return;
    // remove orçamento anterior da mesma categoria se existir
    const existing = monthBudgets.find((b) => b.category === selCat.label);
    if (existing) removeBudget(existing.id);
    addBudget({ category: selCat.label, limit, month: monthKey });
    setSelCat(null);
    setLimitValue('');
  }

  function handleAddGoal() {
    const target = parseFloat(goalTarget.replace(',', '.'));
    if (!goalName.trim() || !target || target <= 0) return;
    addGoal({ name: goalName.trim(), targetAmount: target, savedAmount: 0 });
    setGoalName('');
    setGoalTarget('');
    setGoalModal(false);
  }

  function spentFor(category: string) {
    return monthTransactions
      .filter((t) => t.type === 'expense' && t.category === category)
      .reduce((s, t) => s + t.amount, 0);
  }

  function budgetFor(category: string) {
    return monthBudgets.find((b) => b.category === category) ?? null;
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

      {/* ── Orçamentos por categoria ── */}
      <Text style={s.sectionTitle}>Orçamentos do mês</Text>

      {BUDGET_CATS.map((cat) => {
        const budget = budgetFor(cat.label);
        const spent = spentFor(cat.label);
        const pct = budget ? Math.min(spent / budget.limit, 1) : 0;
        const hasLimit = !!budget;

        return (
          <TouchableOpacity
            key={cat.label}
            style={s.catRow}
            onPress={() => { setSelCat(cat); setLimitValue(budget ? String(budget.limit) : ''); }}
          >
            <View style={[s.catIconWrap, { backgroundColor: cat.color + '22' }]}>
              <Ionicons name={cat.icon} size={20} color={cat.color} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={s.catRowHeader}>
                <Text style={s.catLabel}>{cat.label}</Text>
                {hasLimit ? (
                  <Text style={s.catLimitText}>
                    {formatCurrency(spent)} / {formatCurrency(budget!.limit)}
                  </Text>
                ) : (
                  <Text style={s.catSetText}>Definir limite</Text>
                )}
              </View>
              {hasLimit && (
                <View style={s.progressBg}>
                  <View style={[s.progressFill, {
                    width: `${pct * 100}%`,
                    backgroundColor: pct >= 1 ? colors.expense : cat.color,
                  }]} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* ── Metas de economia ── */}
      <View style={s.sectionRow}>
        <Text style={[s.sectionTitle, { marginTop: 32, marginBottom: 0 }]}>Metas de economia</Text>
        <TouchableOpacity style={s.addGoalBtn} onPress={() => { setGoalName(''); setGoalTarget(''); setGoalModal(true); }}>
          <Text style={s.addGoalBtnText}>+ Nova meta</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 14 }} />

      {goals.length === 0 && <Text style={s.empty}>Nenhuma meta ainda.</Text>}
      {goals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min(g.savedAmount / g.targetAmount, 1) : 0;
        return (
          <View key={g.id} style={s.goalItem}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.goalName}>{g.name}</Text>
              <TouchableOpacity onPress={() => removeGoal(g.id)}>
                <Text style={s.removeText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.goalAmounts}>{formatCurrency(g.savedAmount)} / {formatCurrency(g.targetAmount)}</Text>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: colors.primary }]} />
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

      {/* ── Modal nova meta ── */}
      <Modal visible={goalModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <View style={s.modalHeader}>
                <View style={[s.modalIconWrap, { backgroundColor: colors.primary + '22' }]}>
                  <Ionicons name="flag-outline" size={22} color={colors.primary} />
                </View>
                <Text style={s.modalTitle}>Nova meta</Text>
              </View>
              <Text style={s.modalSubtitle}>Defina um objetivo de economia</Text>

              <TextInput
                style={s.modalInput}
                placeholder="Nome da meta (ex: Viagem)"
                placeholderTextColor={colors.placeholder}
                value={goalName}
                onChangeText={setGoalName}
                autoFocus
                inputAccessoryViewID="goalAccessory"
                returnKeyType="next"
              />
              <TextInput
                style={s.modalInput}
                placeholder="Valor alvo (ex: 2000.00)"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
                value={goalTarget}
                onChangeText={setGoalTarget}
                inputAccessoryViewID="goalAccessory"
                returnKeyType="done"
                onSubmitEditing={handleAddGoal}
              />

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setGoalModal(false)}>
                  <Text style={s.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleAddGoal}>
                  <Text style={s.saveText}>Criar meta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="goalAccessory">
            <View style={s.accessoryBar}>
              <TouchableOpacity onPress={Keyboard.dismiss}>
                <Text style={s.accessoryText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </Modal>

      {/* ── Modal definir limite ── */}
      <Modal visible={!!selCat} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <View style={s.modalHeader}>
                <View style={[s.modalIconWrap, { backgroundColor: (selCat?.color ?? colors.primary) + '22' }]}>
                  <Ionicons name={selCat?.icon ?? 'wallet-outline'} size={22} color={selCat?.color ?? colors.primary} />
                </View>
                <Text style={s.modalTitle}>{selCat?.label}</Text>
              </View>
              <Text style={s.modalSubtitle}>Defina o limite mensal para esta categoria</Text>

              <TextInput
                style={s.modalInput}
                placeholder="Limite (ex: 500.00)"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
                value={limitValue}
                onChangeText={setLimitValue}
                autoFocus
                inputAccessoryViewID="budgetAccessory"
                returnKeyType="done"
                onSubmitEditing={handleAddBudget}
              />

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setSelCat(null)}>
                  <Text style={s.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                {budgetFor(selCat?.label ?? '') && (
                  <TouchableOpacity style={s.removeBtn} onPress={() => {
                    const b = budgetFor(selCat!.label);
                    if (b) removeBudget(b.id);
                    setSelCat(null);
                  }}>
                    <Text style={s.removeBtnText}>Remover</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.saveBtn} onPress={handleAddBudget}>
                  <Text style={s.saveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="budgetAccessory">
            <View style={s.accessoryBar}>
              <TouchableOpacity onPress={Keyboard.dismiss}>
                <Text style={s.accessoryText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </Modal>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },

  // linha de categoria
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10,
  },
  catIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  catLimitText: { color: colors.subtext, fontFamily: fonts.regular, fontSize: 12 },
  catSetText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12 },

  progressBg: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },

  // cabeçalho de seção com botão
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  addGoalBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.primaryLight, marginTop: 32 },
  addGoalBtnText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  empty: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular, marginBottom: 10 },
  goalItem: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12 },
  goalName: { color: colors.text, fontFamily: fonts.medium, fontSize: 15 },
  goalAmounts: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular, marginTop: 8, marginBottom: 8 },
  pctText: { color: colors.primary, fontSize: 11, fontFamily: fonts.medium, marginTop: 6, marginBottom: 10 },
  removeText: { color: colors.expense, fontSize: 18, fontFamily: fonts.medium },
  goalActions: { flexDirection: 'row', gap: 8 },
  goalActionBtnMinus: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.expenseSubtle, alignItems: 'center', borderWidth: 1, borderColor: colors.expense },
  goalActionBtnPlus:  { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.incomeSubtle,  alignItems: 'center', borderWidth: 1, borderColor: colors.income },
  goalActionTextMinus: { color: colors.expense, fontFamily: fonts.semibold },
  goalActionTextPlus:  { color: colors.income,  fontFamily: fonts.semibold },

  // modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  modalIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.semibold },
  modalSubtitle: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular, marginBottom: 20 },
  modalInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 15, color: colors.text, fontFamily: fonts.medium,
    fontSize: 18, marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.card },
  cancelText: { color: colors.subtext, fontFamily: fonts.medium },
  removeBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.expenseSubtle, borderWidth: 1, borderColor: colors.expense },
  removeBtnText: { color: colors.expense, fontFamily: fonts.semibold },
  saveBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontFamily: fonts.semibold },
  accessoryBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, padding: 10, alignItems: 'flex-end' },
  accessoryText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, paddingHorizontal: 8 },
});
