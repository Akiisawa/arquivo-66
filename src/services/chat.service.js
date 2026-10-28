import firebase from '../config/firebase.js';
import { state } from '../core/state.js';

export function ouvirChats(callback) {
  if (state.chatUnsubscribe) state.chatUnsubscribe();
  state.chatUnsubscribe = state.refSessao.doc('chats').onSnapshot((doc) => {
    if (doc.exists) {
      state.chatsLocais = doc.data();
    } else {
      state.chatsLocais = {};
      state.refSessao.doc('chats').set({});
    }
    callback();
  });
}

export async function enviarMensagem(canal, autor, texto) {
  const payload = { autor: autor, texto: texto, tempo: Date.now() };
  await state.refSessao.doc('chats').set({
    [canal]: firebase.firestore.FieldValue.arrayUnion(payload),
  }, { merge: true });
}