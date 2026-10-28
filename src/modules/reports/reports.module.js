import { state } from '../../core/state.js';
import { salvarBancos } from '../../services/database.service.js';
import { mostrarSysToast } from '../../utils/toast.js';
import { somSucesso } from '../../core/audio.js';

// ----------------------------------------------------------
// TODO: Portar do public/legacy-app.js para cá:
// renderRelatorios, abrirFormularioRelatorio, salvarRelatorio, editarRelatorio, salvarEdicaoRelatorio, apagarRelatorio
//
// Regras:
//   - Não use 'bancoXxx' global — use state.bancoXxx
//   - Não chame firebase direto — use os services/
//   - Salve via salvarBancos() (já importado)
// ----------------------------------------------------------

export function initReportsModule() {
  // Object.assign(window, { renderXXX, abrirXXX, ... });
}
