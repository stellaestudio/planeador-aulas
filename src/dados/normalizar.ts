// Transforma qualquer JSON (cópia desta app ou dados do protótipo) num objeto Dados válido.
// Campos em falta ganham valores por omissão; nada é inventado.
import type { Aula, Dados, ItemAula } from "../tipos";

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
  }));

  // No protótipo o objetivo também tinha turmaIds; juntamos essa ligação à turma.
  for (const o of lista(d.objectivos)) {
    for (const tid of ids(o.turmaIds)) {
      const t = turmas.find((x) => x.id === tid);
      if (t && !t.objectivoIds.includes(String(o.id))) t.objectivoIds.push(String(o.id));
    }
  }

  return {
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
      })),
    })),
  };
}

export function resumoDados(d: Dados): string {
  return `${d.turmas.length} turmas, ${d.biblioteca.length} itens na biblioteca, ${d.aulas.length} aulas, ${d.espetaculos.length} espetáculos, ${d.coreografias.length} coreografias`;
}
