import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform, InputAccessoryView, Keyboard } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { TransactionType } from '../types';
import { colors, fonts } from '../theme';

const DAYS_WINDOW = 14;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ChartScreen() {
  const { transactions, addTransaction, removeTransaction } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const days = useMemo(() => {
    const arr: { key: string; label: string; total: number }[] = [];
    for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = isoDay(d);
      const total = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(key))
        .reduce((s, t) => s + t.amount, 0);
      arr.push({ key, label: String(d.getDate()), total });
    }
    return arr;
  }, [transactions]);

  const maxTotal = Math.max(...days.map((d) => d.total), 1);
  const periodTotal = days.reduce((s, d) => s + d.total, 0);
  const avgDaily = periodTotal / DAYS_WINDOW;

  function resetForm() {
    setType('expense');
    setAmount('');
    setCategory('');
    setDescription('');
  }

  function handleSave() {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || parsed <= 0 || !category.trim()) return;
    addTransaction({ type, amount: parsed, category: category.trim(), description: description.trim(), date: new Date().toISOString() });
    resetForm();
    setModalVisible(false);
  }

  const recent = transactions.slice(0, 30);

  return (
    <View style={s.container}>
      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>Gasto médio diário (últimos {DAYS_WINDOW} dias)</Text>
              <Text style={s.summaryValue}>{formatCurrency(avgDaily)}</Text>
            </View>

            <Text style={s.sectionTitle}>Evolução dos gastos</Text>
            <View style={s.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.chartRow}>
                  {days.map((d) => {
                    const heightPct = d.total > 0 ? Math.max((d.total / maxTotal) * 100, 6) : 2;
                    return (
                      <View key={d.key} style={s.barCol}>
                        <View style={s.barTrack}>
                          <View style={[s.bar, { height: `${heightPct}%` }]} />
                        </View>
                        <Text style={s.barLabel}>{d.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <Text style={s.sectionTitle}>Últimas transações</Text>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>Nenhuma transação ainda.{'\n'}Use os atalhos na tela Início ou o botão + abaixo.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.item} onLongPress={() => removeTransaction(item.id)}>
            <View style={[s.itemDot, { backgroundColor: item.type === 'income' ? colors.income : colors.expense }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemCategory}>{item.category}</Text>
              {!!item.description && <Text style={s.itemDesc}>{item.description}</Text>}
              <Text style={s.itemDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={[s.itemAmount, { color: item.type === 'income' ? colors.income : colors.expense }]}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Nova transação</Text>
              <View style={s.typeRow}>
                <TouchableOpacity style={[s.typeBtn, type === 'expense' && s.typeBtnExpense]} onPress={() => setType('expense')}>
                  <Text style={[s.typeText, type === 'expense' && { color: colors.expense, fontFamily: fonts.semibold }]}>Despesa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.typeBtn, type === 'income' && s.typeBtnIncome]} onPress={() => setType('income')}>
                  <Text style={[s.typeText, type === 'income' && { color: colors.income, fontFamily: fonts.semibold }]}>Receita</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={s.input} placeholder="Valor (ex: 150.00)" placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} inputAccessoryViewID="newTxAccessory" returnKeyType="done" />
              <TextInput style={s.input} placeholder="Categoria (ex: Alimentação)" placeholderTextColor={colors.placeholder} value={category} onChangeText={setCategory} inputAccessoryViewID="newTxAccessory" returnKeyType="done" />
              <TextInput style={s.input} placeholder="Descrição (opcional)" placeholderTextColor={colors.placeholder} value={description} onChangeText={setDescription} inputAccessoryViewID="newTxAccessory" returnKeyType="done" onSubmitEditing={handleSave} />
              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { resetForm(); setModalVisible(false); }}>
                  <Text style={s.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                  <Text style={s.saveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="newTxAccessory">
            <View style={s.accessoryBar}>
              <TouchableOpacity onPress={Keyboard.dismiss}>
                <Text style={s.accessoryText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24 },
  summaryLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginBottom: 6 },
  summaryValue: { color: colors.text, fontSize: 28, fontFamily: fonts.bold, letterSpacing: -0.5 },
  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },
  chartCard: { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 28 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 10 },
  barCol: { alignItems: 'center', width: 24 },
  barTrack: { width: 12, height: 110, justifyContent: 'flex-end', backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  bar: { width: 12, backgroundColor: colors.primary, borderRadius: 6 },
  barLabel: { color: colors.subtext, fontSize: 9, fontFamily: fonts.regular, marginTop: 8 },
  empty: { color: colors.subtext, fontFamily: fonts.regular, textAlign: 'center', marginTop: 20, lineHeight: 22 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, gap: 12 },
  itemDot: { width: 3, height: 36, borderRadius: 2 },
  itemCategory: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  itemDesc: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  itemDate: { color: colors.placeholder, fontSize: 11, fontFamily: fonts.regular, marginTop: 4 },
  itemAmount: { fontFamily: fonts.semibold, fontSize: 14 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 28, fontFamily: fonts.regular },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold, marginBottom: 18 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center' },
  typeBtnExpense: { backgroundColor: colors.expenseSubtle },
  typeBtnIncome: { backgroundColor: colors.incomeSubtle },
  typeText: { color: colors.subtext, fontFamily: fonts.medium },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 15, color: colors.text, fontFamily: fonts.regular, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.card },
  cancelText: { color: colors.subtext, fontFamily: fonts.medium },
  saveBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontFamily: fonts.semibold },
  accessoryBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, padding: 10, alignItems: 'flex-end' },
  accessoryText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, paddingHorizontal: 8 },
});
