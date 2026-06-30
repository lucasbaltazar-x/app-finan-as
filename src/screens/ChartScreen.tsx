import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, InputAccessoryView, Keyboard, Dimensions,
} from 'react-native';
import Svg, { Path, Polyline, Circle, G, Text as SvgText } from 'react-native-svg';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, currentMonthKey } from '../utils/format';
import { TransactionType } from '../types';
import { colors, fonts } from '../theme';

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

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
  const { transactions, addTransaction, removeTransaction } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const monthKey = currentMonthKey();

  // --- Pie chart: despesas por categoria no mês atual ---
  const { pieSlices, pieTotal } = useMemo(() => {
    const monthExp = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(monthKey),
    );
    const total = monthExp.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return { pieSlices: [], pieTotal: 0 };

    const byCategory: Record<string, number> = {};
    monthExp.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    });

    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    let angle = 0;
    const slices = sorted.map(([cat, amt], i) => {
      const sweep = (amt / total) * 358; // 358 deixa 2° de gap visual
      const slice = {
        category: cat,
        amount: amt,
        pct: amt / total,
        startDeg: angle,
        endDeg: angle + sweep,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
      };
      angle += sweep + (358 / sorted.length) * 0.02; // pequeno gap
      return slice;
    });
    return { pieSlices: slices, pieTotal: total };
  }, [transactions, monthKey]);

  // --- Bar chart: evolução mensal (últimos 6 meses) ---
  const monthlyData = useMemo(() => {
    const arr: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(key))
        .reduce((s, t) => s + t.amount, 0);
      arr.push({ key, label: MONTHS_SHORT[d.getMonth()], total });
    }
    return arr;
  }, [transactions]);

  const screenW = Dimensions.get('window').width;
  // padding scroll: 20 cada lado + card padding: 18 cada lado
  const BAR_CHART_W = screenW - 76;
  const BAR_CHART_H = 140;
  const BAR_AREA_H = 100;
  const N = monthlyData.length;
  const slotW = BAR_CHART_W / N;
  const barW = slotW * 0.42;
  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);

  function barHeight(total: number) {
    return total > 0 ? Math.max((total / maxMonthly) * BAR_AREA_H, 6) : 0;
  }

  // pontos para a linha
  const linePoints = monthlyData
    .map((m, i) => {
      const x = slotW * i + slotW / 2;
      const y = BAR_AREA_H - barHeight(m.total);
      return `${x},${y}`;
    })
    .join(' ');

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

  const recent = transactions.slice(0, 30);

  return (
    <View style={s.container}>
      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            {/* ── Gráfico de pizza ── */}
            <Text style={s.sectionTitle}>Gastos do mês</Text>
            <View style={s.card}>
              {pieSlices.length === 0 ? (
                <Text style={s.empty}>Nenhum gasto registrado este mês.</Text>
              ) : (
                <>
                  <View style={s.pieRow}>
                    <Svg width={160} height={160} viewBox="0 0 200 200">
                      <G>
                        {pieSlices.map((sl) => (
                          <Path
                            key={sl.category}
                            d={donutSlice(100, 100, 88, 54, sl.startDeg, sl.endDeg)}
                            fill={sl.color}
                            opacity={0.92}
                          />
                        ))}
                        {/* centro */}
                        <Path
                          d={`M 100 46 A 54 54 0 1 0 100.001 46 Z`}
                          fill={colors.card}
                        />
                      </G>
                      <SvgText
                        x="100" y="96"
                        textAnchor="middle"
                        fill={colors.subtext}
                        fontSize="11"
                        fontFamily={fonts.regular}
                      >
                        Total
                      </SvgText>
                      <SvgText
                        x="100" y="116"
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="13"
                        fontFamily={fonts.semibold}
                      >
                        {formatCurrency(pieTotal)}
                      </SvgText>
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
                </>
              )}
            </View>

            {/* ── Gráfico de barras mensal ── */}
            <Text style={s.sectionTitle}>Evolução mensal</Text>
            <View style={s.card}>
              <Svg width={BAR_CHART_W} height={BAR_CHART_H}>
                {/* linhas de grade horizontais */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = BAR_AREA_H - frac * BAR_AREA_H;
                  return (
                    <Path
                      key={frac}
                      d={`M 0 ${y} L ${BAR_CHART_W} ${y}`}
                      stroke={colors.border}
                      strokeWidth={0.8}
                      opacity={0.6}
                    />
                  );
                })}

                {/* barras semi-transparentes */}
                {monthlyData.map((m, i) => {
                  const bh = barHeight(m.total);
                  const x = slotW * i + (slotW - barW) / 2;
                  const y = BAR_AREA_H - bh;
                  return (
                    <Path
                      key={m.key}
                      d={`M ${x + 4} ${y} Q ${x} ${y} ${x} ${y + 4} L ${x} ${BAR_AREA_H} L ${x + barW} ${BAR_AREA_H} L ${x + barW} ${y + 4} Q ${x + barW} ${y} ${x + barW - 4} ${y} Z`}
                      fill={colors.primary}
                      opacity={bh > 0 ? 0.28 : 0}
                    />
                  );
                })}

                {/* linha conectando os topos */}
                {monthlyData.some((m) => m.total > 0) && (
                  <Polyline
                    points={linePoints}
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {/* pontos nos topos */}
                {monthlyData.map((m, i) => {
                  const x = slotW * i + slotW / 2;
                  const y = BAR_AREA_H - barHeight(m.total);
                  return m.total > 0 ? (
                    <Circle
                      key={m.key}
                      cx={x} cy={y}
                      r={3.5}
                      fill={colors.primary}
                    />
                  ) : null;
                })}

                {/* labels dos meses */}
                {monthlyData.map((m, i) => (
                  <SvgText
                    key={m.key + '_lbl'}
                    x={slotW * i + slotW / 2}
                    y={BAR_CHART_H - 4}
                    textAnchor="middle"
                    fill={colors.subtext}
                    fontSize="10"
                    fontFamily={fonts.regular}
                  >
                    {m.label}
                  </SvgText>
                ))}
              </Svg>
            </View>

            <Text style={s.sectionTitle}>Últimas transações</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={s.empty}>
            Nenhuma transação ainda.{'\n'}Use os atalhos na tela Início ou o botão + abaixo.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={[s.itemDot, { backgroundColor: item.type === 'income' ? colors.income : colors.expense }]} />
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

      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Nova transação</Text>
              <View style={s.typeRow}>
                <TouchableOpacity
                  style={[s.typeBtn, type === 'expense' && s.typeBtnExpense]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[s.typeText, type === 'expense' && { color: colors.expense, fontFamily: fonts.semibold }]}>
                    Despesa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.typeBtn, type === 'income' && s.typeBtnIncome]}
                  onPress={() => setType('income')}
                >
                  <Text style={[s.typeText, type === 'income' && { color: colors.income, fontFamily: fonts.semibold }]}>
                    Receita
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={s.input}
                placeholder="Valor (ex: 150.00)"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                inputAccessoryViewID="newTxAccessory"
                returnKeyType="done"
              />
              <TextInput
                style={s.input}
                placeholder="Categoria (ex: Alimentação)"
                placeholderTextColor={colors.placeholder}
                value={category}
                onChangeText={setCategory}
                inputAccessoryViewID="newTxAccessory"
                returnKeyType="done"
              />
              <TextInput
                style={s.input}
                placeholder="Descrição (opcional)"
                placeholderTextColor={colors.placeholder}
                value={description}
                onChangeText={setDescription}
                inputAccessoryViewID="newTxAccessory"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
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
  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 14 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 28 },

  // pie
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 12 },
  legendValue: { color: colors.subtext, fontFamily: fonts.regular, fontSize: 11 },
  legendPct: { color: colors.subtext, fontFamily: fonts.medium, fontSize: 11, minWidth: 30, textAlign: 'right' },

  // list
  empty: { color: colors.subtext, fontFamily: fonts.regular, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10, gap: 12 },
  deleteBtn: { padding: 6, marginLeft: 4 },
  deleteBtnText: { color: colors.subtext, fontSize: 20, lineHeight: 22 },
  itemDot: { width: 3, height: 36, borderRadius: 2 },
  itemCategory: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  itemDesc: { color: colors.subtext, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  itemDate: { color: colors.placeholder, fontSize: 11, fontFamily: fonts.regular, marginTop: 4 },
  itemAmount: { fontFamily: fonts.semibold, fontSize: 14 },

  // fab
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 28, fontFamily: fonts.regular },

  // modal
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
