import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, Edit2, Plus, Theater, Trash2 } from "lucide-react";
import type { Atualizar, Aula, Dados } from "../../tipos";
import { fmtData } from "../../util";
import { aulasDadasDe, paraEscolha, LIMITE_POR_FAZER, nomeDoItem, proximoEspetaculo, textoContagem, ultimaAulaDada, vezesPorFazer } from "../../regras";
import { Card, GhostButton, IconButton, Pill, PrimaryButton, SeletorTurma, Vazio } from "../../ui";
import { PlanearAula } from "./PlanearAula";
import { DarAula } from "./DarAula";

interface Props {
  dados: Dados;
  atualizar: Atualizar;
  onIrParaFormacoes: (turmaId: string, coreografiaId?: string) => void;
}

export function AulasTab({ dados, atualizar, onIrParaFormacoes }: Props) {
  const [turmaId, setTurmaId] = useState(dados.turmas[0]?.id ?? "");
  const [vista, setVista] = useState<"lista" | "planear" | "dar">("lista");
  const [aulaId, setAulaId] = useState<string | null>(null);

  useEffect(() => {
    if (!dados.turmas.some((t) => t.id === turmaId) && dados.turmas.length) setTurmaId(dados.turmas[0].id);
  }, [dados.turmas, turmaId]);

  const turma = dados.turmas.find((t) => t.id === turmaId);
  if (!turma) return <Vazio>Cria uma turma ou uma aula privada primeiro, no separador Turmas.</Vazio>;

  const aula = dados.aulas.find((a) => a.id === aulaId);

  if (vista === "planear") {
    return (
      <PlanearAula
        dados={dados}
        atualizar={atualizar}
        turma={turma}
        aulaId={aulaId}
        onDone={() => setVista("lista")}
        onAbrirEditorFormacoes={onIrParaFormacoes}
      />
    );
  }

  if (vista === "dar" && aula) {
    return <DarAula dados={dados} atualizar={atualizar} aula={aula} turma={turma} onDone={() => setVista("lista")} />;
  }

  const aulasTurma = dados.aulas.filter((a) => a.turmaId === turma.id).sort((a, b) => b.data.localeCompare(a.data));
  const espetaculo = proximoEspetaculo(dados.espetaculos, turma.id);

  // Itens que ficaram por fazer em várias aulas seguidas.
  const ultima = ultimaAulaDada(dados.aulas, turma.id);
  const atrasados = ultima
    ? (["movimentos", "dinamicas"] as const).flatMap((bloco) =>
        ultima.blocos[bloco]
          .filter((i) => !i.feito)
          .map((i) => ({ nome: nomeDoItem(dados, i.itemId), vezes: vezesPorFazer(dados.aulas, turma.id, bloco, i.itemId) }))
          .filter((x) => x.vezes >= LIMITE_POR_FAZER)
      )
    : [];

  const eliminar = (a: Aula) => {
    if (confirm(`Eliminar a aula de ${fmtData(a.data)}?`)) atualizar("aulas", (l) => l.filter((x) => x.id !== a.id));
  };

  return (
    <div className="flex flex-col gap-3">
      <SeletorTurma turmas={paraEscolha(dados.turmas)} selecionada={turma.id} onChange={setTurmaId} />

      {espetaculo && (
        <Card className="bg-gradient-to-r! from-pink-100 to-purple-100 border-none! flex items-center gap-2">
          <Theater size={18} className="text-pink-500 shrink-0" />
          <div className="text-xs text-gray-700">
            <span className="font-semibold">{espetaculo.nome}</span> — {textoContagem(espetaculo)} ({fmtData(espetaculo.data)})
          </div>
        </Card>
      )}

      {turma.privada && turma.pacote && (() => {
        const dadas = aulasDadasDe(dados.aulas, turma.id);
        const faltam = turma.pacote - dadas;
        return (
          <Card className={`py-2.5! text-xs flex items-center gap-2 ${faltam <= 0 ? "bg-red-50!" : faltam <= 2 ? "bg-amber-50!" : "bg-teal-50!"}`}>
            <span className="font-semibold text-gray-700">Pacote: {dadas} de {turma.pacote} aulas dadas</span>
            <span className="text-gray-500">{faltam <= 0 ? "· pacote terminado" : faltam === 1 ? "· falta 1 aula" : `· faltam ${faltam}`}</span>
          </Card>
        );
      })()}

      {atrasados.length > 0 && (
        <Card className="bg-amber-50! border-amber-100!">
          <div className="text-xs font-medium text-amber-800 flex items-center gap-1.5 mb-1">
            <AlertTriangle size={14} /> Por fazer há {LIMITE_POR_FAZER} ou mais aulas
          </div>
          <div className="text-xs text-amber-900">{atrasados.map((x) => `${x.nome} (${x.vezes})`).join(", ")}</div>
        </Card>
      )}

      <PrimaryButton onClick={() => { setAulaId(null); setVista("planear"); }}>
        <Plus size={16} /> Planear nova aula
      </PrimaryButton>

      <div className="flex flex-col gap-2 mt-1">
        {aulasTurma.map((a) => {
          const itens = [...a.blocos.movimentos, ...a.blocos.dinamicas];
          const feitos = itens.filter((i) => i.feito).length;
          return (
            <Card key={a.id} className="flex flex-row justify-between items-center gap-2 py-3!">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800">{fmtData(a.data)}</div>
                <div className="text-xs text-gray-500 truncate">{a.objectivoDia || "Sem objetivo definido"}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Pill color={a.estado === "dada" ? "teal" : "gray"}>{a.estado === "dada" ? "Dada" : "Planeada"}</Pill>
                  {a.estado === "dada" && <span className="text-[11px] text-gray-400">{feitos}/{itens.length} feitos</span>}
                </div>
              </div>
              <div className="flex gap-1.5 items-center shrink-0">
                {a.estado === "planeada" ? (
                  <>
                    <IconButton onClick={() => eliminar(a)} perigo title="Eliminar"><Trash2 size={13} /></IconButton>
                    <IconButton onClick={() => { setAulaId(a.id); setVista("planear"); }} title="Editar plano"><Edit2 size={13} /></IconButton>
                    <PrimaryButton onClick={() => { setAulaId(a.id); setVista("dar"); }} className="px-3! py-1.5! text-xs!">Dar aula</PrimaryButton>
                  </>
                ) : (
                  <GhostButton onClick={() => { setAulaId(a.id); setVista("dar"); }}>Ver <ChevronRight size={13} /></GhostButton>
                )}
              </div>
            </Card>
          );
        })}
        {aulasTurma.length === 0 && <div className="text-center text-xs text-gray-400 py-4">Ainda sem aulas para esta turma.</div>}
      </div>
    </div>
  );
}
