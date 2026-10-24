// Modalidades e as suas bibliotecas típicas.
// Ao escolher uma destas modalidades numa turma, os itens que ainda não existam na biblioteca são acrescentados.
// Para mudar as listas basta editar este ficheiro.
import type { Categoria, ItemBiblioteca } from "./tipos";
import { uid } from "./util";

interface ItemTipico {
  nome: string;
  tipo?: "movimento" | "dinamica"; // por omissão, movimento
  categoria?: Categoria; // por omissão, técnica (só para movimentos)
  descricao?: string;
}

export interface Modalidade {
  id: string;
  nome: string;
  itens: ItemTipico[];
}

const aq = (nome: string, descricao?: string): ItemTipico => ({ nome, categoria: "aquecimento", descricao });
const al = (nome: string, descricao?: string): ItemTipico => ({ nome, categoria: "alongamento", descricao });
const tec = (nome: string, descricao?: string): ItemTipico => ({ nome, descricao });
const din = (nome: string, descricao?: string): ItemTipico => ({ nome, tipo: "dinamica", descricao });

export const MODALIDADES: Modalidade[] = [
  {
    id: "oriental",
    nome: "Dança oriental",
    itens: [
      aq("Isolamentos de cabeça e pescoço"),
      aq("Círculos e isolamentos de ombros"),
      aq("Isolamentos de caixa torácica"),
      aq("Mobilização de ancas e joelhos"),
      tec("Postura base", "Joelhos soltos, bacia neutra, peito aberto, braços em moldura"),
      tec("Shimmy de anca"),
      tec("Shimmy de ombros"),
      tec("Shimmy de joelhos", "Shimmy egípcio"),
      tec("Shimmy em três tempos", "Shimmy 3/4"),
      tec("Batida de anca", "Hip drop: anca desce com acento"),
      tec("Elevação de anca", "Hip lift: anca sobe com acento"),
      tec("Twist de anca"),
      tec("Círculo de anca", "Redondo grande e pequeno"),
      tec("Oito horizontal", "Para a frente e para trás"),
      tec("Oito vertical maya", "Oito de cima para baixo"),
      tec("Oito vertical taqsim", "Oito de baixo para cima"),
      tec("Camelo", "Ondulação do tronco para a frente"),
      tec("Camelo invertido", "Ondulação do tronco para trás"),
      tec("Ondulação de peito"),
      tec("Deslizamento de peito", "Lateral, de um lado para o outro"),
      tec("Círculo de peito"),
      tec("Braços de serpente"),
      tec("Mãos e pulsos (floreios)"),
      tec("Passo básico egípcio"),
      tec("Deslocamento com shimmy"),
      tec("Giro simples"),
      tec("Trabalho de véu"),
      tec("Crótalos (snujs)"),
      al("Gato-vaca", "Alongamento e mobilização das costas"),
      al("Alongamento lateral do tronco"),
      al("Alongamento de ancas e glúteos"),
      al("Alongamento de pescoço e ombros"),
      din("Espelho em pares"),
      din("Improvisação ao ritmo da percussão", "Responder aos acentos do derbake/tabla"),
      din("Roda de shimmies"),
      din("Estátuas com pose oriental"),
    ],
  },
  {
    id: "ballet",
    nome: "Ballet",
    itens: [
      aq("Mobilização de pés e tornozelos", "Flex e ponta"),
      aq("Mobilização articular geral"),
      aq("Ativação do core e postura"),
      tec("Posições dos pés", "1.ª à 5.ª"),
      tec("Posições dos braços"),
      tec("Plié", "Demi e grand plié — barra"),
      tec("Battement tendu", "Barra"),
      tec("Battement jeté", "Dégagé — barra"),
      tec("Rond de jambe à terre", "Barra"),
      tec("Rond de jambe en l'air", "Barra"),
      tec("Battement fondu", "Barra"),
      tec("Battement frappé", "Barra"),
      tec("Développé", "Adage — barra e centro"),
      tec("Grand battement", "Barra"),
      tec("Relevé"),
      tec("Port de bras"),
      tec("Passé (retiré)"),
      tec("Arabesque"),
      tec("Attitude"),
      tec("Pirouette en dehors", "Centro"),
      tec("Pirouette en dedans", "Centro"),
      tec("Chaînés", "Centro — giros em diagonal"),
      tec("Balancé", "Centro"),
      tec("Pas de bourrée", "Centro"),
      tec("Glissade", "Centro"),
      tec("Sauté", "Saltos"),
      tec("Changement", "Saltos"),
      tec("Échappé sauté", "Saltos"),
      tec("Assemblé", "Saltos"),
      tec("Jeté", "Saltos"),
      tec("Pas de chat", "Saltos"),
      tec("Sissonne", "Saltos"),
      tec("Grand jeté", "Saltos — em diagonal"),
      tec("Révérence", "Agradecimento no fim da aula"),
      al("Alongamento de isquiotibiais"),
      al("Espargata frontal e lateral"),
      al("Alongamento de pés e gémeos"),
      al("Borboleta", "Abertura de ancas sentada"),
      din("Estátuas em posição de ballet"),
      din("Jogo do espelho"),
      din("O mestre manda", "Com posições e passos de ballet"),
      din("Pequena variação em grupo"),
    ],
  },
  {
    id: "contemporaneo",
    nome: "Contemporâneo",
    itens: [
      aq("Roll down e roll up", "Enrolar e desenrolar a coluna"),
      aq("Respiração e consciência corporal"),
      aq("Swings de braços e pernas"),
      aq("Mobilização articular"),
      tec("Contração e release", "Técnica Graham"),
      tec("Queda e recuperação", "Fall and recovery, técnica Humphrey"),
      tec("Espiral", "Torção da coluna"),
      tec("Swing", "Balanço com peso e suspensão"),
      tec("Suspensão"),
      tec("Flat back"),
      tec("Tilt"),
      tec("Curva (curve)"),
      tec("Body roll", "Ondulação do corpo"),
      tec("Isolamentos"),
      tec("Off-balance", "Sair do eixo e recuperar"),
      tec("Trabalho de chão (floor work)"),
      tec("Rolamentos no chão"),
      tec("Deslizes no chão (slides)"),
      tec("Inversões", "Apoios nas mãos, peso fora dos pés"),
      tec("Giro paralelo", "Pirouette em paralelo"),
      tec("Saltos contemporâneos"),
      tec("Deslocamentos no espaço", "Níveis, direções e qualidades de movimento"),
      tec("Peso e contrapeso", "Em pares"),
      al("Alongamento de coluna no chão"),
      al("Torção deitada"),
      al("Postura do pombo", "Alongamento de ancas"),
      al("Respiração e relaxamento final"),
      din("Improvisação com imagens ou palavras"),
      din("Contacto em pares", "Partilha de peso"),
      din("Espelho em pares"),
      din("Composição em pequenos grupos"),
    ],
  },
  {
    id: "hiphop",
    nome: "Hip hop",
    itens: [
      aq("Bounce e groove"),
      aq("Isolamentos", "Cabeça, ombros, peito e anca"),
      aq("Mobilização articular com música"),
      aq("Cardio leve", "Passos laterais e saltitos"),
      tec("Bounce", "Ressalto para baixo"),
      tec("Rock", "Balanço para a frente e para trás"),
      tec("Two step"),
      tec("Running man"),
      tec("Roger Rabbit"),
      tec("Kick ball change"),
      tec("Cabbage patch"),
      tec("Wop"),
      tec("Bart Simpson"),
      tec("Smurf"),
      tec("Biz Markie"),
      tec("Criss cross"),
      tec("Reebok"),
      tec("Steve Martin"),
      tec("Body roll", "Onda do corpo"),
      tec("Isolamento de peito"),
      tec("Popping", "Hits / contrações"),
      tec("Locking", "Lock, point, wrist roll"),
      tec("Waving", "Ondas"),
      tec("Toprock", "Breaking"),
      tec("Six step", "Breaking"),
      tec("Freeze", "Breaking"),
      al("Alongamento de quadríceps e isquiotibiais"),
      al("Alongamento de gémeos"),
      al("Alongamento de ombros e braços"),
      al("Alongamento de costas"),
      din("Cypher", "Roda de freestyle"),
      din("Batalha amigável (battle)"),
      din("Freestyle com paragens", "Congelar quando a música para"),
      din("Copia o passo", "Pergunta e resposta"),
    ],
  },
  {
    id: "acrodance",
    nome: "Acrodance",
    itens: [
      aq("Mobilidade de pulsos", "Essencial antes de apoios nas mãos"),
      aq("Aquecimento de ombros e coluna"),
      aq("Pranchas e ativação do core"),
      aq("Saltos leves e cardio"),
      tec("Ponte a partir do chão"),
      tec("Ponte a partir de pé", "Backbend"),
      tec("Subir da ponte", "Stand up from bridge"),
      tec("Pino", "Handstand"),
      tec("Pino de cabeça", "Headstand"),
      tec("Chest stand"),
      tec("Rolamento à frente"),
      tec("Rolamento atrás"),
      tec("Roda", "Cartwheel"),
      tec("Roda de uma mão"),
      tec("Rondada", "Round-off"),
      tec("Front limber"),
      tec("Back limber"),
      tec("Walkover à frente"),
      tec("Walkover atrás"),
      tec("Valdez"),
      tec("Tik-tok"),
      tec("Flic-flac", "Back handspring — com ajuda/progressões"),
      tec("Roda sem mãos", "Aerial — nível avançado"),
      al("Espargata frontal e lateral"),
      al("Cobra e foca", "Alongamento de costas"),
      al("Abertura de ombros"),
      al("Alongamento de pulsos e antebraços"),
      din("Circuito de estações"),
      din("Equilíbrios em pares e pirâmides simples"),
      din("Espelho com poses acrobáticas"),
      din("Desafio de flexibilidade"),
    ],
  },
];

export const modalidadePorId = (id: string) => MODALIDADES.find((m) => m.id === id);

/** Nome a mostrar: o nome das modalidades conhecidas ou o texto escrito pela professora. */
export const nomeModalidade = (id: string) => modalidadePorId(id)?.nome ?? id;

const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Itens típicos da modalidade que ainda não estão na biblioteca (compara pelo nome). */
export function itensEmFalta(biblioteca: ItemBiblioteca[], modalidadeId: string): ItemBiblioteca[] {
  const m = modalidadePorId(modalidadeId);
  if (!m) return [];
  return m.itens
    .filter((i) => !biblioteca.some((b) => b.tipo === (i.tipo ?? "movimento") && igual(b.nome, i.nome)))
    .map((i) => {
      const tipo = i.tipo ?? "movimento";
      return {
        id: uid(),
        tipo,
        nome: i.nome,
        descricao: i.descricao ?? "",
        categoria: tipo === "movimento" ? (i.categoria ?? "tecnica") : "",
        objectivoIds: [],
        parentId: "",
        modalidade: m.id,
      };
    });
}

/** Separa um texto em nomes: um por linha ou separados por vírgula/ponto e vírgula. Tira repetidos. */
export function nomesDoTexto(texto: string): string[] {
  const nomes: string[] = [];
  for (const n of texto.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean)) {
    if (!nomes.some((x) => igual(x, n))) nomes.push(n);
  }
  return nomes;
}

/** Cria itens a partir de nomes, saltando os que já existem na biblioteca. */
export function itensDosNomes(
  biblioteca: ItemBiblioteca[],
  nomes: string[],
  base: { tipo: "movimento" | "dinamica"; categoria: Categoria | ""; modalidade: string }
): ItemBiblioteca[] {
  return nomes
    .filter((n) => !biblioteca.some((b) => b.tipo === base.tipo && igual(b.nome, n)))
    .map((nome) => ({
      id: uid(),
      tipo: base.tipo,
      nome,
      descricao: "",
      categoria: base.tipo === "movimento" ? base.categoria || "tecnica" : "",
      objectivoIds: [],
      parentId: "",
      modalidade: base.modalidade,
    }));
}

/** Modalidades usadas (conhecidas primeiro, depois as escritas pela professora). */
export function modalidadesUsadas(turmas: { modalidade: string }[], biblioteca: { modalidade: string }[]): string[] {
  const usadas = new Set([...turmas, ...biblioteca].map((x) => x.modalidade).filter(Boolean));
  return [...MODALIDADES.map((m) => m.id).filter((id) => usadas.has(id)), ...[...usadas].filter((id) => !modalidadePorId(id)).sort()];
}

/** Modalidades escritas pela professora (para as oferecer outra vez nas escolhas). */
export function modalidadesProprias(turmas: { modalidade: string }[], biblioteca: { modalidade: string }[]): string[] {
  return modalidadesUsadas(turmas, biblioteca).filter((id) => !modalidadePorId(id));
}
