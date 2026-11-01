// Converte o progresso para o formato da nuvem (e de volta) e decide quem vale quando o
// aparelho e a nuvem têm cópias diferentes. Não usa o Firebase nem a tela: dá para testar sem internet.
import { BET_STEPS, MAX_CARDS } from '../state.js';

// Documento inteiro, "quem mudou por último vale": saldo e estatísticas sobem e descem
// (gastar, ganhar, zerar), então juntar campo a campo daria um saldo que nunca existiu.
export function paraNuvem(shared, updatedAt) {
  return {
    versao: 1,
    credits: shared.credits,
    bet: shared.bet,
    cardCount: shared.cardCount,
    stats: { rounds: shared.stats.rounds, biggestWin: shared.stats.biggestWin },
    updatedAt,
  };
}

const naturalOuZero = (v) => (Number.isFinite(v) && v >= 0 ? v : null);

// Documento da nuvem → progresso, ou null se estiver estragado (nunca confia no que vem de fora).
export function daNuvem(doc) {
  if (!doc || typeof doc !== 'object') return null;
  const credits = naturalOuZero(doc.credits);
  const rounds = naturalOuZero(doc.stats?.rounds);
  const biggestWin = naturalOuZero(doc.stats?.biggestWin);
  const updatedAt = naturalOuZero(doc.updatedAt);
  if (credits === null || rounds === null || biggestWin === null || updatedAt === null) return null;
  if (!BET_STEPS.includes(doc.bet)) return null;
  if (!Number.isInteger(doc.cardCount) || doc.cardCount < 1 || doc.cardCount > MAX_CARDS) return null;
  return { credits, bet: doc.bet, cardCount: doc.cardCount, stats: { rounds, biggestWin }, updatedAt };
}

// 'nuvem' = baixar e aplicar · 'aparelho' = enviar · 'igual' = nada a fazer.
// remoto = progresso da nuvem (já validado) ou null se ainda não existe.
export function quemVale(localAt, remoto) {
  const remotoAt = remoto ? remoto.updatedAt : 0;
  if (remotoAt > localAt) return 'nuvem';
  if (localAt > remotoAt) return 'aparelho';
  return 'igual';
}
