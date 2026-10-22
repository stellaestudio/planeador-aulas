import { AlertTriangle } from "lucide-react";
import { LIMITE_POR_FAZER } from "../../regras";
import { Pill } from "../../ui";

/** Mostra há quantas aulas seguidas um item está por fazer; destaca a partir do limite. */
export function EtiquetaPorFazer({ vezes }: { vezes: number }) {
  if (vezes <= 0) return null;
  const texto = vezes === 1 ? "por fazer desde a última aula" : `por fazer há ${vezes} aulas`;
  if (vezes < LIMITE_POR_FAZER) return <Pill color="gray" className="py-0.5! text-[10px]!">{texto}</Pill>;
  return (
    <Pill color="amber" className="py-0.5! text-[10px]! gap-1">
      <AlertTriangle size={10} /> {texto}
    </Pill>
  );
}
