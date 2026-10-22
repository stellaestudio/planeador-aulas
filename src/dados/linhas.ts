// Conversão entre o objeto Dados (usado pelos ecrãs) e as linhas das tabelas do Supabase.
import type { Aula, Dados, ItemAula } from "../tipos";

export type Linha = Record<string, string | number | boolean | null | string[]>;

interface Tabela {
  nome: string;
  chave: string[]; // colunas da chave primária
  colunas: string; // o que se lê (sem owner_id)
  ordem: string; // ordenação ao ler
  nivel: number; // tabelas do mesmo nível não dependem umas das outras
}

// Por nível de dependência: uma tabela só refere tabelas de níveis anteriores (ou a ela própria).
// Grava-se do nível 0 para o 4; apaga-se do 4 para o 0. Dentro de cada nível vai tudo ao mesmo tempo.
export const TABELAS: Tabela[] = [
  { nome: "objetivos", chave: ["id"], colunas: "id,nome,arquivado", ordem: "criado_em", nivel: 0 },
  { nome: "biblioteca_itens", chave: ["id"], colunas: "id,tipo,nome,descricao,categoria,parent_id", ordem: "criado_em", nivel: 0 },
  { nome: "item_objetivos", chave: ["item_id", "objetivo_id"], colunas: "item_id,objetivo_id", ordem: "item_id", nivel: 1 },
  { nome: "turmas", chave: ["id"], colunas: "id,nome,dia_hora,duracao_padrao,aquecimento_padrao_id,alongamento_padrao_id,bailarinos", ordem: "criado_em", nivel: 1 },
  { nome: "turma_objetivos", chave: ["turma_id", "objetivo_id"], colunas: "turma_id,objetivo_id", ordem: "turma_id", nivel: 2 },
  { nome: "espetaculos", chave: ["id"], colunas: "id,nome,data", ordem: "criado_em", nivel: 0 },
  { nome: "espetaculo_turmas", chave: ["espetaculo_id", "turma_id"], colunas: "espetaculo_id,turma_id", ordem: "espetaculo_id", nivel: 2 },
  { nome: "coreografias", chave: ["id"], colunas: "id,turma_id,nome", ordem: "criado_em", nivel: 2 },
  { nome: "bailarinos", chave: ["id"], colunas: "id,coreografia_id,nome,cor,ordem", ordem: "ordem", nivel: 3 },
  { nome: "formacoes", chave: ["id"], colunas: "id,coreografia_id,nome,notas,ordem", ordem: "ordem", nivel: 3 },
  { nome: "formacao_posicoes", chave: ["formacao_id", "bailarino_id"], colunas: "formacao_id,bailarino_id,x,y", ordem: "formacao_id", nivel: 4 },
  { nome: "aulas", chave: ["id"], colunas: "id,turma_id,data,objetivo_dia,duracao,estado,aquecimento_id,aquecimento_tempo,alongamento_id,alongamento_tempo,coreografia_id,coreografia_tempo", ordem: "criado_em", nivel: 3 },
  { nome: "aula_itens", chave: ["aula_id", "bloco", "item_id"], colunas: "aula_id,bloco,item_id,ordem,feito,tempo,extra", ordem: "ordem", nivel: 4 },
];

export type Linhas = Record<string, Linha[]>;

const ouNull = (v: string) => (v === "" ? null : v);
const numOuNull = (v: string) => (v === "" || isNaN(Number(v)) ? null : Number(v));
const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function paraLinhas(d: Dados): Linhas {
  const aulaItens = (a: Aula, bloco: "movimentos" | "dinamicas") =>
    a.blocos[bloco].map((i: ItemAula, ordem) => ({
      aula_id: a.id, bloco, item_id: i.itemId, ordem, feito: i.feito, tempo: numOuNull(i.tempo), extra: Boolean(i.extra),
    }));

  return {
    objetivos: d.objectivos.map((o) => ({ id: o.id, nome: o.nome, arquivado: o.arquivado })),
    biblioteca_itens: d.biblioteca.map((m) => ({
      id: m.id, tipo: m.tipo, nome: m.nome, descricao: m.descricao, categoria: ouNull(m.categoria), parent_id: ouNull(m.parentId),
    })),
    item_objetivos: d.biblioteca.flatMap((m) => m.objectivoIds.map((o) => ({ item_id: m.id, objetivo_id: o }))),
    turmas: d.turmas.map((t) => ({
      id: t.id, nome: t.nome, dia_hora: t.diaHora, duracao_padrao: Math.round(Number(t.duracaoPadrao) || 0),
      aquecimento_padrao_id: ouNull(t.aquecimentoPadraoId), alongamento_padrao_id: ouNull(t.alongamentoPadraoId), bailarinos: t.bailarinos,
    })),
    turma_objetivos: d.turmas.flatMap((t) => t.objectivoIds.map((o) => ({ turma_id: t.id, objetivo_id: o }))),
    espetaculos: d.espetaculos.map((e) => ({ id: e.id, nome: e.nome, data: e.data })),
    espetaculo_turmas: d.espetaculos.flatMap((e) => e.turmaIds.map((t) => ({ espetaculo_id: e.id, turma_id: t }))),
    coreografias: d.coreografias.map((c) => ({ id: c.id, turma_id: c.turmaId, nome: c.nome })),
    bailarinos: d.coreografias.flatMap((c) => c.bailarinos.map((b, ordem) => ({ id: b.id, coreografia_id: c.id, nome: b.nome, cor: b.cor, ordem }))),
    formacoes: d.coreografias.flatMap((c) => c.formacoes.map((f, ordem) => ({ id: f.id, coreografia_id: c.id, nome: f.nome, notas: f.notas, ordem }))),
    formacao_posicoes: d.coreografias.flatMap((c) => c.formacoes.flatMap((f) => f.posicoes.map((p) => ({ formacao_id: f.id, bailarino_id: p.bailarinoId, x: p.x, y: p.y })))),
    aulas: d.aulas.map((a) => ({
      id: a.id, turma_id: a.turmaId, data: a.data, objetivo_dia: a.objectivoDia, duracao: Math.round(Number(a.duracao) || 0), estado: a.estado,
      aquecimento_id: ouNull(a.blocos.aquecimento.itemId), aquecimento_tempo: numOuNull(a.blocos.aquecimento.tempo),
      alongamento_id: ouNull(a.blocos.alongamento.itemId), alongamento_tempo: numOuNull(a.blocos.alongamento.tempo),
      coreografia_id: ouNull(a.blocos.coreografia.coreografiaId), coreografia_tempo: numOuNull(a.blocos.coreografia.tempo),
    })),
    aula_itens: d.aulas.flatMap((a) => [...aulaItens(a, "movimentos"), ...aulaItens(a, "dinamicas")]),
  };
}

/* Linhas lidas do Supabase → Dados. As linhas já vêm ordenadas (ver TABELAS). */
export function deLinhas(l: Linhas): Dados {
  const agrupar = (linhas: Linha[], campo: string) => {
    const m = new Map<string, Linha[]>();
    for (const r of linhas) {
      const k = String(r[campo]);
      m.set(k, [...(m.get(k) ?? []), r]);
    }
    return (k: string) => m.get(k) ?? [];
  };
  const objetivosDoItem = agrupar(l.item_objetivos, "item_id");
  const objetivosDaTurma = agrupar(l.turma_objetivos, "turma_id");
  const turmasDoEspetaculo = agrupar(l.espetaculo_turmas, "espetaculo_id");
  const bailarinosDe = agrupar(l.bailarinos, "coreografia_id");
  const formacoesDe = agrupar(l.formacoes, "coreografia_id");
  const posicoesDe = agrupar(l.formacao_posicoes, "formacao_id");
  const itensDaAula = agrupar(l.aula_itens, "aula_id");

  const itemAula = (r: Linha): ItemAula => {
    const i: ItemAula = { itemId: String(r.item_id), feito: r.feito as boolean | null, tempo: texto(r.tempo) };
    if (r.extra) i.extra = true;
    return i;
  };

  return {
    objectivos: l.objetivos.map((r) => ({ id: String(r.id), nome: String(r.nome), arquivado: Boolean(r.arquivado) })),
    biblioteca: l.biblioteca_itens.map((r) => ({
      id: String(r.id),
      tipo: r.tipo === "dinamica" ? "dinamica" : "movimento",
      nome: String(r.nome),
      descricao: texto(r.descricao),
      categoria: texto(r.categoria) as Dados["biblioteca"][number]["categoria"],
      objectivoIds: objetivosDoItem(String(r.id)).map((x) => String(x.objetivo_id)),
      parentId: texto(r.parent_id),
    })),
    turmas: l.turmas.map((r) => ({
      id: String(r.id),
      nome: String(r.nome),
      diaHora: texto(r.dia_hora),
      duracaoPadrao: Number(r.duracao_padrao),
      aquecimentoPadraoId: texto(r.aquecimento_padrao_id),
      alongamentoPadraoId: texto(r.alongamento_padrao_id),
      objectivoIds: objetivosDaTurma(String(r.id)).map((x) => String(x.objetivo_id)),
      bailarinos: (r.bailarinos as string[]) ?? [],
    })),
    espetaculos: l.espetaculos.map((r) => ({
      id: String(r.id), nome: String(r.nome), data: String(r.data), turmaIds: turmasDoEspetaculo(String(r.id)).map((x) => String(x.turma_id)),
    })),
    coreografias: l.coreografias.map((r) => ({
      id: String(r.id),
      turmaId: String(r.turma_id),
      nome: String(r.nome),
      bailarinos: bailarinosDe(String(r.id)).map((b) => ({ id: String(b.id), nome: String(b.nome), cor: String(b.cor) })),
      formacoes: formacoesDe(String(r.id)).map((f) => ({
        id: String(f.id),
        nome: String(f.nome),
        notas: texto(f.notas),
        posicoes: posicoesDe(String(f.id)).map((p) => ({ bailarinoId: String(p.bailarino_id), x: Number(p.x), y: Number(p.y) })),
      })),
    })),
    aulas: l.aulas.map((r) => {
      const itens = itensDaAula(String(r.id));
      return {
        id: String(r.id),
        turmaId: String(r.turma_id),
        data: String(r.data),
        objectivoDia: texto(r.objetivo_dia),
        duracao: Number(r.duracao),
        estado: r.estado === "dada" ? "dada" : "planeada",
        blocos: {
          aquecimento: { itemId: texto(r.aquecimento_id), tempo: texto(r.aquecimento_tempo) },
          movimentos: itens.filter((i) => i.bloco === "movimentos").map(itemAula),
          dinamicas: itens.filter((i) => i.bloco === "dinamicas").map(itemAula),
          coreografia: { coreografiaId: texto(r.coreografia_id), tempo: texto(r.coreografia_tempo) },
          alongamento: { itemId: texto(r.alongamento_id), tempo: texto(r.alongamento_tempo) },
        },
      };
    }),
  };
}

export const chaveDe = (t: Tabela, r: Linha) => t.chave.map((c) => String(r[c])).join("|");
