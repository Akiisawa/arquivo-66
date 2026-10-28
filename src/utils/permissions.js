import { PATENTES } from '../config/constants.js';

export const getNomePatente = (nivel) => PATENTES[nivel] || 'NOVATO';

export const getReqLvlDoc = (acesso) =>
  acesso === 'SEGREDO' ? 3 : acesso === 'RESTRITO' ? 2 : 1;

export const getReqLvlItem = (visibilidade) => ({
  FUNDADOR: 4,
  'AGENTE ESPECIAL': 3,
  AGENTE: 2,
}[visibilidade] || 1);

export function temAcesso(usuario, reqLvl) {
  return usuario.perfil === 'admin' || usuario.patente >= reqLvl;
}