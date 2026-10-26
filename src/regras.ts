// Regras de negócio num só sítio, para os ecrãs não duplicarem lógica.
import type { Aula, BlocoLista, Dados, Espetaculo, Id, ItemAula, Turma } from "./tipos";
import { diasEntre, fmtData, hojeISO, minutos } from "./util";

/** A partir de quantas aulas seguidas por fazer um item fica destacado. */
export const LIMITE_POR_FAZER = 3;

const maisRecentePrimeiro = (a: Aula, b: Aula) => b.data.localeCompare(a.data);

export function aulasDadas(aulas: Aula[], turmaId: Id): Aula[] {
  return aulas.filter((a) => a.turmaId === turmaId && a.estado === "dada").sort(maisRecentePrimeiro);
}

export const ultimaAulaDada = (aulas: Aula[], turmaId: Id): Aula | undefined => aulasDadas(aulas, turmaId)[0];

/** O que ficou por fazer na última aula dada passa para a aula seguinte, até ser feito. */
export function porFazerDaUltima(ultima: Aula | undefined): Record<BlocoLista, ItemAula[]> {
  if (!ultima) return { movimentos: [], dinamicas: [] };
  const passar = (l: ItemAula[]) => l.filter((i) => !i.feito).map((i) => ({ itemId: i.itemId, feito: null, tempo: i.tempo }));
  return { movimentos: passar(ultima.blocos.movimentos), dinamicas: passar(ultima.blocos.dinamicas) };
}

/**
 * Em quantas aulas dadas seguidas (da mais recente para trás) o item esteve planeado
 * e não foi feito. Para quando encontra uma aula em que foi feito ou em que não estava.
 */
export function vezesPorFazer(aulas: Aula[], turmaId: Id, bloco: BlocoLista, itemId: Id): number {
  let n = 0;
  for (const a of aulasDadas(aulas, turmaId)) {
    const item = a.blocos[bloco].find((i) => i.itemId === itemId);
    if (!item || item.feito) break;
    n++;
  }
  return n;
}

/** Próximo espetáculo da turma a contar de uma data (por omissão, hoje). */
export function proximoEspetaculo(espetaculos: Espetaculo[], turmaId: Id, aPartirDe = hojeISO()): Espetaculo | undefined {
  return espetaculos
    .filter((e) => e.turmaIds.includes(turmaId) && e.data >= aPartirDe)
    .sort((a, b) => a.data.localeCompare(b.data))[0];
}

export function textoContagem(e: Espetaculo, aPartirDe = hojeISO()): string {
  const d = diasEntre(aPartirDe, e.data);
  if (d === 0) return "é hoje";
  if (d === 1) return "falta 1 dia";
  return `faltam ${d} dias`;
}

export function tempoTotal(aula: Aula): number {
  const b = aula.blocos;
  return [
    minutos(b.aquecimento.tempo),
    ...b.movimentos.map((i) => minutos(i.tempo)),
    ...b.dinamicas.map((i) => minutos(i.tempo)),
    minutos(b.coreografia.tempo),
    minutos(b.alongamento.tempo),
  ].reduce((s, n) => s + n, 0);
}

export function algumTempoDefinido(aula: Aula): boolean {
  const b = aula.blocos;
  return Boolean(
    b.aquecimento.tempo || b.alongamento.tempo || b.coreografia.tempo ||
    b.movimentos.some((i) => i.tempo) || b.dinamicas.some((i) => i.tempo)
  );
}

export function nomeDoItem(dados: Dados, id: Id): string {
  return dados.biblioteca.find((m) => m.id === id)?.nome ?? "(item eliminado)";
}

/** Número da aula numa turma/aula privada: as dadas contam por data; uma planeada é a seguinte às dadas. */
export function numeroDaAula(aulas: Aula[], aula: Aula): number {
  const dadas = aulas.filter((a) => a.turmaId === aula.turmaId && a.estado === "dada").sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
  const i = dadas.findIndex((a) => a.id === aula.id);
  return i >= 0 ? i + 1 : dadas.length + 1;
}

export const aulasDadasDe = (aulas: Aula[], turmaId: Id) => aulas.filter((a) => a.turmaId === turmaId && a.estado === "dada").length;

export function resumoWhatsApp(dados: Dados, aula: Aula, turma: Turma): string {
  const feitos = [...aula.blocos.movimentos, ...aula.blocos.dinamicas].filter((i) => i.feito).map((i) => nomeDoItem(dados, i.itemId));
  const doPacote = turma.privada && turma.pacote ? ` (aula ${numeroDaAula(dados.aulas, aula)} de ${turma.pacote})` : "";
  const linhas = [
    `Aula de ${fmtData(aula.data)} — ${turma.nome}${doPacote}`,
    aula.objectivoDia ? `Objetivo: ${aula.objectivoDia}` : "",
    `Hoje demos: ${feitos.join(", ") || "—"}.`,
    aula.paraCasa.trim() ? `Para treinar em casa: ${aula.paraCasa.trim()}` : "",
  ];
  return linhas.filter(Boolean).join("\n");
}

/** Em quantas aulas um item da biblioteca é usado (para avisar antes de eliminar). */
export function aulasQueUsam(aulas: Aula[], itemIds: Id[]): number {
  return aulas.filter((a) => {
    const b = a.blocos;
    return (
      itemIds.includes(b.aquecimento.itemId) || itemIds.includes(b.alongamento.itemId) ||
      [...b.movimentos, ...b.dinamicas].some((i) => itemIds.includes(i.itemId))
    );
  }).length;
}

/** Tira itens eliminados das aulas, para não aparecerem como "?". */
export function semItens(aula: Aula, itemIds: Id[]): Aula {
  const b = aula.blocos;
  const limpaSimples = (s: { itemId: Id | ""; tempo: string }) => (itemIds.includes(s.itemId) ? { itemId: "", tempo: s.tempo } : s);
  return {
    ...aula,
    blocos: {
      ...b,
      aquecimento: limpaSimples(b.aquecimento),
      alongamento: limpaSimples(b.alongamento),
      movimentos: b.movimentos.filter((i) => !itemIds.includes(i.itemId)),
      dinamicas: b.dinamicas.filter((i) => !itemIds.includes(i.itemId)),
    },
  };
}

/** Turmas primeiro, depois aulas privadas (marcadas com 👤), para as filas de escolha. */
export function paraEscolha(turmas: Turma[]): { id: Id; nome: string }[] {
  return [...turmas.filter((t) => !t.privada), ...turmas.filter((t) => t.privada)].map((t) => ({ id: t.id, nome: t.privada ? `👤 ${t.nome}` : t.nome }));
}
