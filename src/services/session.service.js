import firebase, { db } from '../config/firebase.js';

export async function buscarSessaoPorDono(uid) {
  const snap = await db.collection('sessoes').where('ownerUid', '==', uid).get();
  return snap.empty ? null : snap.docs[0].id;
}

export async function sessaoExiste(cod) {
  const doc = await db.collection('sessoes').doc(cod).get();
  return doc.exists;
}

export async function criarSessao(cod, uid, pin) {
  await db.collection('sessoes').doc(cod).set({
    criadaEm: Date.now(),
    status: 'ATIVA',
    ownerUid: uid,
    members: [uid],
  });
  await db.collection('sessoes').doc(cod).collection('dados').doc('usuarios').set({
    lista: [{ id: 'ADMIN', pin, perfil: 'admin', patente: 4, agentesVinc: [] }],
  });
}

export async function deletarSessao(cod) {
  await db.collection('sessoes').doc(cod).delete();
}

export async function listarTodasSessoes() {
  const snap = await db.collection('sessoes').get();
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}

export async function adicionarMembro(cod, uid) {
  await db.collection('sessoes').doc(cod).update({
    members: firebase.firestore.FieldValue.arrayUnion(uid),
  });
}

export async function tocarSessao(cod, uid) {
  await db.collection('sessoes').doc(cod).set({
    ultimaAlteracao: Date.now(),
    ownerUid: uid,
  }, { merge: true });
}