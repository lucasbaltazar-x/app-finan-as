import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, InputAccessoryView, Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors, fonts } from '../theme';
import { TransactionType } from '../types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Categorias ──────────────────────────────────────────────
interface Category { label: string; color: string; icon: IconName; custom?: boolean }

const EXPENSE_CATS: Category[] = [
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
  { label: 'Editar',          color: '#4a4e5e', icon: 'pencil-outline', custom: true },
];

const INCOME_CATS: Category[] = [
  { label: 'Salário',       color: '#4caf50', icon: 'cash-outline' },
  { label: 'Freelance',     color: '#2196f3', icon: 'laptop-outline' },
  { label: 'Investimento',  color: '#ff9800', icon: 'trending-up-outline' },
  { label: 'Aluguel',       color: '#9c27b0', icon: 'business-outline' },
  { label: 'Presente',      color: '#e91e63', icon: 'gift-outline' },
  { label: 'Outros',        color: '#607d8b', icon: 'ellipsis-horizontal-outline' },
  { label: 'Editar',        color: '#4a4e5e', icon: 'pencil-outline', custom: true },
];

export default function HomeScreen() {
  const { transactions, balance, budgets, addTransaction, removeTransaction } = useFinance();

  const [tab, setTab] = useState<'expense' | 'income'>('expense');

  // data global (usada como padrão nos lançamentos)
  const [globalDate, setGlobalDate] = useState(new Date());
  const [showGlobalPicker, setShowGlobalPicker] = useState(false);

  // modal categoria selecionada
  const [selCat, setSelCat] = useState<Category | null>(null);
  const [catAmount, setCatAmount] = useState('');
  const [catName, setCatName] = useState('');   // só usado em "Editar"
  const [catDesc, setCatDesc] = useState('');
  const [catDate, setCatDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const monthKey = currentMonthKey();
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));
  const income  = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBudgets = budgets.filter((b) => b.month === monthKey);
  const recent = transactions.slice(0, 5);

  function openCat(cat: Category) {
    setSelCat(cat);
    setCatAmount('');
    setCatName('');
    setCatDate(globalDate);
    setShowPicker(false);
    setCatDesc('');
  }

  function handleCatSave() {
    if (!selCat) return;
    const parsed = parseFloat(catAmount.replace(',', '.'));
    if (!parsed || parsed <= 0) return;
    const category = selCat.custom ? catName.trim() : selCat.label;
    if (!category) return;
    addTransaction({
      type: tab,
      amount: parsed,
      category,
      description: catDesc.trim(),
      date: catDate.toISOString(),
    });
    setSelCat(null);
  }

  const cats = tab === 'expense' ? EXPENSE_CATS : INCOME_CATS;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Data no topo ── */}
      <TouchableOpacity style={s.topDateRow} onPress={() => setShowGlobalPicker((v) => !v)}>
        <Text style={s.topDateText}>
          {globalDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={s.topDateChevron}>›</Text>
      </TouchableOpacity>

      {showGlobalPicker && (
        <DateTimePicker
          value={globalDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowGlobalPicker(false);
            if (date) setGlobalDate(date);
          }}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ── Saldo ── */}
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

      {/* ── Toggle Custo / Renda ── */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'expense' && s.tabBtnExpenseActive]}
          onPress={() => setTab('expense')}
        >
          <Text style={[s.tabBtnText, tab === 'expense' && { color: colors.expense, fontFamily: fonts.semibold }]}>
            Custo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'income' && s.tabBtnIncomeActive]}
          onPress={() => setTab('income')}
        >
          <Text style={[s.tabBtnText, tab === 'income' && { color: colors.income, fontFamily: fonts.semibold }]}>
            Renda
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Grade de categorias ── */}
      <View style={s.catGrid}>
        {cats.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={s.catCard}
            onPress={() => openCat(cat)}
          >
            <View style={[s.catIconWrap, { backgroundColor: cat.color + '22' }]}>
              <Ionicons name={cat.icon} size={24} color={cat.color} />
            </View>
            <Text style={s.catLabel} numberOfLines={2}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Orçamentos do mês ── */}
      {monthBudgets.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Orçamentos do mês</Text>
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
        </>
      )}

      {/* ── Últimas transações ── */}
      {recent.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Últimas transações</Text>
          {recent.map((t) => (
            <View key={t.id} style={s.txRow}>
              <View style={[s.txDot, { backgroundColor: t.type === 'income' ? colors.income : colors.expense }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.txCategory}>{t.category}</Text>
                {!!t.description && <Text style={s.txDesc}>{t.description}</Text>}
              </View>
              <Text style={[s.txAmount, { color: t.type === 'income' ? colors.income : colors.expense }]}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </Text>
              <TouchableOpacity style={s.txDelete} onPress={() => removeTransaction(t.id)}>
                <Text style={s.txDeleteText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* ── Modal lançamento por categoria ── */}
      <Modal visible={!!selCat} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              {/* cabeçalho colorido */}
              <View style={s.modalHeader}>
                <View style={[s.modalIconWrap, { backgroundColor: (selCat?.color ?? colors.primary) + '22' }]}>
                  <Ionicons name={selCat?.icon ?? 'pencil-outline'} size={22} color={selCat?.color ?? colors.primary} />
                </View>
                <Text style={s.modalTitle}>{selCat?.custom ? 'Lançamento personalizado' : selCat?.label}</Text>
              </View>
              <Text style={s.modalSubtitle}>
                {tab === 'expense' ? 'Custo' : 'Renda'}
              </Text>

              {/* campo nome só aparece no "Editar" */}
              {selCat?.custom && (
                <TextInput
                  style={s.input}
                  placeholder="Nome do lançamento"
                  placeholderTextColor={colors.placeholder}
                  value={catName}
                  onChangeText={setCatName}
                  inputAccessoryViewID="catAccessory"
                  returnKeyType="next"
                />
              )}

              <TextInput
                style={s.input}
                placeholder="Valor (ex: 150.00)"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
                value={catAmount}
                onChangeText={setCatAmount}
                autoFocus={!selCat?.custom}
                inputAccessoryViewID="catAccessory"
                returnKeyType="done"
                onSubmitEditing={handleCatSave}
              />
              <TextInput
                style={s.input}
                placeholder="Observação (opcional)"
                placeholderTextColor={colors.placeholder}
                value={catDesc}
                onChangeText={setCatDesc}
                inputAccessoryViewID="catAccessory"
                returnKeyType="done"
                onSubmitEditing={handleCatSave}
              />

              {/* Seletor de data */}
              <TouchableOpacity style={s.dateRow} onPress={() => { Keyboard.dismiss(); setShowPicker(true); }}>
                <Text style={s.dateLabel}>Data</Text>
                <Text style={s.dateValue}>
                  {catDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={catDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowPicker(false);
                    if (date) setCatDate(date);
                  }}
                  style={{ marginBottom: 12 }}
                />
              )}

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setSelCat(null)}>
                  <Text style={s.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, { backgroundColor: tab === 'expense' ? colors.expense : colors.income }]}
                  onPress={handleCatSave}
                >
                  <Text style={s.saveText}>Lançar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="catAccessory">
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
  content: { padding: 20, paddingBottom: 40 },

  // saldo
  topDateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  topDateText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, textTransform: 'capitalize' },
  topDateChevron: { color: colors.primary, fontSize: 22 },

  balanceCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, marginBottom: 20 },
  balanceLabel: { color: colors.subtext, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1, marginBottom: 6 },
  balance: { fontSize: 38, fontFamily: fonts.bold, color: colors.text, marginBottom: 20, letterSpacing: -0.5 },
  negative: { color: colors.expense },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthStat: { flex: 1 },
  monthStatLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginBottom: 3 },
  monthStatValue: { fontSize: 16, fontFamily: fonts.semibold },
  divider: { width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 16 },

  // toggle custo/renda
  tabRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnExpenseActive: { backgroundColor: colors.expenseSubtle },
  tabBtnIncomeActive:  { backgroundColor: colors.incomeSubtle },
  tabBtnText: { color: colors.subtext, fontFamily: fonts.medium, fontSize: 14 },

  // grade de categorias
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  catCard: {
    width: '30.5%', backgroundColor: colors.card, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center', gap: 10,
  },
  catIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' },

  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },

  budgetItem: { marginBottom: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  budgetCategory: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  budgetAmounts: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular },
  progressBg: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },

  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
  },
  txDot: { width: 3, height: 32, borderRadius: 2 },
  txCategory: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  txDesc: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  txAmount: { fontFamily: fonts.semibold, fontSize: 14 },
  txDelete: { padding: 6, marginLeft: 4 },
  txDeleteText: { color: colors.subtext, fontSize: 20, lineHeight: 22 },

  // modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  modalIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.semibold },
  modalSubtitle: { color: colors.subtext, fontSize: 13, fontFamily: fonts.regular, marginBottom: 20 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 15, color: colors.text, fontFamily: fonts.medium,
    fontSize: 16, marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 15, marginBottom: 12,
  },
  dateLabel: { color: colors.subtext, fontFamily: fonts.medium, fontSize: 14 },
  dateValue: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.card },
  cancelText: { color: colors.subtext, fontFamily: fonts.medium },
  saveBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontFamily: fonts.semibold },
  accessoryBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, padding: 10, alignItems: 'flex-end' },
  accessoryText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, paddingHorizontal: 8 },
});
