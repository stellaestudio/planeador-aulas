// Modelo de dados da app. Os nomes dos campos são os mesmos do protótipo,
// para a importação dos dados antigos ser direta.

export type Id = string;

export type Categoria = "aquecimento" | "tecnica" | "coreografia" | "alongamento";

export interface Turma {
  id: Id;
  nome: string;
  diaHora: string;
  duracaoPadrao: number;
  aquecimentoPadraoId: Id | "";
  alongamentoPadraoId: Id | "";
  objectivoIds: Id[];
  bailarinos: string[];
  modalidade: string; // "" = sem modalidade; id de MODALIDADES ou nome escrito pela professora
}

// A ligação objetivo ↔ turma vive só na turma (turma.objectivoIds).
export interface Objetivo {
  id: Id;
  nome: string;
  arquivado: boolean;
}

export interface ItemBiblioteca {
  id: Id;
  tipo: "movimento" | "dinamica";
  nome: string;
  descricao: string;
  categoria: Categoria | ""; // só para movimentos
  objectivoIds: Id[];
  parentId: Id | ""; // variação de outro item
  modalidade: string; // "" = geral (serve para todas)
}

export interface Espetaculo {
  id: Id;
  nome: string;
  data: string; // AAAA-MM-DD
  turmaIds: Id[];
}

export type Feito = boolean | null;

export interface ItemAula {
  itemId: Id;
  feito: Feito;
  tempo: string; // minutos, vazio = sem tempo
  extra?: boolean;
}

export interface BlocoSimples {
  itemId: Id | "";
  tempo: string;
}

export interface BlocoCoreografia {
  coreografiaId: Id | "";
  tempo: string;
}

export type BlocoLista = "movimentos" | "dinamicas";

export interface Aula {
  id: Id;
  turmaId: Id;
  data: string;
  objectivoDia: string;
  duracao: number;
  estado: "planeada" | "dada";
  blocos: {
    aquecimento: BlocoSimples;
    movimentos: ItemAula[];
    dinamicas: ItemAula[];
    coreografia: BlocoCoreografia;
    alongamento: BlocoSimples;
  };
}

export interface Bailarino {
  id: Id;
  nome: string;
  cor: string;
}

export interface Posicao {
  bailarinoId: Id;
  x: number; // 0-100 (% da largura do palco)
  y: number; // 0-100 (% da profundidade)
}

export interface Formacao {
  id: Id;
  nome: string;
  notas: string;
  posicoes: Posicao[];
  inicio: number | null; // segundos na música em que os bailarinos começam a ir para esta formação
  transicao: number; // segundos que demoram a chegar
}

export interface Coreografia {
  id: Id;
  turmaId: Id;
  nome: string;
  bailarinos: Bailarino[];
  formacoes: Formacao[];
  musicaPath: string; // ficheiro no Supabase Storage ("" = sem música)
  musicaNome: string;
}

export interface Dados {
  turmas: Turma[];
  objectivos: Objetivo[];
  biblioteca: ItemBiblioteca[];
  espetaculos: Espetaculo[];
  aulas: Aula[];
  coreografias: Coreografia[];
}

export type Atualizar = <K extends keyof Dados>(chave: K, fn: (atual: Dados[K]) => Dados[K]) => void;
