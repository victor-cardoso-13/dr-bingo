// Conta e nuvem (Firebase). Só é carregado (import dinâmico) quando alguém já está dentro ou
// toca em "Entrar": quem joga sem conta nunca faz nenhuma chamada de rede.
// O jogo não tem build, então o SDK vem direto do gstatic, sempre nesta versão exata
// (a mesma do miaudoku). Firestore "lite": só precisamos de ler e gravar um documento.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { doc, getDoc, getFirestore, setDoc } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore-lite.js';
import { firebaseConfig } from './config.js';

const JOGO = 'dr-bingo';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'pt'; // e-mail de "esqueci a senha" em português
const banco = getFirestore(app);

// Avisa quando alguém entra ou sai (e logo ao abrir, com quem já estava dentro).
export function observarConta(fn) {
  return onAuthStateChanged(auth, (u) => fn(u ? { uid: u.uid, email: u.email ?? '' } : null));
}

export async function entrar(email, senha) {
  await signInWithEmailAndPassword(auth, email.trim(), senha);
}

export async function criarConta(email, senha) {
  await createUserWithEmailAndPassword(auth, email.trim(), senha);
}

export async function sair() {
  await signOut(auth);
}

export async function esqueciSenha(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

const lugar = (uid) => doc(banco, 'jogadores', uid, 'jogos', JOGO);

export async function baixar(uid) {
  const d = await getDoc(lugar(uid));
  return d.exists() ? d.data() : null;
}

export async function enviar(uid, dados) {
  await setDoc(lugar(uid), dados);
}

// Mensagens do Firebase em português simples.
export function mensagemDeErro(e) {
  const codigo = e?.code ?? '';
  const mensagens = {
    'auth/invalid-email': 'Esse e-mail não parece certo. Confira se digitou direitinho.',
    'auth/missing-email': 'Digite o seu e-mail.',
    'auth/missing-password': 'Digite a senha.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 letras ou números.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Toque em "Entrar".',
    // Por segurança, o Firebase não diz se o erro foi no e-mail ou na senha.
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem internet agora. Tente de novo quando a internet voltar.',
  };
  return mensagens[codigo] ?? 'Algo deu errado. Tente de novo daqui a pouco.';
}
