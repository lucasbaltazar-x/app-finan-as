import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, InputAccessoryView, Keyboard,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors, fonts } from '../theme';
import { TransactionType } from '../types';

export default function HomeScreen() {
  const { transactions, balance, budgets, addTransaction, removeTransaction } = useFinance();

  const [newModal, setNewModal] = useState(false);
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const monthKey = currentMonthKey();
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));
  const income  = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBudgets = budgets.filter((b) => b.month === monthKey);

  function resetNew() {
    setNewType('expense');
    setNewName('');
    setNewAmount('');
    setNewDesc('');
  }

  function handleNewSave() {
    const parsed = parseFloat(newAmount.replace(',', '.'));
    if (!parsed || parsed <= 0 || !newName.trim()) return;
    addTransaction({
      type: newType,
      amount: parsed,
      category: newName.trim(),
      description: newDesc.trim(),
      date: new Date().toISOString(),
    });
    resetNew();
    setNewModal(false);
  }

  const recent = transactions.slice(0, 5);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

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

      {/* ── Novo lançamento ── */}
      <TouchableOpacity style={s.newBtn} onPress={() => setNewModal(true)}>
        <View style={s.newBtnPlus}><Text style={s.newBtnPlusText}>+</Text></View>
        <Text style={s.newBtnLabel}>Novo lançamento</Text>
      </TouchableOpacity>

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

      {/* ── Modal novo lançamento ── */}
      <Modal visible={newModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Novo lançamento</Text>

              <View style={s.typeRow}>
                <TouchableOpacity
                  style={[s.typeBtn, newType === 'expense' && s.typeBtnExpense]}
                  onPress={() => setNewType('expense')}
                >
                  <Text style={[s.typeText, newType === 'expense' && { color: colors.expense, fontFamily: fonts.semibold }]}>
                    Despesa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.typeBtn, newType === 'income' && s.typeBtnIncome]}
                  onPress={() => setNewType('income')}
                >
                  <Text style={[s.typeText, newType === 'income' && { color: colors.income, fontFamily: fonts.semibold }]}>
                    Receita
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={s.input}
                placeholder="Nome (ex: Conta de luz)"
                placeholderTextColor={colors.placeholder}
                value={newName}
                onChangeText={setNewName}
                inputAccessoryViewID="newLanAccessory"
                returnKeyType="next"
              />
              <TextInput
                style={s.input}
                placeholder="Valor (ex: 150.00)"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
                value={newAmount}
                onChangeText={setNewAmount}
                inputAccessoryViewID="newLanAccessory"
                returnKeyType="done"
              />
              <TextInput
                style={s.input}
                placeholder="Observação (opcional)"
                placeholderTextColor={colors.placeholder}
                value={newDesc}
                onChangeText={setNewDesc}
                inputAccessoryViewID="newLanAccessory"
                returnKeyType="done"
                onSubmitEditing={handleNewSave}
              />

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { resetNew(); setNewModal(false); }}>
                  <Text style={s.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleNewSave}>
                  <Text style={s.saveText}>Lançar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="newLanAccessory">
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

  balanceCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, marginBottom: 20 },
  balanceLabel: { color: colors.subtext, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1, marginBottom: 6 },
  balance: { fontSize: 38, fontFamily: fonts.bold, color: colors.text, marginBottom: 20, letterSpacing: -0.5 },
  negative: { color: colors.expense },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthStat: { flex: 1 },
  monthStatLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginBottom: 3 },
  monthStatValue: { fontSize: 16, fontFamily: fonts.semibold },
  divider: { width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 16 },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18,
    marginBottom: 28, borderWidth: 1, borderColor: colors.border,
  },
  newBtnPlus: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  newBtnPlusText: { color: '#fff', fontSize: 20, lineHeight: 22, fontFamily: fonts.regular },
  newBtnLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 15 },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.semibold, marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center' },
  typeBtnExpense: { backgroundColor: colors.expenseSubtle },
  typeBtnIncome: { backgroundColor: colors.incomeSubtle },
  typeText: { color: colors.subtext, fontFamily: fonts.medium },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 15, color: colors.text, fontFamily: fonts.medium,
    fontSize: 16, marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.card },
  cancelText: { color: colors.subtext, fontFamily: fonts.medium },
  saveBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontFamily: fonts.semibold },
  accessoryBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, padding: 10, alignItems: 'flex-end' },
  accessoryText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, paddingHorizontal: 8 },
});
