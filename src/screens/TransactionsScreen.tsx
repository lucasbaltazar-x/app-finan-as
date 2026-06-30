import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { TransactionType } from '../types';
import { colors } from '../theme';

export default function TransactionsScreen() {
  const { transactions, addTransaction, removeTransaction } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

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

  return (
    <View style={s.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
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
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Nova transação</Text>
            <View style={s.typeRow}>
              <TouchableOpacity
                style={[s.typeBtn, type === 'expense' && s.typeBtnExpense]}
                onPress={() => setType('expense')}
              >
                <Text style={[s.typeText, type === 'expense' && { color: colors.expense, fontWeight: '700' }]}>Despesa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.typeBtn, type === 'income' && s.typeBtnIncome]}
                onPress={() => setType('income')}
              >
                <Text style={[s.typeText, type === 'income' && { color: colors.income, fontWeight: '700' }]}>Receita</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={s.input} placeholder="Valor (ex: 150.00)" placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <TextInput style={s.input} placeholder="Categoria (ex: Alimentação)" placeholderTextColor={colors.placeholder} value={category} onChangeText={setCategory} />
            <TextInput style={s.input} placeholder="Descrição (opcional)" placeholderTextColor={colors.placeholder} value={description} onChangeText={setDescription} />
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
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { color: colors.subtext, textAlign: 'center', marginTop: 60, lineHeight: 22 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  itemDot: { width: 4, height: 40, borderRadius: 2 },
  itemCategory: { color: colors.text, fontWeight: '600', fontSize: 15 },
  itemDesc: { color: colors.subtext, fontSize: 13, marginTop: 2 },
  itemDate: { color: colors.placeholder, fontSize: 11, marginTop: 4 },
  itemAmount: { fontWeight: '700', fontSize: 15 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.card, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  typeBtnExpense: { borderColor: colors.expense, backgroundColor: colors.expenseSubtle },
  typeBtnIncome: { borderColor: colors.income, backgroundColor: colors.incomeSubtle },
  typeText: { color: colors.subtext },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: colors.card },
  cancelText: { color: colors.subtext, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontWeight: '700' },
});
