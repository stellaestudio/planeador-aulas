export const uid = () => Math.random().toString(36).slice(2, 10);

export const CORES_BAILARINO = [
  "#F472B6", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA",
  "#FB923C", "#22D3EE", "#F87171", "#4ADE80", "#C084FC",
];

export const corParaIndice = (i: number) => CORES_BAILARINO[i % CORES_BAILARINO.length];

/** Data de hoje no formato AAAA-MM-DD (hora local, não UTC). */
export function hojeISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

/** Dias entre duas datas AAAA-MM-DD (positivo se `ate` for depois de `de`). */
export function diasEntre(de: string, ate: string): number {
  const a = new Date(de + "T00:00:00");
  const b = new Date(ate + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export const diasAte = (data: string) => diasEntre(hojeISO(), data);

export function fmtData(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export const minutos = (t: string | number | undefined) => Number(t) || 0;
