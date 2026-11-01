// Janelas da conta: entrar/criar, escolher qual progresso manter e a parte "Conta" dos Ajustes.
import { openModal } from './modals.js';
import { formatMoney } from '../format.js';
import { getRoundPhase } from '../round.js';
import {
  aoMudarSituacao, carregarConta, configurarNuvem, ligarNuvem, sairDaConta, situacaoAtual, usuarioAtual,
} from '../nuvem/sincronia.js';

const TEXTO_SITUACAO = {
  verificando: 'Conferindo a nuvem…',
  salvo: '☁️ Progresso salvo na nuvem.',
  enviando: '☁️ Salvando…',
  'sem-internet': '📴 Sem internet agora: salva sozinho quando a internet voltar.',
  'sem-conta': '',
};

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function field(type, placeholder, autocomplete, extra = {}) {
  const input = el('input', 'field');
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = autocomplete;
  Object.assign(input, extra);
  return input;
}

// Entrar ou criar conta. Quem faz o resto (trocar de gaveta, juntar com a nuvem) é a sincronia.
export function openLogin() {
  const form = el('form', 'login');
  form.noValidate = true;
  const intro = el('p', 'login__intro', 'Guarde o seu saldo e o seu progresso na nuvem e use em qualquer aparelho.');
  const email = field('email', 'E-mail', 'username', { inputMode: 'email', autocapitalize: 'off', spellcheck: false });
  const senha = field('password', 'Senha (pelo menos 6)', 'current-password');
  const msg = el('p', 'login__msg');
  msg.setAttribute('role', 'status');
  const entrar = el('button', 'login__main', 'Entrar');
  entrar.type = 'submit';
  const criar = el('button', 'login__alt', 'Criar conta');
  criar.type = 'button';
  const esqueci = el('button', 'login__link', 'Esqueci a senha');
  esqueci.type = 'button';
  const extras = el('div', 'login__extras');
  extras.append(criar, esqueci);
  form.append(intro, email, senha, msg, entrar, extras);

  const botoes = [entrar, criar, esqueci];
  const mostrar = (texto, ok = false) => {
    msg.textContent = texto;
    msg.classList.toggle('login__msg--ok', ok);
  };
  const mensagem = async (e) => {
    const c = await carregarConta().catch(() => null);
    return c ? c.mensagemDeErro(e) : 'Sem internet agora. Tente de novo quando a internet voltar.';
  };

  let close = () => {};
  const tentar = async (acao) => {
    mostrar('');
    botoes.forEach((b) => (b.disabled = true));
    try {
      await ligarNuvem(); // precisa estar ouvindo para tratar quem entrou
      const c = await carregarConta();
      if (acao === 'entrar') await c.entrar(email.value, senha.value);
      else await c.criarConta(email.value, senha.value);
      mostrar('Entrando…', true);
      close(); // a sincronia recarrega o jogo com a conta aberta
    } catch (e) {
      mostrar(await mensagem(e));
      botoes.forEach((b) => (b.disabled = false));
    }
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void tentar('entrar');
  });
  criar.addEventListener('click', () => void tentar('criar'));
  esqueci.addEventListener('click', async () => {
    mostrar('');
    try {
      await (await carregarConta()).esqueciSenha(email.value);
      mostrar('Pronto! Se existir uma conta com esse e-mail, chega lá uma mensagem para criar uma senha nova.', true);
    } catch (e) {
      mostrar(await mensagem(e));
    }
  });

  close = openModal({
    title: 'Sua conta',
    body: form,
    className: 'modal--login',
    actions: [{ label: 'Agora não' }],
  });
  email.focus();
  return close;
}

// Primeira entrada com progresso nos dois lugares: quem fica? (não dá para fechar sem escolher)
function escolher({ aparelho, conta }) {
  return new Promise((resolve) => {
    const body = el('div', 'choose');
    body.append(
      el('p', '', 'Você já jogou neste aparelho e a sua conta também já tem progresso. Qual você quer manter?'),
      el('p', 'choose__info', `Este aparelho: ${formatMoney(aparelho.credits)}`),
      el('p', 'choose__info', `Sua conta: ${formatMoney(conta.credits)}`),
    );
    openModal({
      title: 'Qual progresso manter?',
      body,
      className: 'modal--choose',
      actions: [
        { label: 'Manter o deste aparelho', primary: true, onClick: (close) => (close(), resolve('aparelho')) },
        { label: 'Manter o da conta', onClick: (close) => (close(), resolve('conta')) },
      ],
    });
  });
}

configurarNuvem({ escolher });

// Janela da conta (quando já está dentro): e-mail, situação da nuvem e "Sair da conta".
function openAccount() {
  const body = el('div', 'account');
  const email = el('p', 'account__email');
  const status = el('p', 'account__status');
  const sair = el('button', 'login__alt', 'Sair da conta');
  sair.type = 'button';
  const pintar = () => {
    email.textContent = usuarioAtual()?.email ?? '';
    status.textContent = TEXTO_SITUACAO[situacaoAtual()];
  };
  pintar();
  const off = aoMudarSituacao(pintar);
  sair.addEventListener('click', async () => {
    sair.disabled = true;
    await sairDaConta(); // a sincronia recarrega o jogo sem conta
  });
  body.append(email, status, sair);
  openModal({ title: 'Sua conta', body, className: 'modal--login', onClose: off, actions: [{ label: 'Fechar' }] });
}

// Uma linha só nos Ajustes (eles já são altos): abre a janela de entrar ou a da conta.
// `refazer` repinta os Ajustes quando a situação da nuvem muda.
export function contaSection(refazer) {
  const u = usuarioAtual();
  const b = el('button', 'opt__account', u ? `👤 ${u.email}` : '👤 Entrar ou criar conta');
  b.type = 'button';
  b.addEventListener('click', () => {
    if (getRoundPhase() !== 'idle') return; // nada de trocar de conta no meio da rodada
    if (u) openAccount();
    else openLogin();
  });
  b.disabled = getRoundPhase() !== 'idle';
  if (b.disabled) b.title = 'Termine a rodada para mexer na conta.';
  return b;
}

export const observarSituacao = aoMudarSituacao;
