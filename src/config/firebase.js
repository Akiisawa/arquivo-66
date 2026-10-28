// Firebase vem do CDN em index.html (compat v10)
// Este módulo NÃO inicializa um segundo app — apenas reexporta.
if (!window.firebase) {
  throw new Error('[ARQUIVO 66] Firebase CDN não carregado. Verifique o <head> do index.html.');
}

const firebase = window.firebase;
export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;