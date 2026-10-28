import { state } from '../../core/state.js';
import { salvarBancos } from '../../services/database.service.js';
import { mostrarSysToast } from '../../utils/toast.js';
import { somSucesso } from '../../core/audio.js';

// ----------------------------------------------------------
// TODO: Portar do public/legacy-app.js para cá:
// renderArquivos, abrirFormularioArquivo, salvarNovoArquivo, abrirArquivo, salvarEdicaoArquivo, alterarStatusDoc, apagarArquivo
//
// Regras:
//   - Não use 'bancoXxx' global — use state.bancoXxx
//   - Não chame firebase direto — use os services/
//   - Salve via salvarBancos() (já importado)
// ----------------------------------------------------------

export function initFilesModule() {
  // Object.assign(window, { renderXXX, abrirXXX, ... });
}
