# ARQUIVO 66 — Modular

## Como rodar

```bash
npm install
npm run dev
```

## Estrutura

```
index.html                  ← carrega legacy-app.js (classic) + main.js (module)
public/legacy-app.js        ← seu script.js original (intocado)
src/main.js                 ← entrada modular
src/config/                 ← firebase (window), constantes
src/core/                   ← state, audio, router
src/utils/                  ← dom, toast, permissions, dice, media
src/services/               ← auth, session, database, chat (Firestore)
src/modules/                ← features (auth, session, map, chat + stubs)
src/styles/                 ← variables.css + main.css (split do original)
```

## Como migrar (ordem sugerida)

1. **Agentes** — `src/modules/agents/agents.module.js` (maior)
2. **Inventário** — `src/modules/inventory/inventory.module.js`
3. **Entidades** — `src/modules/entities/entities.module.js`
4. **Arquivos** — `src/modules/files/files.module.js`
5. **Relatórios** — `src/modules/reports/reports.module.js`
6. **Usuários** — `src/modules/users/users.module.js`

Para cada um:

1. Abra o stub e copie a(s) função(ões) do `public/legacy-app.js`
2. Troque `bancoXxx` global → `state.bancoXxx`
3. Troque `db.collection(...)` → chamar função do `services/`
4. Exponha no `initXxxModule()` via `Object.assign(window, { ... })`
5. Descomente o `import` no `src/main.js`
6. Delete a função do `legacy-app.js` **só quando confirmar que a nova versão funciona**

## Notas

- **Firebase**: ainda via CDN (`<head>`). `config/firebase.js` só reexporta `window.firebase`.
- **Legacy**: roda primeiro (classic script). Modular roda depois (module).
- Funções novas expostas via `window` no `initXxxModule()` para compatibilidade com `onclick=""` do HTML.