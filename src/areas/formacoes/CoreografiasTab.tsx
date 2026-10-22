import { useEffect, useState } from "react";
import { ChevronRight, Music, Plus } from "lucide-react";
import type { Atualizar, Coreografia, Dados, Turma } from "../../tipos";
import { corParaIndice, uid } from "../../util";
import { Card, Field, GhostButton, inputClass, PrimaryButton, SeletorTurma, Vazio } from "../../ui";
import { CoreografiaEditor } from "./CoreografiaEditor";

export interface Salto {
  turmaId: string;
  coreografiaId?: string;
}

const novaCoreografia = (turma: Turma, nome: string): Coreografia => ({
  id: uid(),
  turmaId: turma.id,
  nome,
  bailarinos: turma.bailarinos.map((n, i) => ({ id: uid(), nome: n, cor: corParaIndice(i) })),
  formacoes: [],
});

interface Props {
  dados: Dados;
  atualizar: Atualizar;
  salto: Salto | null;
  onSaltoUsado: () => void;
}

export function CoreografiasTab({ dados, atualizar, salto, onSaltoUsado }: Props) {
  const [turmaId, setTurmaId] = useState(dados.turmas[0]?.id ?? "");
  const [ativaId, setAtivaId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState<string | null>(null);

  useEffect(() => {
    if (!salto) return;
    setTurmaId(salto.turmaId);
    setAtivaId(salto.coreografiaId ?? null);
    onSaltoUsado();
  }, [salto, onSaltoUsado]);

  useEffect(() => {
    if (!dados.turmas.some((t) => t.id === turmaId) && dados.turmas.length) setTurmaId(dados.turmas[0].id);
  }, [dados.turmas, turmaId]);

  const turma = dados.turmas.find((t) => t.id === turmaId);
  if (!turma) return <Vazio>Cria uma turma primeiro no separador Turmas.</Vazio>;

  const ativa = dados.coreografias.find((c) => c.id === ativaId);
  if (ativa) {
    return (
      <CoreografiaEditor
        coreografia={ativa}
        onChange={(c) => atualizar("coreografias", (l) => l.map((x) => (x.id === c.id ? c : x)))}
        onVoltar={() => setAtivaId(null)}
        onEliminar={() => {
          if (!confirm(`Eliminar a coreografia "${ativa.nome}" e todas as formações?`)) return;
          atualizar("coreografias", (l) => l.filter((c) => c.id !== ativa.id));
          atualizar("aulas", (l) =>
            l.map((a) => (a.blocos.coreografia.coreografiaId === ativa.id ? { ...a, blocos: { ...a.blocos, coreografia: { coreografiaId: "", tempo: a.blocos.coreografia.tempo } } } : a))
          );
          setAtivaId(null);
        }}
      />
    );
  }

  const criar = () => {
    const nome = novoNome?.trim();
    if (!nome) return;
    const c = novaCoreografia(turma, nome);
    atualizar("coreografias", (l) => [...l, c]);
    setNovoNome(null);
    setAtivaId(c.id);
  };

  const daTurma = dados.coreografias.filter((c) => c.turmaId === turma.id);

  return (
    <div className="flex flex-col gap-3">
      <SeletorTurma turmas={dados.turmas} selecionada={turma.id} onChange={setTurmaId} corAtiva="bg-purple-400" />

      {daTurma.map((c) => (
        <Card key={c.id} className="flex flex-row justify-between items-center gap-2 py-3!">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Music size={14} className="text-purple-400 shrink-0" /> {c.nome}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.formacoes.length} formações · {c.bailarinos.length} bailarinos</div>
          </div>
          <GhostButton onClick={() => setAtivaId(c.id)}>Editar <ChevronRight size={13} /></GhostButton>
        </Card>
      ))}
      {daTurma.length === 0 && novoNome === null && <div className="text-center text-xs text-gray-400 py-4">Ainda sem coreografias para esta turma.</div>}

      {novoNome !== null ? (
        <Card>
          <Field label="Nome da coreografia">
            <input autoFocus className={inputClass} value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && criar()} placeholder="Ex: Coreografia final" />
          </Field>
          <p className="text-[11px] text-gray-400 mt-1.5">Os bailarinos são copiados da turma ({turma.bailarinos.length}).</p>
          <div className="flex gap-2 mt-2">
            <PrimaryButton onClick={criar} className="flex-1" disabled={!novoNome.trim()}>Criar</PrimaryButton>
            <GhostButton onClick={() => setNovoNome(null)}>Cancelar</GhostButton>
          </div>
        </Card>
      ) : (
        <PrimaryButton onClick={() => setNovoNome("")}><Plus size={16} /> Nova coreografia</PrimaryButton>
      )}
    </div>
  );
}
