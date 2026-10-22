// Camada de acesso aos dados: lê e grava no Supabase.
// Os ecrãs trabalham com o objeto Dados; aqui compara-se com o que já está gravado
// e só se envia o que mudou (linhas novas/alteradas e linhas apagadas).
import type { Dados } from "../tipos";
import { supabase } from "./supabase";
import { chaveDe, deLinhas, paraLinhas, TABELAS, type Linha, type Linhas } from "./linhas";

export interface Armazenamento {
  carregar(): Promise<Dados>;
  guardar(dados: Dados): Promise<void>;
}

const PAGINA = 1000; // o Supabase devolve no máximo 1000 linhas por pedido

async function lerTabela(nome: string, colunas: string, ordem: string): Promise<Linha[]> {
  const todas: Linha[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await supabase.from(nome).select(colunas).order(ordem).range(de, de + PAGINA - 1);
    if (error) throw error;
    todas.push(...(data as unknown as Linha[]));
    if (data.length < PAGINA) return todas;
  }
}

type Gravado = Map<string, Map<string, string>>; // tabela → chave → linha em JSON

function fotografia(linhas: Linhas): Gravado {
  return new Map(TABELAS.map((t) => [t.nome, new Map(linhas[t.nome].map((r) => [chaveDe(t, r), JSON.stringify(r)]))]));
}

const verificar = ({ error }: { error: unknown }) => {
  if (error) throw error;
};

const NIVEIS = [...new Set(TABELAS.map((t) => t.nivel))].sort();

export function armazenamentoSupabase(): Armazenamento {
  let gravado: Gravado = new Map();
  let proximo: Dados | null = null; // o estado mais recente ainda por gravar
  let emCurso: Promise<void> | null = null;

  async function apagar(nome: string, chave: string[], linhas: Linha[]) {
    if (chave.length === 1) {
      verificar(await supabase.from(nome).delete().in(chave[0], linhas.map((r) => r[chave[0]] as string)));
    } else {
      await Promise.all(
        linhas.map(async (r) => verificar(await supabase.from(nome).delete().match(Object.fromEntries(chave.map((c) => [c, r[c]])))))
      );
    }
  }

  async function gravar(dados: Dados) {
    const novas = paraLinhas(dados);
    const novo = fotografia(novas);

    // Apagar: dos filhos para os pais.
    for (const nivel of [...NIVEIS].reverse()) {
      await Promise.all(
        TABELAS.filter((t) => t.nivel === nivel).map((t) => {
          const antes = gravado.get(t.nome)!;
          const depois = novo.get(t.nome)!;
          const fora = [...antes.keys()].filter((k) => !depois.has(k)).map((k) => JSON.parse(antes.get(k)!) as Linha);
          return fora.length ? apagar(t.nome, t.chave, fora) : undefined;
        })
      );
    }

    // Gravar: dos pais para os filhos.
    for (const nivel of NIVEIS) {
      await Promise.all(
        TABELAS.filter((t) => t.nivel === nivel).map(async (t) => {
          const antes = gravado.get(t.nome)!;
          const mudadas = new Map<string, Linha>();
          for (const r of novas[t.nome]) {
            const k = chaveDe(t, r);
            if (antes.get(k) !== JSON.stringify(r)) mudadas.set(k, r); // o Map evita repetidos
          }
          if (mudadas.size) verificar(await supabase.from(t.nome).upsert([...mudadas.values()], { onConflict: t.chave.join(",") }));
        })
      );
    }

    gravado = novo;
  }

  return {
    async carregar() {
      const lidas = await Promise.all(TABELAS.map((t) => lerTabela(t.nome, t.colunas, t.ordem)));
      const linhas: Linhas = Object.fromEntries(TABELAS.map((t, i) => [t.nome, lidas[i]]));
      const dados = deLinhas(linhas);
      // A fotografia parte dos Dados (e não das linhas em bruto) para as comparações baterem certo.
      gravado = fotografia(paraLinhas(dados));
      return dados;
    },
    guardar(dados) {
      // Uma gravação de cada vez. Se chegarem vários pedidos enquanto uma decorre,
      // só o mais recente é gravado a seguir (já inclui as alterações dos outros).
      proximo = dados;
      if (!emCurso) {
        emCurso = (async () => {
          try {
            while (proximo) {
              const d = proximo;
              proximo = null;
              await gravar(d);
            }
          } finally {
            emCurso = null;
          }
        })();
      }
      return emCurso;
    },
  };
}

/** Conteúdo do ficheiro de cópia de segurança. */
export function ficheiroCopia(dados: Dados): string {
  return JSON.stringify({ app: "planeador-aulas", versao: 1, exportadoEm: new Date().toISOString(), dados }, null, 2);
}
