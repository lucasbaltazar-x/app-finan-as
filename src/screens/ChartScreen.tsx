import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { colors, fonts } from '../theme';
import DateHeader from '../components/DateHeader';

export default function ChartScreen() {
  const { transactions, removeTransaction } = useFinance();

  const totalIncome  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <View style={s.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <DateHeader />

            {/* ── Balanço ── */}
            <View style={s.balanceCard}>
              {/* Despesas e Renda */}
              <View style={s.row}>
                <View style={s.statBox}>
                  <View style={[s.statBar, { backgroundColor: colors.expense }]} />
                  <Text style={s.statLabel}>Despesas</Text>
                  <Text style={[s.statValue, { color: colors.expense }]}>
                    -{formatCurrency(totalExpense)}
                  </Text>
                </View>
                <View style={s.separator} />
                <View style={s.statBox}>
                  <View style={[s.statBar, { backgroundColor: colors.income }]} />
                  <Text style={s.statLabel}>Renda</Text>
                  <Text style={[s.statValue, { color: colors.income }]}>
                    +{formatCurrency(totalIncome)}
                  </Text>
                </View>
              </View>

              {/* Divisor */}
              <View style={s.divider} />

              {/* Balanço */}
              <View style={s.balanceRow}>
                <Text style={s.balanceLabel}>Balanço</Text>
                <Text style={[s.balanceValue, { color: balance >= 0 ? colors.income : colors.expense }]}>
                  {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                </Text>
              </View>
            </View>

            <Text style={s.sectionTitle}>Todos os lançamentos</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={s.empty}>Nenhum lançamento ainda.{'\n'}Use a aba Lançar para adicionar.</Text>
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={[s.itemAccent, { backgroundColor: item.type === 'income' ? colors.income : colors.expense }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemCategory}>{item.category}</Text>
              {!!item.description && <Text style={s.itemDesc}>{item.description}</Text>}
              <Text style={s.itemDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={[s.itemAmount, { color: item.type === 'income' ? colors.income : colors.expense }]}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            <TouchableOpacity style={s.deleteBtn} onPress={() => removeTransaction(item.id)}>
              <Text style={s.deleteBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // card de balanço
  balanceCard: {
    backgroundColor: colors.surface, borderRadius: 20,
    padding: 20, marginBottom: 28,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  statBox: { flex: 1, alignItems: 'flex-start', gap: 6 },
  statBar: { width: 28, height: 3, borderRadius: 2 },
  statLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular },
  statValue: { fontSize: 18, fontFamily: fonts.semibold, letterSpacing: -0.3 },
  separator: { width: 1, height: '100%', backgroundColor: colors.border, marginHorizontal: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: colors.subtext, fontSize: 13, fontFamily: fonts.medium },
  balanceValue: { fontSize: 22, fontFamily: fonts.bold, letterSpacing: -0.5 },

  // lista
  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },
  empty: { color: colors.subtext, fontFamily: fonts.regular, textAlign: 'center', marginTop: 20, lineHeight: 22 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10,
  },
  itemAccent: { width: 3, height: 36, borderRadius: 2 },
  itemCategory: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  itemDesc: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  itemDate: { color: colors.placeholder, fontSize: 11, fontFamily: fonts.regular, marginTop: 4 },
  itemAmount: { fontFamily: fonts.semibold, fontSize: 14 },
  deleteBtn: { padding: 6, marginLeft: 4 },
  deleteBtnText: { color: colors.subtext, fontSize: 20, lineHeight: 22 },
});
