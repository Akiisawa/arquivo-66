import { auth } from '../config/firebase.js';

export const logarEmail = (email, senha) => auth.signInWithEmailAndPassword(email, senha);
export const registrarEmail = (email, senha) => auth.createUserWithEmailAndPassword(email, senha);
export const recuperarSenha = (email) => auth.sendPasswordResetEmail(email);
export const deslogarFirebaseAuth = () => auth.signOut();
export const onAuthStateChanged = (cb) => auth.onAuthStateChanged(cb);
export const getCurrentUser = () => auth.currentUser;