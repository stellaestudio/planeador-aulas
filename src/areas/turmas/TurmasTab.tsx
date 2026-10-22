import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import type { Atualizar, Dados, Turma } from "../../tipos";
import { uid } from "../../util";
import { Card, Escolhas, Field, GhostButton, IconButton, inputClass, Pill, PrimaryButton, Vazio } from "../../ui";

const novaTurma = (): Turma => ({
  id: uid(),
  nome: "",
  diaHora: "",
  duracaoPadrao: 60,
  aquecimentoPadraoId: "",
  alongamentoPadraoId: "",
  objectivoIds: [],
  bailarinos: [],
});

export function TurmasTab({ dados, atualizar }: { dados: Dados; atualizar: Atualizar }) {
  const [editing, setEditing] = useState<Turma | null>(null);
  // O texto dos bailarinos fica à parte para se poder escrever linhas vazias enquanto se edita.
  const [textoBailarinos, setTextoBailarinos] = useState("");

  const aquecimentos = dados.biblioteca.filter((m) => m.categoria === "aquecimento");
  const alongamentos = dados.biblioteca.filter((m) => m.categoria === "alongamento");

  const abrir = (t: Turma) => {
    setEditing(t);
    setTextoBailarinos(t.bailarinos.join("\n"));
  };

  const guardar = () => {
    if (!editing || !editing.nome.trim()) return;
    const t = { ...editing, nome: editing.nome.trim(), bailarinos: textoBailarinos.split("\n").map((s) => s.trim()).filter(Boolean) };
    atualizar("turmas", (l) => (l.some((x) => x.id === t.id) ? l.map((x) => (x.id === t.id ? t : x)) : [...l, t]));
    setEditing(null);
  };

  const eliminar = (t: Turma) => {
    const nAulas = dados.aulas.filter((a) => a.turmaId === t.id).length;
    const nCoreo = dados.coreografias.filter((c) => c.turmaId === t.id).length;
    const extra = nAulas || nCoreo ? `\n\nTambém vão ser eliminadas ${nAulas} aulas e ${nCoreo} coreografias desta turma.` : "";
    if (!confirm(`Eliminar a turma "${t.nome}"?${extra}`)) return;
    atualizar("turmas", (l) => l.filter((x) => x.id !== t.id));
    atualizar("aulas", (l) => l.filter((a) => a.turmaId !== t.id));
    atualizar("coreografias", (l) => l.filter((c) => c.turmaId !== t.id));
    atualizar("espetaculos", (l) => l.map((e) => ({ ...e, turmaIds: e.turmaIds.filter((x) => x !== t.id) })));
  };

  return (
    <div className="flex flex-col gap-3">
      {dados.turmas.length === 0 && !editing && <Vazio>Ainda não criaste nenhuma turma.</Vazio>}

      {dados.turmas.map((t) => (
        <Card key={t.id}>
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-gray-800">{t.nome}</div>
              {t.diaHora && <div className="text-xs text-gray-500">{t.diaHora}</div>}
              <div className="text-xs text-gray-500 mt-0.5">
                {t.duracaoPadrao} min por aula{t.bailarinos.length > 0 && ` · ${t.bailarinos.length} alunas`}
              </div>
            </div>
            <div className="flex gap-1.5">
              <IconButton onClick={() => abrir(t)} title="Editar"><Edit2 size={14} /></IconButton>
              <IconButton onClick={() => eliminar(t)} perigo title="Eliminar"><Trash2 size={14} /></IconButton>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {t.objectivoIds.map((oid) => {
              const o = dados.objectivos.find((x) => x.id === oid);
              return o ? <Pill key={oid} color="purple">{o.nome}</Pill> : null;
            })}
          </div>
        </Card>
      ))}

      {editing && (
        <Card>
          <div className="flex flex-col gap-3">
            <Field label="Nome da turma">
              <input className={inputClass} value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder="Ex: Turma juvenil" />
            </Field>
            <Field label="Dia / hora (opcional)">
              <input className={inputClass} value={editing.diaHora} onChange={(e) => setEditing({ ...editing, diaHora: e.target.value })} placeholder="Ex: Quarta 18h" />
            </Field>
            <Field label="Duração padrão da aula (min)">
              <input type="number" inputMode="numeric" className={inputClass} value={editing.duracaoPadrao} onChange={(e) => setEditing({ ...editing, duracaoPadrao: Number(e.target.value) })} />
            </Field>
            <Field label="Aquecimento padrão">
              <select className={inputClass} value={editing.aquecimentoPadraoId} onChange={(e) => setEditing({ ...editing, aquecimentoPadraoId: e.target.value })}>
                <option value="">Sem padrão</option>
                {aquecimentos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </Field>
            <Field label="Alongamento padrão">
              <select className={inputClass} value={editing.alongamentoPadraoId} onChange={(e) => setEditing({ ...editing, alongamentoPadraoId: e.target.value })}>
                <option value="">Sem padrão</option>
                {alongamentos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </Field>
            <Field label="Objetivos">
              <Escolhas
                opcoes={dados.objectivos.filter((o) => !o.arquivado || editing.objectivoIds.includes(o.id))}
                selecionados={editing.objectivoIds}
                onChange={(objectivoIds) => setEditing({ ...editing, objectivoIds })}
                vazio="Cria objetivos na Biblioteca primeiro"
              />
            </Field>
            <Field label="Bailarinos / alunas (uma por linha)">
              <textarea className={inputClass} rows={4} value={textoBailarinos} onChange={(e) => setTextoBailarinos(e.target.value)} placeholder={"Ex: Maria\nInês\nSofia"} />
            </Field>
            <div className="flex gap-2 mt-1">
              <PrimaryButton onClick={guardar} className="flex-1" disabled={!editing.nome.trim()}>Guardar</PrimaryButton>
              <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
            </div>
          </div>
        </Card>
      )}

      {!editing && (
        <PrimaryButton onClick={() => abrir(novaTurma())}>
          <Plus size={16} /> Nova turma
        </PrimaryButton>
      )}
    </div>
  );
}
