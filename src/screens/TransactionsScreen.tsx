import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { TransactionType } from '../types';

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
    addTransaction({
      type,
      amount: parsed,
      category: category.trim(),
      description: description.trim(),
      date: new Date().toISOString(),
    });
    resetForm();
    setModalVisible(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma transação ainda.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onLongPress={() => removeTransaction(item.id)}
          >
            <View>
              <Text style={styles.itemCategory}>{item.category}</Text>
              {!!item.description && (
                <Text style={styles.itemDesc}>{item.description}</Text>
              )}
              <Text style={styles.itemDate}>
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <Text
              style={[
                styles.itemAmount,
                { color: item.type === 'income' ? '#2e7d32' : '#c62828' },
              ]}
            >
              {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova transação</Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
                onPress={() => setType('expense')}
              >
                <Text style={type === 'expense' ? styles.typeTextActive : styles.typeText}>
                  Despesa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                onPress={() => setType('income')}
              >
                <Text style={type === 'income' ? styles.typeTextActive : styles.typeText}>
                  Receita
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Valor (ex: 150.00)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Categoria (ex: Alimentação)"
              value={category}
              onChangeText={setCategory}
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  itemCategory: { fontWeight: '600', fontSize: 15 },
  itemDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  itemDate: { color: '#999', fontSize: 11, marginTop: 4 },
  itemAmount: { fontWeight: '700', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center' },
  typeBtnActiveExpense: { backgroundColor: '#ffcdd2' },
  typeBtnActiveIncome: { backgroundColor: '#c8e6c9' },
  typeText: { color: '#555' },
  typeTextActive: { fontWeight: '700', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#eee' },
  cancelText: { color: '#555', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#1b5e20' },
  saveText: { color: '#fff', fontWeight: '700' },
});
