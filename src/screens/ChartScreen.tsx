import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { colors, fonts } from '../theme';
import DateHeader from '../components/DateHeader';

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

export default function ChartScreen() {
  const { transactions, removeTransaction } = useFinance();

  const monthKey = currentMonthKey();

  const totalIncome  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const { pieSlices, pieTotal } = useMemo(() => {
    const monthExp = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(monthKey));
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
  }, [transactions, monthKey]);

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
              <View style={s.row}>
                <View style={s.statBox}>
                  <View style={[s.statBar, { backgroundColor: colors.expense }]} />
                  <Text style={s.statLabel}>Despesas</Text>
                  <Text style={[s.statValue, { color: colors.expense }]}>-{formatCurrency(totalExpense)}</Text>
                </View>
                <View style={s.separator} />
                <View style={s.statBox}>
                  <View style={[s.statBar, { backgroundColor: colors.income }]} />
                  <Text style={s.statLabel}>Renda</Text>
                  <Text style={[s.statValue, { color: colors.income }]}>+{formatCurrency(totalIncome)}</Text>
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

            {/* ── Gráfico de pizza ── */}
            <Text style={s.sectionTitle}>Gastos do mês por categoria</Text>
            <View style={s.card}>
              {pieSlices.length === 0 ? (
                <Text style={s.empty}>Nenhum gasto registrado este mês.</Text>
              ) : (
                <View style={s.pieRow}>
                  <Svg width={150} height={150} viewBox="0 0 200 200">
                    <G>
                      {pieSlices.map((sl) => (
                        <Path
                          key={sl.category}
                          d={donutSlice(100, 100, 88, 54, sl.startDeg, sl.endDeg)}
                          fill={sl.color}
                          opacity={0.92}
                        />
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

  balanceCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  statBox: { flex: 1, alignItems: 'flex-start', gap: 6 },
  statBar: { width: 28, height: 3, borderRadius: 2 },
  statLabel: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular },
  statValue: { fontSize: 18, fontFamily: fonts.semibold, letterSpacing: -0.3 },
  separator: { width: 1, backgroundColor: colors.border, marginHorizontal: 20, alignSelf: 'stretch' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: colors.subtext, fontSize: 13, fontFamily: fonts.medium },
  balanceValue: { fontSize: 22, fontFamily: fonts.bold, letterSpacing: -0.5 },

  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 28 },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 12 },
  legendValue: { color: colors.subtext, fontFamily: fonts.regular, fontSize: 11 },
  legendPct: { color: colors.subtext, fontFamily: fonts.medium, fontSize: 11, minWidth: 30, textAlign: 'right' },

  empty: { color: colors.subtext, fontFamily: fonts.regular, textAlign: 'center', marginTop: 10, lineHeight: 22 },
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
