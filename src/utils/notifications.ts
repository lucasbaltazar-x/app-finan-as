import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function checkBudgetAndNotify(
  category: string,
  spent: number,
  limit: number
) {
  const pct = spent / limit;

  if (pct >= 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Orçamento estourado!',
        body: `Você ultrapassou o limite de ${category}. Gasto: ${formatBRL(spent)} / Limite: ${formatBRL(limit)}`,
        sound: true,
      },
      trigger: null,
    });
  } else if (pct >= 0.8) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Atenção ao orçamento',
        body: `Você usou ${Math.round(pct * 100)}% do orçamento de ${category}. Limite: ${formatBRL(limit)}`,
        sound: true,
      },
      trigger: null,
    });
  }
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
