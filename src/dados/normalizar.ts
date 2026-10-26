// Transforma qualquer JSON (cópia desta app ou dados do protótipo) num objeto Dados válido.
// Campos em falta ganham valores por omissão; nada é inventado.
import type { Aula, Dados, ItemAula } from "../tipos";
import { uid } from "../util";

export const dadosVazios = (): Dados => ({
  turmas: [],
  objectivos: [],
  biblioteca: [],
  espetaculos: [],
  aulas: [],
  coreografias: [],
});

const lista = (v: any): any[] => (Array.isArray(v) ? v : []);
const texto = (v: any) => (v === undefined || v === null ? "" : String(v));
const ids = (v: any): string[] => lista(v).map(String);

function itemAula(i: any): ItemAula {
  const r: ItemAula = { itemId: texto(i?.itemId), feito: i?.feito === true ? true : i?.feito === false ? false : null, tempo: texto(i?.tempo) };
  if (i?.extra) r.extra = true;
  return r;
}

function aula(a: any): Aula {
  const b = a?.blocos ?? {};
  return {
    id: texto(a.id),
    turmaId: texto(a.turmaId),
    data: texto(a.data),
    objectivoDia: texto(a.objectivoDia),
    paraCasa: texto(a.paraCasa),
    duracao: Number(a.duracao) || 60,
    estado: a.estado === "dada" ? "dada" : "planeada",
    blocos: {
      aquecimento: { itemId: texto(b.aquecimento?.itemId), tempo: texto(b.aquecimento?.tempo) },
      movimentos: lista(b.movimentos).map(itemAula),
      dinamicas: lista(b.dinamicas).map(itemAula),
      coreografia: { coreografiaId: texto(b.coreografia?.coreografiaId), tempo: texto(b.coreografia?.tempo) },
      alongamento: { itemId: texto(b.alongamento?.itemId), tempo: texto(b.alongamento?.tempo) },
    },
  };
}

export function normalizar(bruto: any): Dados {
  if (!bruto || typeof bruto !== "object") throw new Error("O ficheiro não tem dados da app.");
  const d = bruto.dados && typeof bruto.dados === "object" ? bruto.dados : bruto; // aceita {versao, dados} ou o objeto direto
  const chaves = ["turmas", "objectivos", "biblioteca", "espetaculos", "aulas", "coreografias"];
  if (!chaves.some((k) => Array.isArray(d[k]))) throw new Error("O ficheiro não tem dados da app.");

  const turmas = lista(d.turmas).map((t: any) => ({
    id: texto(t.id),
    nome: texto(t.nome),
    diaHora: texto(t.diaHora),
    duracaoPadrao: Number(t.duracaoPadrao) || 60,
    aquecimentoPadraoId: texto(t.aquecimentoPadraoId),
    alongamentoPadraoId: texto(t.alongamentoPadraoId),
    objectivoIds: ids(t.objectivoIds),
    bailarinos: lista(t.bailarinos).map(texto).filter(Boolean),
    modalidade: texto(t.modalidade),
    privada: Boolean(t.privada),
    pacote: t.pacote === null || t.pacote === undefined || t.pacote === "" ? null : Number(t.pacote) || null,
  }));

  // No protótipo o objetivo também tinha turmaIds; juntamos essa ligação à turma.
  for (const o of lista(d.objectivos)) {
    for (const tid of ids(o.turmaIds)) {
      const t = turmas.find((x) => x.id === tid);
      if (t && !t.objectivoIds.includes(String(o.id))) t.objectivoIds.push(String(o.id));
    }
  }

  return semReferenciasPerdidas({
    turmas,
    objectivos: lista(d.objectivos).map((o: any) => ({ id: texto(o.id), nome: texto(o.nome), arquivado: Boolean(o.arquivado) })),
    biblioteca: lista(d.biblioteca).map((m: any) => ({
      id: texto(m.id),
      tipo: m.tipo === "dinamica" ? "dinamica" : "movimento",
      nome: texto(m.nome),
      descricao: texto(m.descricao),
      categoria: ["aquecimento", "tecnica", "coreografia", "alongamento"].includes(m.categoria) ? m.categoria : "",
      objectivoIds: ids(m.objectivoIds),
      parentId: texto(m.parentId),
      modalidade: texto(m.modalidade),
    })),
    espetaculos: lista(d.espetaculos).map((e: any) => ({ id: texto(e.id), nome: texto(e.nome), data: texto(e.data), turmaIds: ids(e.turmaIds) })),
    aulas: lista(d.aulas).map(aula),
    coreografias: lista(d.coreografias).map((c: any) => ({
      id: texto(c.id),
      turmaId: texto(c.turmaId),
      nome: texto(c.nome),
      bailarinos: lista(c.bailarinos).map((b: any) => ({ id: texto(b.id), nome: texto(b.nome), cor: texto(b.cor) || "#999999" })),
      formacoes: lista(c.formacoes).map((f: any) => ({
        id: texto(f.id),
        nome: texto(f.nome),
        notas: texto(f.notas),
        posicoes: lista(f.posicoes).map((p: any) => ({ bailarinoId: texto(p.bailarinoId), x: Number(p.x) || 0, y: Number(p.y) || 0 })),
        inicio: f.inicio === null || f.inicio === undefined || f.inicio === "" ? null : Number(f.inicio) || 0,
        transicao: f.transicao === undefined ? 2 : Number(f.transicao) || 0,
      })),
      musicaPath: texto(c.musicaPath),
      musicaNome: texto(c.musicaNome),
    })),
  });
}

/** Tira ligações a coisas que já não existem (a base de dados não as aceitaria). */
function semReferenciasPerdidas(d: Dados): Dados {
  const existe = (lista: { id: string }[]) => {
    const ids = new Set(lista.map((x) => x.id));
    return (id: string) => ids.has(id);
  };
  const objetivo = existe(d.objectivos);
  const item = existe(d.biblioteca);
  const turma = existe(d.turmas);
  const coreo = (id: string) => d.coreografias.some((c) => c.id === id && turma(c.turmaId));
  const soItem = (id: string) => (item(id) ? id : "");
  return {
    objectivos: d.objectivos,
    biblioteca: d.biblioteca.map((m) => ({ ...m, parentId: soItem(m.parentId), objectivoIds: m.objectivoIds.filter(objetivo) })),
    turmas: d.turmas.map((t) => ({
      ...t,
      aquecimentoPadraoId: soItem(t.aquecimentoPadraoId),
      alongamentoPadraoId: soItem(t.alongamentoPadraoId),
      objectivoIds: t.objectivoIds.filter(objetivo),
    })),
    espetaculos: d.espetaculos.map((e) => ({ ...e, turmaIds: e.turmaIds.filter(turma) })),
    coreografias: d.coreografias
      .filter((c) => turma(c.turmaId))
      .map((c) => {
        const bailarino = existe(c.bailarinos);
        return { ...c, formacoes: c.formacoes.map((f) => ({ ...f, posicoes: f.posicoes.filter((p) => bailarino(p.bailarinoId)) })) };
      }),
    aulas: d.aulas
      .filter((a) => turma(a.turmaId))
      .map((a) => ({
        ...a,
        blocos: {
          aquecimento: { ...a.blocos.aquecimento, itemId: soItem(a.blocos.aquecimento.itemId) },
          movimentos: a.blocos.movimentos.filter((i) => item(i.itemId)),
          dinamicas: a.blocos.dinamicas.filter((i) => item(i.itemId)),
          coreografia: { ...a.blocos.coreografia, coreografiaId: coreo(a.blocos.coreografia.coreografiaId) ? a.blocos.coreografia.coreografiaId : "" },
          alongamento: { ...a.blocos.alongamento, itemId: soItem(a.blocos.alongamento.itemId) },
        },
      })),
  };
}

export function resumoDados(d: Dados): string {
  return `${d.turmas.length} turmas, ${d.biblioteca.length} itens na biblioteca, ${d.aulas.length} aulas, ${d.espetaculos.length} espetáculos, ${d.coreografias.length} coreografias`;
}

/**
 * Dá ids novos a tudo, mantendo as ligações. Usado ao importar uma cópia, para a
 * importação funcionar mesmo que a cópia venha de outra conta.
 */
export function comNovosIds(d: Dados): Dados {
  const mapa = new Map<string, string>();
  const n = (id: string) => {
    if (!id) return id;
    if (!mapa.has(id)) mapa.set(id, uid());
    return mapa.get(id)!;
  };
  return {
    turmas: d.turmas.map((t) => ({ ...t, id: n(t.id), aquecimentoPadraoId: n(t.aquecimentoPadraoId), alongamentoPadraoId: n(t.alongamentoPadraoId), objectivoIds: t.objectivoIds.map(n) })),
    objectivos: d.objectivos.map((o) => ({ ...o, id: n(o.id) })),
    biblioteca: d.biblioteca.map((m) => ({ ...m, id: n(m.id), parentId: n(m.parentId), objectivoIds: m.objectivoIds.map(n) })),
    espetaculos: d.espetaculos.map((e) => ({ ...e, id: n(e.id), turmaIds: e.turmaIds.map(n) })),
    aulas: d.aulas.map((a) => ({
      ...a,
      id: n(a.id),
      turmaId: n(a.turmaId),
      blocos: {
        aquecimento: { ...a.blocos.aquecimento, itemId: n(a.blocos.aquecimento.itemId) },
        movimentos: a.blocos.movimentos.map((i) => ({ ...i, itemId: n(i.itemId) })),
        dinamicas: a.blocos.dinamicas.map((i) => ({ ...i, itemId: n(i.itemId) })),
        coreografia: { ...a.blocos.coreografia, coreografiaId: n(a.blocos.coreografia.coreografiaId) },
        alongamento: { ...a.blocos.alongamento, itemId: n(a.blocos.alongamento.itemId) },
      },
    })),
    coreografias: d.coreografias.map((c) => ({
      ...c,
      id: n(c.id),
      turmaId: n(c.turmaId),
      bailarinos: c.bailarinos.map((b) => ({ ...b, id: n(b.id) })),
      formacoes: c.formacoes.map((f) => ({ ...f, id: n(f.id), posicoes: f.posicoes.map((p) => ({ ...p, bailarinoId: n(p.bailarinoId) })) })),
    })),
  };
}
