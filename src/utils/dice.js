export const configPericias = {
  Atletismo: { attr: 'FOR', penalty: false }, Luta: { attr: 'FOR', penalty: false },
  Acrobacia: { attr: 'AGI', penalty: false }, Furtividade: { attr: 'AGI', penalty: false },
  Iniciativa: { attr: 'AGI', penalty: false }, Pilotagem: { attr: 'AGI', penalty: true },
  Pontaria: { attr: 'AGI', penalty: false }, Reflexos: { attr: 'AGI', penalty: false },
  Crime: { attr: 'AGI', penalty: false }, Atualidades: { attr: 'INT', penalty: false },
  Ciencias: { attr: 'INT', penalty: true }, Investigacao: { attr: 'INT', penalty: false },
  Medicina: { attr: 'INT', penalty: true }, Ocultismo: { attr: 'INT', penalty: true },
  Profissao: { attr: 'INT', penalty: true }, Tecnologia: { attr: 'INT', penalty: true },
  Sobrevivencia: { attr: 'INT', penalty: false }, Tatica: { attr: 'INT', penalty: true },
  Adestramento: { attr: 'PRE', penalty: true }, Artes: { attr: 'PRE', penalty: true },
  Diplomacia: { attr: 'PRE', penalty: false }, Enganacao: { attr: 'PRE', penalty: false },
  Intimidacao: { attr: 'PRE', penalty: false }, Intuicao: { attr: 'PRE', penalty: false },
  Religiao: { attr: 'PRE', penalty: true }, Vontade: { attr: 'PRE', penalty: false },
  Percepcao: { attr: 'PRE', penalty: false }, Fortitude: { attr: 'VIG', penalty: false },
};

export const periciasBase = Object.keys(configPericias).sort();

export function rolarPericia(nome, nivel, qtdDados) {
  const conf = configPericias[nome];
  const mod = nivel === 1 ? 3 : nivel === 2 ? 6 : (nivel === 0 && conf && conf.penalty ? -3 : 0);

  const numDados = parseInt(qtdDados) || 0;
  const rCount = numDados > 0 ? numDados : 2;
  const rolls = [];
  for (let i = 0; i < rCount; i++) rolls.push(Math.floor(Math.random() * 20) + 1);

  const selected = numDados > 0 ? Math.max.apply(null, rolls) : Math.min.apply(null, rolls);
  const total = selected + mod;
  const modStr = mod >= 0 ? '+' + mod : String(mod);
  const calc = numDados > 0
    ? '[' + numDados + 'd20] (' + rolls.join(', ') + ') -> Maior: ' + selected + ' | Mod: ' + modStr
    : '[2d20] (' + rolls.join(', ') + ') -> Menor: ' + selected + ' | Mod: ' + modStr;

  return { nome, roll: selected, mod, total, calc };
}