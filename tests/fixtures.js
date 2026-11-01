// Exemplos da seção 6 do DESIGN.
export const CARD_A = [1, 13, 25, 37, 49, 2, 14, 26, 38, 50, 3, 15, 27, 39, 51];
export const CARD_B = [4, 16, 28, 40, 52, 5, 17, 29, 41, 53, 6, 18, 30, 42, 54];
// As 30 bolas sorteadas do exemplo (A menos o 51, cantos de B menos o 54, e 13 de enchimento).
export const BASE_DRAWN = [
  ...CARD_A.filter((n) => n !== 51), 4, 52, 6,
  7, 8, 9, 10, 11, 12, 19, 20, 21, 22, 23, 24, 31,
];
