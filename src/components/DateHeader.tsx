import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '../context/FinanceContext';
import { colors, fonts } from '../theme';

export default function DateHeader() {
  const { selectedDate, setSelectedDate } = useFinance();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View>
      <TouchableOpacity style={s.row} onPress={() => setShowPicker((v) => !v)}>
        <Text style={s.dateText}>
          {selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
          })}
        </Text>
        <Text style={s.chevron}>›</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          locale="pt-BR"
          maximumDate={new Date()}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (date) setSelectedDate(date);
          }}
          style={{ marginBottom: 8 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    color: colors.text, fontFamily: fonts.semibold, fontSize: 16, textTransform: 'capitalize',
  },
  chevron: { color: colors.primary, fontSize: 22 },
});
