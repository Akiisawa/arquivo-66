import { state } from '../core/state.js';
import { BANCOS_KEYS } from '../config/constants.js';
import { mostrarSysToast } from '../utils/toast.js';

const MAP_STATE = {
  usuarios: 'bancoUsuarios',
  agentes: 'bancoAgentes',
  missoes: 'incidentesGoiadas',
  arquivos: 'bancoArquivos',
  relatorios: 'bancoRelatorios',
  entidades: 'bancoEntidades',
  inventario: 'bancoInventario',
};

export async function carregarDadosDaNuvem() {
  for (const key of BANCOS_KEYS) {
    try {
      const doc = await state.refSessao.doc(key).get();
      if (doc.exists && doc.data().lista) {
        state[MAP_STATE[key]] = doc.data().lista;
      }
    } catch (e) {
      console.error('[db] Erro ao carregar ' + key, e);
    }
  }

  state.bancoUsuarios.forEach((u) => {
    if (u.agenteVinc && !Array.isArray(u.agentesVinc)) {
      u.agentesVinc = [u.agenteVinc];
      delete u.agenteVinc;
    }
    if (!u.agentesVinc) u.agentesVinc = [];
  });
  state.bancoAgentes.forEach((ag) => { if (ag.aprovado === undefined) ag.aprovado = true; });
}

export async function salvarBancos() {
  try {
    for (const key of BANCOS_KEYS) {
      await state.refSessao.doc(key).set({ lista: state[MAP_STATE[key]] });
    }
  } catch (e) {
    console.error('[db] Erro ao salvar', e);
    mostrarSysToast('ERRO: BANCO CHEIO OU PERMISSAO NEGADA.', true);
  }
}