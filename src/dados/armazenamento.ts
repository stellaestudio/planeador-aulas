// Camada de acesso aos dados. Hoje guarda no próprio browser (localStorage);
// mais tarde troca-se só este ficheiro pela versão Supabase, sem mexer nos ecrãs.
import type { Dados } from "../tipos";
import { normalizar } from "./normalizar";

export interface Armazenamento {
  /** Devolve os dados guardados, ou null se ainda não houver nada. */
  carregar(): Promise<Dados | null>;
  guardar(dados: Dados): Promise<void>;
}

const CHAVE = "planeador-dados";
const VERSAO = 1;

export const armazenamentoLocal: Armazenamento = {
  async carregar() {
    const guardado = localStorage.getItem(CHAVE);
    return guardado ? normalizar(JSON.parse(guardado)) : null;
  },
  async guardar(dados) {
    localStorage.setItem(CHAVE, JSON.stringify({ versao: VERSAO, dados }));
  },
};

/** Conteúdo do ficheiro de cópia de segurança. */
export function ficheiroCopia(dados: Dados): string {
  return JSON.stringify({ app: "planeador-aulas", versao: VERSAO, exportadoEm: new Date().toISOString(), dados }, null, 2);
}
