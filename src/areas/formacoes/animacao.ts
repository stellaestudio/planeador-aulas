// Cálculo da animação das formações ao longo do tempo (com ou sem música).
import type { Formacao } from "../../tipos";

/** Sem momento definido, cada formação dura este tempo a seguir à anterior. */
export const DURACAO_SEM_MUSICA = 4;

/** Segundo em que cada formação começa (o definido, ou a seguir à anterior). */
export function inicios(formacoes: Formacao[]): number[] {
  const r: number[] = [];
  formacoes.forEach((f, i) => {
    const anterior = i === 0 ? null : r[i - 1];
    r.push(f.inicio ?? (anterior === null ? 0 : anterior + DURACAO_SEM_MUSICA));
  });
  return r;
}

/** Duração total da animação: até ao fim da música, ou um pouco depois da última formação. */
export function duracaoTotal(formacoes: Formacao[], duracaoMusica?: number): number {
  if (duracaoMusica && isFinite(duracaoMusica)) return duracaoMusica;
  const ini = inicios(formacoes);
  const ultima = formacoes[formacoes.length - 1];
  return ultima ? ini[ini.length - 1] + ultima.transicao + DURACAO_SEM_MUSICA : 0;
}

export interface Ponto {
  bailarinoId: string;
  x: number;
  y: number;
  opacidade: number;
}

const suave = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

/** Índice da formação em vigor no segundo t. */
export function formacaoEm(formacoes: Formacao[], t: number): number {
  const ini = inicios(formacoes);
  let k = 0;
  ini.forEach((s, i) => {
    if (s <= t) k = i;
  });
  return k;
}

/**
 * Onde está cada bailarino no segundo t. Durante a transição deslizam da formação anterior
 * para a atual; quem entra aparece aos poucos e quem sai desaparece aos poucos.
 */
export function posicoesEm(formacoes: Formacao[], t: number): Ponto[] {
  if (!formacoes.length) return [];
  const ini = inicios(formacoes);
  const k = formacaoEm(formacoes, t);
  const atual = formacoes[k];
  const anterior = k > 0 ? formacoes[k - 1] : null;
  const dur = atual.transicao;
  const p = !anterior || dur <= 0 ? 1 : Math.min(1, Math.max(0, (t - ini[k]) / dur));
  const e = suave(p);

  const pontos: Ponto[] = atual.posicoes.map((pos) => {
    const antes = anterior?.posicoes.find((a) => a.bailarinoId === pos.bailarinoId);
    if (!antes) return { ...pos, opacidade: anterior ? e : 1 };
    return { bailarinoId: pos.bailarinoId, x: antes.x + (pos.x - antes.x) * e, y: antes.y + (pos.y - antes.y) * e, opacidade: 1 };
  });
  if (anterior && p < 1) {
    for (const a of anterior.posicoes) {
      if (!atual.posicoes.some((pos) => pos.bailarinoId === a.bailarinoId)) pontos.push({ ...a, opacidade: 1 - e });
    }
  }
  return pontos;
}

export function fmtTempo(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Lê "1:05", "65" ou "1:05.5" em segundos; vazio → null. */
export function lerTempo(texto: string): number | null | undefined {
  const t = texto.trim().replace(",", ".");
  if (!t) return null;
  const m = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(t);
  if (!m) return undefined; // inválido
  return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]);
}
