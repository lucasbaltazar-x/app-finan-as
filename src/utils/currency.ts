// Transforma dígitos digitados em valor formatado R$ X.XXX,XX
// Ex: "15000" → "150,00" | "1500000" → "15.000,00"
export function maskCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return (num / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Converte valor mascarado de volta para número
export function parseMasked(masked: string): number {
  const clean = masked.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}
