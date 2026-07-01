import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { colors, fonts } from '../theme';
import DateHeader from '../components/DateHeader';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SLICE_COLORS = [
  '#4caf50','#2196f3','#ff9800','#e91e63','#9c27b0',
  '#00bcd4','#ff5722','#cddc39','#ffc107','#03a9f4',
];

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlice(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  const o1 = polarToCartesian(cx, cy, outerR, start);
  const o2 = polarToCartesian(cx, cy, outerR, end);
  const i1 = polarToCartesian(cx, cy, innerR, end);
  const i2 = polarToCartesian(cx, cy, innerR, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

function diffLabel(curr: number, prev: number): { text: string; color: string; icon: IconName } {
  if (prev === 0) return { text: '—', color: colors.subtext, icon: 'remove-outline' };
  const pct = ((curr - prev) / prev) * 100;
  const up = pct > 0;
  return {
    text: `${up ? '+' : ''}${pct.toFixed(0)}%`,
    color: up ? colors.expense : colors.income,
    icon: up ? 'trending-up-outline' : 'trending-down-outline',
  };
}

export default function ChartScreen() {
  const { transactions, removeTransaction, selectedDate, exportData, importData } = useFinance();
  const [search, setSearch] = useState('');

  const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // mês anterior
  const prevDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevLabel = prevDate.toLocaleDateString('pt-BR', { month: 'long' });

  const monthTx = transactions.filter((t) => t.date.startsWith(monthKey));
  const filteredTx = search.trim()
    ? monthTx.filter((t) =>
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : monthTx;
  const prevTx   = transactions.filter((t) => t.date.startsWith(prevKey));

  const totalIncome   = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense  = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const prevIncome  = prevTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const expenseDiff = diffLabel(totalExpense, prevExpense);
  const incomeDiff  = diffLabel(totalIncome, prevIncome);

  const { pieSlices, pieTotal } = useMemo(() => {
    const monthExp = monthTx.filter((t) => t.type === 'expense');
    const total = monthExp.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return { pieSlices: [], pieTotal: 0 };
    const byCategory: Record<string, number> = {};
    monthExp.forEach((t) => { byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount; });
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    let angle = 0;
    const slices = sorted.map(([cat, amt], i) => {
      const sweep = (amt / total) * 358;
      const slice = { category: cat, amount: amt, pct: amt / total, startDeg: angle, endDeg: angle + sweep, color: SLICE_COLORS[i % SLICE_COLORS.length] };
      angle += sweep + (358 / sorted.length) * 0.02;
      return slice;
    });
    return { pieSlices: slices, pieTotal: total };
  }, [monthTx]);

  async function handleExport() {
    const ok = await exportData();
    if (!ok) Alert.alert('Erro', 'Não foi possível exportar o backup.');
  }

  async function handleImport() {
    Alert.alert(
      'Importar backup',
      'Isso vai substituir todos os seus dados atuais. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Importar', style: 'destructive', onPress: async () => {
          const ok = await importData();
          if (ok) Alert.alert('Sucesso', 'Dados importados com sucesso!');
          else Alert.alert('Erro', 'Arquivo inválido ou importação cancelada.');
        }},
      ]
    );
  }

  function confirmDeleteTransaction(id: string) {
    Alert.alert(
      'Excluir lançamento',
      'Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => removeTransaction(id) },
      ]
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={filteredTx}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <DateHeader />

            {/* ── Busca ── */}
            <View style={s.searchRow}>
              <Ionicons name="search-outline" size={16} color={colors.placeholder} style={{ marginLeft: 12 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Buscar por categoria ou descrição…"
                placeholderTextColor={colors.placeholder}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={{ paddingRight: 12 }}>
                  <Ionicons name="close-circle" size={16} color={colors.subtext} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Balanço ── */}
            <View style={s.balanceCard}>
              <View style={s.row}>
                <View style={s.statBox}>
                  <View style={[s.statBar, { backgroundColor: colors.expense }]} />
                  <Text style={s.statLabel}>Despesas</Text>
                  <Text style={[s.statValue, { color: colors.expense }]}>-{formatCurrency(totalExpense)}</Text>
                  {prevExpense > 0 && (
                    <View style={s.diffRow}>
                      <Ionicons name={expenseDiff.icon} size={11} color={expenseDiff.color} />
                      <Text style={[s.diffText, { color: expenseDiff.color }]}>{expenseDiff.text} vs {prevLabel}</Text>
                    </View>
                  )}
                </View>
                <View style={s.separator} />
                <View style={s.statBox}>
                  <View style={[s.statBar, { backgroundColor: colors.income }]} />
                  <Text style={s.statLabel}>Renda</Text>
                  <Text style={[s.statValue, { color: colors.income }]}>+{formatCurrency(totalIncome)}</Text>
                  {prevIncome > 0 && (
                    <View style={s.diffRow}>
                      <Ionicons name={incomeDiff.icon} size={11} color={incomeDiff.color} />
                      <Text style={[s.diffText, { color: incomeDiff.color }]}>{incomeDiff.text} vs {prevLabel}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={s.divider} />
              <View style={s.balanceRow}>
                <Text style={s.balanceLabel}>Balanço</Text>
                <Text style={[s.balanceValue, { color: balance >= 0 ? colors.income : colors.expense }]}>
                  {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                </Text>
              </View>
            </View>

            {/* ── Comparativo mês anterior ── */}
            {(prevExpense > 0 || prevIncome > 0) && (
              <>
                <Text style={s.sectionTitle}>Comparativo — <Text style={{ color: colors.subtext, fontFamily: fonts.regular, textTransform: 'capitalize' }}>{prevLabel}</Text></Text>
                <View style={s.compareCard}>
                  <View style={s.compareRow}>
                    <Text style={s.compareLabel}>Despesas</Text>
                    <View style={s.compareBarBg}>
                      <View style={[s.compareBarFill, {
                        width: `${Math.min((prevExpense / Math.max(totalExpense, prevExpense)) * 100, 100)}%`,
                        backgroundColor: colors.expense + '66',
                      }]} />
                      <View style={[s.compareBarFill, {
                        position: 'absolute', top: 0, left: 0,
                        width: `${Math.min((totalExpense / Math.max(totalExpense, prevExpense)) * 100, 100)}%`,
                        backgroundColor: colors.expense,
                      }]} />
                    </View>
                    <Text style={[s.compareValue, { color: colors.expense }]}>{formatCurrency(prevExpense)}</Text>
                  </View>
                  <View style={[s.compareRow, { marginTop: 12 }]}>
                    <Text style={s.compareLabel}>Renda</Text>
                    <View style={s.compareBarBg}>
                      <View style={[s.compareBarFill, {
                        width: `${Math.min((prevIncome / Math.max(totalIncome, prevIncome)) * 100, 100)}%`,
                        backgroundColor: colors.income + '66',
                      }]} />
                      <View style={[s.compareBarFill, {
                        position: 'absolute', top: 0, left: 0,
                        width: `${Math.min((totalIncome / Math.max(totalIncome, prevIncome)) * 100, 100)}%`,
                        backgroundColor: colors.income,
                      }]} />
                    </View>
                    <Text style={[s.compareValue, { color: colors.income }]}>{formatCurrency(prevIncome)}</Text>
                  </View>
                  <View style={s.compareLegend}>
                    <View style={s.compareLegendItem}>
                      <View style={[s.compareDot, { backgroundColor: colors.expense }]} />
                      <Text style={s.compareLegendText} numberOfLines={1}>Este mês</Text>
                    </View>
                    <View style={s.compareLegendItem}>
                      <View style={[s.compareDot, { backgroundColor: colors.subtext + '66' }]} />
                      <Text style={[s.compareLegendText, { textTransform: 'capitalize' }]}>{prevLabel}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* ── Gráfico de pizza ── */}
            <Text style={s.sectionTitle}>Gastos por categoria</Text>
            <View style={s.card}>
              {pieSlices.length === 0 ? (
                <Text style={s.empty}>Nenhum gasto registrado este mês.</Text>
              ) : (
                <View style={s.pieRow}>
                  <Svg width={150} height={150} viewBox="0 0 200 200">
                    <G>
                      {pieSlices.map((sl) => (
                        <Path key={sl.category} d={donutSlice(100, 100, 88, 54, sl.startDeg, sl.endDeg)} fill={sl.color} opacity={0.92} />
                      ))}
                      <Path d="M 100 46 A 54 54 0 1 0 100.001 46 Z" fill={colors.card} />
                    </G>
                    <SvgText x="100" y="96" textAnchor="middle" fill={colors.subtext} fontSize="11" fontFamily={fonts.regular}>Total</SvgText>
                    <SvgText x="100" y="116" textAnchor="middle" fill={colors.text} fontSize="13" fontFamily={fonts.semibold}>{formatCurrency(pieTotal)}</SvgText>
                  </Svg>
                  <View style={s.legend}>
                    {pieSlices.map((sl) => (
                      <View key={sl.category} style={s.legendRow}>
                        <View style={[s.legendDot, { backgroundColor: sl.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.legendLabel} numberOfLines={1}>{sl.category}</Text>
                          <Text style={s.legendValue}>{formatCurrency(sl.amount)}</Text>
                        </View>
                        <Text style={s.legendPct}>{Math.round(sl.pct * 100)}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* ── Backup ── */}
            <Text style={s.sectionTitle}>Dados</Text>
            <View style={s.backupRow}>
              <TouchableOpacity style={s.backupBtn} onPress={handleExport}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                <Text style={s.backupBtnText}>Exportar backup</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.backupBtn} onPress={handleImport}>
                <Ionicons name="cloud-download-outline" size={18} color={colors.subtext} />
                <Text style={[s.backupBtnText, { color: colors.subtext }]}>Importar backup</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.sectionTitle}>Lançamentos — <Text style={{ color: colors.subtext, fontFamily: fonts.regular, textTransform: 'capitalize' }}>{monthLabel}</Text></Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={s.empty}>Nenhum lançamento em{'\n'}<Text style={{ textTransform: 'capitalize' }}>{monthLabel}</Text>.</Text>
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
            <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDeleteTransaction(item.id)}>
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

  balanceCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 20, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  statBox: { flex: 1, alignItems: 'flex-start', gap: 4 },
  statBar: { width: 28, height: 3, borderRadius: 2 },
  statLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular },
  statValue: { fontSize: 18, fontFamily: fonts.semibold, letterSpacing: -0.3 },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  diffText: { fontSize: 11, fontFamily: fonts.medium },
  separator: { width: 1, backgroundColor: colors.border, marginHorizontal: 20, alignSelf: 'stretch' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: colors.subtext, fontSize: 13, fontFamily: fonts.medium },
  balanceValue: { fontSize: 22, fontFamily: fonts.bold, letterSpacing: -0.5 },

  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },

  compareCard: { backgroundColor: colors.card, borderRadius: 8, padding: 16, marginBottom: 28 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compareLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.medium, width: 56 },
  compareBarBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'visible' },
  compareBarFill: { height: 8, borderRadius: 4 },
  compareValue: { fontSize: 12, fontFamily: fonts.semibold, width: 70, textAlign: 'right' },
  compareLegend: { flexDirection: 'row', gap: 16, marginTop: 14 },
  compareLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compareDot: { width: 8, height: 8, borderRadius: 4 },
  compareLegendText: { color: colors.subtext, fontSize: 11, fontFamily: fonts.regular },

  card: { backgroundColor: colors.card, borderRadius: 8, padding: 18, marginBottom: 28 },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 12 },
  legendValue: { color: colors.subtext, fontFamily: fonts.regular, fontSize: 11 },
  legendPct: { color: colors.subtext, fontFamily: fonts.medium, fontSize: 11, minWidth: 30, textAlign: 'right' },

  backupRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  backupBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: 8, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  backupBtnText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, marginBottom: 20,
  },
  searchInput: {
    flex: 1, padding: 12, color: colors.text, fontFamily: fonts.medium, fontSize: 14,
  },

  empty: { color: colors.subtext, fontFamily: fonts.regular, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 6,
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
