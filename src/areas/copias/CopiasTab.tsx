import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import type { Dados } from "../../tipos";
import { hojeISO } from "../../util";
import { ficheiroCopia } from "../../dados/armazenamento";
import { normalizar, resumoDados } from "../../dados/normalizar";
import { Cabecalho, Card, GhostButton, PrimaryButton } from "../../ui";

interface Props {
  dados: Dados;
  onSubstituir: (d: Dados) => void;
  onVoltar: () => void;
}

export function CopiasTab({ dados, onSubstituir, onVoltar }: Props) {
  const ficheiroRef = useRef<HTMLInputElement>(null);
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);

  const exportar = () => {
    const blob = new Blob([ficheiroCopia(dados)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `planeador-copia-${hojeISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importar = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const novos = normalizar(JSON.parse(await f.text()));
      const aviso = `O ficheiro tem: ${resumoDados(novos)}.\n\nIsto SUBSTITUI tudo o que está agora na app (${resumoDados(dados)}).\n\nContinuar?`;
      if (!confirm(aviso)) return;
      onSubstituir(novos);
      setMensagem({ ok: true, texto: `Importado: ${resumoDados(novos)}.` });
    } catch (err) {
      setMensagem({ ok: false, texto: err instanceof SyntaxError ? "Este ficheiro não é uma cópia válida (JSON)." : (err as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Cabecalho titulo="Cópias de segurança" onVoltar={onVoltar} />

      <Card>
        <div className="text-sm font-medium text-gray-700 mb-1">Guardar uma cópia</div>
        <p className="text-xs text-gray-500 mb-3">
          Os dados ficam só neste telemóvel/computador. Descarrega uma cópia de vez em quando (por exemplo, para o Google Drive) para não perderes nada.
        </p>
        <p className="text-xs text-gray-500 mb-3">Agora: {resumoDados(dados)}.</p>
        <PrimaryButton onClick={exportar} className="w-full"><Download size={15} /> Descarregar cópia</PrimaryButton>
      </Card>

      <Card>
        <div className="text-sm font-medium text-gray-700 mb-1">Importar uma cópia</div>
        <p className="text-xs text-gray-500 mb-3">
          Serve para passar os dados para outro aparelho, recuperar uma cópia antiga ou trazer os dados do protótipo (ficheiro .json exportado de lá).
        </p>
        <input ref={ficheiroRef} type="file" accept="application/json,.json" className="hidden" onChange={importar} />
        <GhostButton onClick={() => ficheiroRef.current?.click()} className="w-full"><Upload size={15} /> Escolher ficheiro…</GhostButton>
        {mensagem && <p className={`text-xs mt-2 ${mensagem.ok ? "text-teal-700" : "text-red-500"}`}>{mensagem.texto}</p>}
      </Card>
    </div>
  );
}
