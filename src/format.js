export function formatCredits(n) {
  return Math.trunc(n).toLocaleString('pt-BR');
}

// Dinheiro de mentira com cara de cassino: "USD 1.000.000,00".
export function formatMoney(n) {
  return `USD ${formatAmount(n)}`;
}

// Só o valor, sem "USD": "1.000.000,00".
export function formatAmount(n) {
  return Math.trunc(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
