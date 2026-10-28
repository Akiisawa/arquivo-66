import { STORAGE_SESSION_KEY } from '../config/constants.js';

export const state = {
  sessaoAtual: '',
  refSessao: null,
  isMuted: false,
  usuarioLogado: false,
  usuarioAtual: { perfil: '', id: '', patente: 1, agentesVinc: [] },
  chatAtivo: 'global',
  chatUnsubscribe: null,
  chatsLocais: {},

  bancoUsuarios: [],
  bancoAgentes: [],
  bancoArquivos: [],
  bancoRelatorios: [],
  bancoEntidades: [],
  bancoInventario: [],
  incidentesGoiadas: [],
};

export function salvarSessaoLocal(cod) {
  state.sessaoAtual = cod;
  localStorage.setItem(STORAGE_SESSION_KEY, cod);
}

export function limparSessaoLocal() {
  state.sessaoAtual = '';
  localStorage.removeItem(STORAGE_SESSION_KEY);
}