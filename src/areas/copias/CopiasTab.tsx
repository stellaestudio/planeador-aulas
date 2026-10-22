import { useRef, useState, type ChangeEvent } from "react";
import { Download, LogOut, Upload } from "lucide-react";
import type { Dados } from "../../tipos";
import { hojeISO } from "../../util";
import { ficheiroCopia } from "../../dados/armazenamento";
import { comNovosIds, normalizar, resumoDados } from "../../dados/normalizar";
import { supabase } from "../../dados/supabase";
import { Cabecalho, Card, GhostButton, PrimaryButton } from "../../ui";

interface Props {
  dados: Dados;
  email: string;
  onSubstituir: (d: Dados) => void;
  onVoltar: () => void;
}

export function CopiasTab({ dados, email, onSubstituir, onVoltar }: Props) {
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
      const novos = comNovosIds(normalizar(JSON.parse(await f.text())));
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
      <Cabecalho titulo="Conta e cópias de segurança" onVoltar={onVoltar} />

      <Card className="flex flex-row items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-gray-500">Entraste como</div>
          <div className="text-sm font-medium text-gray-800 truncate">{email}</div>
        </div>
        <GhostButton onClick={() => confirm("Sair da conta neste aparelho?") && supabase.auth.signOut()} className="shrink-0"><LogOut size={14} /> Sair</GhostButton>
      </Card>

      <Card>
        <div className="text-sm font-medium text-gray-700 mb-1">Guardar uma cópia</div>
        <p className="text-xs text-gray-500 mb-3">
          Os dados ficam guardados na tua conta e aparecem em qualquer aparelho onde entres. Se quiseres uma cópia extra (por exemplo, para o Google Drive), descarrega-a aqui.
        </p>
        <p className="text-xs text-gray-500 mb-3">Agora: {resumoDados(dados)}.</p>
        <PrimaryButton onClick={exportar} className="w-full"><Download size={15} /> Descarregar cópia</PrimaryButton>
      </Card>

      <Card>
        <div className="text-sm font-medium text-gray-700 mb-1">Importar uma cópia</div>
        <p className="text-xs text-gray-500 mb-3">
          Serve para passar os dados para outro aparelho ou recuperar uma cópia antiga.
        </p>
        <input ref={ficheiroRef} type="file" accept="application/json,.json" className="hidden" onChange={importar} />
        <GhostButton onClick={() => ficheiroRef.current?.click()} className="w-full"><Upload size={15} /> Escolher ficheiro…</GhostButton>
        {mensagem && <p className={`text-xs mt-2 ${mensagem.ok ? "text-teal-700" : "text-red-500"}`}>{mensagem.texto}</p>}
      </Card>
    </div>
  );
}
