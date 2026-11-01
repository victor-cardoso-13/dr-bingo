// Mantém o progresso do aparelho e o da nuvem iguais (saldo, aposta, cartelas, estatísticas).
// - Ao abrir (já dentro de uma conta): baixa, vê quem mudou por último e aplica ou envia.
// - A cada mudança: espera 2 s sem novidades e envia (para não gastar o limite grátis a cada bola).
// - Sem internet: o jogo segue normal e envia quando a internet voltar.
// - Nada é trocado no meio de uma rodada: espera ela terminar.
// O Firebase só é carregado aqui dentro, e só se há conta (ou se a pessoa tocou em "Entrar").
import { anonymousProgress, applyShared, currentAccount, getState, sharedOf, subscribe, switchAccount } from '../state.js';
import { getRoundPhase, subscribeRound } from '../round.js';
import { daNuvem, paraNuvem, quemVale } from './mesclar.js';

// situacao: 'sem-conta' | 'verificando' | 'salvo' | 'enviando' | 'sem-internet'
let conta = null;
let ligando = null;
let usuario = null;
let situacao = currentAccount() ? 'verificando' : 'sem-conta';
let pronto = false; // já baixou da nuvem ao menos uma vez (antes disso nada é enviado)
let ultimoEnviado = 0;
let espera = null;
let ui = { escolher: async () => 'aparelho' };
const ouvintes = new Set();

export const usuarioAtual = () => usuario;
export const situacaoAtual = () => situacao;
export const aoMudarSituacao = (fn) => (ouvintes.add(fn), () => ouvintes.delete(fn));
// escolher({ aparelho, conta }) → 'aparelho' | 'conta' (primeira entrada com progresso nos dois lugares)
export const configurarNuvem = (opcoes) => (ui = { ...ui, ...opcoes });

function mudar(s) {
  situacao = s;
  for (const fn of [...ouvintes]) fn(s);
}

function quandoOcioso(fn) {
  if (getRoundPhase() === 'idle') return fn();
  const off = subscribeRound(() => {
    if (getRoundPhase() !== 'idle') return;
    off();
    fn();
  });
}

export async function carregarConta() {
  return (conta ??= await import('./conta.js'));
}

// Liga a nuvem (uma vez só). Seguro de chamar de novo, por exemplo quando a internet volta.
export function ligarNuvem() {
  if (ligando) return ligando;
  ligando = (async () => {
    try {
      const c = await carregarConta();
      c.observarConta((u) => void aoMudarConta(u));
    } catch {
      ligando = null; // não deu para carregar o Firebase (sem internet): tenta de novo depois
      mudar('sem-internet');
    }
  })();
  return ligando;
}

// Ao abrir o jogo: só mexe na rede se este aparelho já tem alguém dentro.
export function iniciarNuvem() {
  subscribe((s) => {
    if (usuario && pronto && s.sharedAt > ultimoEnviado) agendarEnvio();
  });
  addEventListener('online', () => {
    if (!currentAccount()) return;
    if (!conta) void ligarNuvem();
    else void sincronizar();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void enviarAgora();
  });
  if (currentAccount()) void ligarNuvem();
}

async function aoMudarConta(u) {
  usuario = u;
  const uid = u?.uid ?? null;
  if (uid === currentAccount()) {
    if (uid) await sincronizar();
    else mudar('sem-conta');
    return;
  }
  pronto = false;
  if (!uid) {
    // saiu da conta (ou ela deixou de valer): volta para a gaveta "sem conta"
    quandoOcioso(() => {
      switchAccount(null);
      location.reload();
    });
    return;
  }
  await abrirConta(u);
}

// Acabou de entrar numa conta: decide com que progresso ela começa neste aparelho e recarrega.
async function abrirConta(u) {
  const aparelho = anonymousProgress();
  let remoto = null;
  try {
    remoto = daNuvem(await conta.baixar(u.uid));
  } catch {
    // sem internet agora: começa com o do aparelho e a sincronia confere na próxima abertura
  }
  let escolha = remoto ? 'conta' : 'aparelho';
  if (aparelho && remoto) escolha = await ui.escolher({ aparelho, conta: remoto });
  const seed = escolha === 'aparelho' ? aparelho && { ...aparelho, updatedAt: Date.now() } : remoto;
  quandoOcioso(() => {
    switchAccount(u.uid, { seed, clearAnonymous: escolha === 'aparelho' && !!aparelho });
    location.reload();
  });
}

function agendarEnvio() {
  if (espera) clearTimeout(espera);
  espera = setTimeout(() => void enviarAgora(), 2000);
}

export async function enviarAgora() {
  if (espera) clearTimeout(espera);
  espera = null;
  const s = getState();
  const u = usuario;
  if (!u || !conta || !pronto || s.sharedAt <= ultimoEnviado) return;
  mudar('enviando');
  try {
    await conta.enviar(u.uid, paraNuvem(sharedOf(s), s.sharedAt));
    ultimoEnviado = Math.max(ultimoEnviado, s.sharedAt);
    if (usuario?.uid === u.uid) mudar(getState().sharedAt > ultimoEnviado ? 'enviando' : 'salvo');
    if (getState().sharedAt > ultimoEnviado) agendarEnvio();
  } catch {
    mudar('sem-internet');
  }
}

// Baixa da nuvem e vê quem mudou por último.
export async function sincronizar() {
  const u = usuario;
  if (!u || !conta) return;
  mudar('verificando');
  let remoto;
  try {
    remoto = daNuvem(await conta.baixar(u.uid));
  } catch {
    mudar('sem-internet');
    return;
  }
  if (usuario?.uid !== u.uid) return;
  quandoOcioso(async () => {
    const local = getState();
    const quem = quemVale(local.sharedAt, remoto);
    if (quem === 'nuvem') {
      applyShared(remoto);
      ultimoEnviado = remoto.updatedAt;
    }
    pronto = true;
    if (quem === 'aparelho') ultimoEnviado = remoto?.updatedAt ?? 0;
    else if (quem === 'igual') ultimoEnviado = local.sharedAt;
    mudar('salvo');
    if (getState().sharedAt > ultimoEnviado) await enviarAgora();
  });
}

export async function sairDaConta() {
  await enviarAgora();
  await (await carregarConta()).sair();
}
