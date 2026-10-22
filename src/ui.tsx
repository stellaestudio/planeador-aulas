// Peças pequenas de interface usadas em todos os ecrãs.
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

type Cor = "purple" | "teal" | "coral" | "pink" | "gray" | "amber" | "red";

const PILL: Record<Cor, string> = {
  purple: "bg-purple-100 text-purple-800",
  teal: "bg-teal-100 text-teal-800",
  coral: "bg-orange-100 text-orange-800",
  pink: "bg-pink-100 text-pink-800",
  gray: "bg-gray-100 text-gray-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
};

export function Pill({ children, color = "gray", className = "" }: { children: ReactNode; color?: Cor; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PILL[color]} ${className}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-white p-4 ${className}`}>{children}</div>;
}

interface BotaoProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}

export function PrimaryButton({ children, onClick, className = "", disabled, title }: BotaoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`bg-gradient-to-r from-orange-400 to-pink-400 text-white font-medium rounded-full px-4 py-2.5 shadow-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 flex items-center justify-center gap-1.5 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "", disabled, title }: BotaoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-1 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/** Botão redondo só com ícone (editar, apagar, setas…). */
export function IconButton({ children, onClick, perigo, title, className = "" }: BotaoProps & { perigo?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-full shrink-0 ${perigo ? "bg-red-50 text-red-400" : "bg-gray-100 text-gray-500"} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  );
}

export const inputClass =
  "rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 w-full";

/** Escolha múltipla em "pills" (objetivos, turmas…). */
export function Escolhas({
  opcoes,
  selecionados,
  onChange,
  corAtiva = "bg-purple-400",
  vazio,
}: {
  opcoes: { id: string; nome: string }[];
  selecionados: string[];
  onChange: (ids: string[]) => void;
  corAtiva?: string;
  vazio?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => {
        const ativo = selecionados.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(ativo ? selecionados.filter((x) => x !== o.id) : [...selecionados, o.id])}
            className={`px-2.5 py-1 rounded-full text-xs ${ativo ? `${corAtiva} text-white` : "bg-gray-100 text-gray-500"}`}
          >
            {o.nome}
          </button>
        );
      })}
      {opcoes.length === 0 && vazio && <span className="text-xs text-gray-400">{vazio}</span>}
    </div>
  );
}

/** Fila de pills para escolher uma turma. */
export function SeletorTurma({
  turmas,
  selecionada,
  onChange,
  corAtiva = "bg-pink-400",
}: {
  turmas: { id: string; nome: string }[];
  selecionada: string;
  onChange: (id: string) => void;
  corAtiva?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {turmas.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${t.id === selecionada ? `${corAtiva} text-white` : "bg-white text-gray-500"}`}
        >
          {t.nome}
        </button>
      ))}
    </div>
  );
}

export function Cabecalho({ titulo, onVoltar, children }: { titulo: ReactNode; onVoltar: () => void; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <IconButton onClick={onVoltar} title="Voltar">
        <ChevronLeft size={16} />
      </IconButton>
      <div className="text-sm font-semibold text-gray-800 flex-1 min-w-0">{titulo}</div>
      {children}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <Card className="text-center text-sm text-gray-500 py-8">{children}</Card>;
}
