import { useState } from "react";
import { MODALIDADES } from "../../modalidades";
import { inputClass } from "../../ui";

const NOVA = "__nova__";

/** Converte o texto escrito numa modalidade: se for o nome de uma conhecida, usa essa. */
function paraModalidade(texto: string): string {
  const t = texto.trim();
  return MODALIDADES.find((m) => m.nome.toLowerCase() === t.toLowerCase())?.id ?? t;
}

interface Props {
  value: string;
  onChange: (modalidade: string) => void;
  proprias: string[]; // modalidades já escritas pela professora
  semModalidade: string; // texto da opção vazia ("Sem modalidade", "Geral (todas)")
}

/** Escolha da modalidade, com a opção "Outra (define a tua)". */
export function SeletorModalidade({ value, onChange, proprias, semModalidade }: Props) {
  const conhecida = value === "" || MODALIDADES.some((m) => m.id === value) || proprias.includes(value);
  const [aEscrever, setAEscrever] = useState(!conhecida);
  const [texto, setTexto] = useState(conhecida ? "" : value);

  return (
    <div className="flex flex-col gap-2">
      <select
        className={inputClass}
        value={aEscrever ? NOVA : value}
        onChange={(e) => {
          if (e.target.value === NOVA) {
            setAEscrever(true);
            onChange(paraModalidade(texto));
          } else {
            setAEscrever(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">{semModalidade}</option>
        {MODALIDADES.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        {proprias.map((p) => <option key={p} value={p}>{p}</option>)}
        <option value={NOVA}>Outra (define a tua)…</option>
      </select>
      {aEscrever && (
        <input
          autoFocus
          className={inputClass}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            onChange(paraModalidade(e.target.value));
          }}
          placeholder="Nome da modalidade (ex.: Jazz, Sevilhanas)"
        />
      )}
    </div>
  );
}
