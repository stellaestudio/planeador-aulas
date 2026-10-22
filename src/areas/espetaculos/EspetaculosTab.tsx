import { useState } from "react";
import { Edit2, Plus, Theater, Trash2 } from "lucide-react";
import type { Atualizar, Dados, Espetaculo } from "../../tipos";
import { diasAte, fmtData, uid } from "../../util";
import { Card, Escolhas, Field, GhostButton, IconButton, inputClass, Pill, PrimaryButton, Vazio } from "../../ui";

export function EspetaculosTab({ dados, atualizar }: { dados: Dados; atualizar: Atualizar }) {
  const [editing, setEditing] = useState<Espetaculo | null>(null);

  const guardar = () => {
    if (!editing || !editing.nome.trim() || !editing.data) return;
    const e = { ...editing, nome: editing.nome.trim() };
    atualizar("espetaculos", (l) => (l.some((x) => x.id === e.id) ? l.map((x) => (x.id === e.id ? e : x)) : [...l, e]));
    setEditing(null);
  };

  const eliminar = (e: Espetaculo) => {
    if (confirm(`Eliminar o espetáculo "${e.nome}"?`)) atualizar("espetaculos", (l) => l.filter((x) => x.id !== e.id));
  };

  // Próximos primeiro (do mais perto para o mais longe), depois os que já passaram.
  const ordenados = [...dados.espetaculos].sort((a, b) => {
    const pa = diasAte(a.data) < 0, pb = diasAte(b.data) < 0;
    if (pa !== pb) return pa ? 1 : -1;
    return pa ? b.data.localeCompare(a.data) : a.data.localeCompare(b.data);
  });

  return (
    <div className="flex flex-col gap-3">
      {ordenados.length === 0 && !editing && <Vazio>Nenhum espetáculo marcado.</Vazio>}
      {ordenados.map((e) => {
        const dias = diasAte(e.data);
        const passado = dias < 0;
        return (
          <Card key={e.id} className={passado ? "opacity-70" : ""}>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 flex items-center gap-1.5"><Theater size={15} className="text-pink-400 shrink-0" /> {e.nome}</div>
                <div className="text-xs text-gray-500 mt-0.5">{fmtData(e.data)}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {e.turmaIds.map((tid) => {
                    const t = dados.turmas.find((x) => x.id === tid);
                    return t ? <Pill key={tid} color="pink">{t.nome}</Pill> : null;
                  })}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${passado ? "bg-gray-100 text-gray-400" : "bg-pink-400 text-white"}`}>
                  {passado ? "Já passou" : dias === 0 ? "Hoje" : `${dias} dias`}
                </span>
                <div className="flex gap-1.5">
                  <IconButton onClick={() => setEditing(e)} title="Editar"><Edit2 size={13} /></IconButton>
                  <IconButton onClick={() => eliminar(e)} perigo title="Eliminar"><Trash2 size={13} /></IconButton>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {editing && (
        <Card>
          <div className="flex flex-col gap-3">
            <Field label="Nome do espetáculo">
              <input autoFocus className={inputClass} value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder="Ex: Recital de verão" />
            </Field>
            <Field label="Data">
              <input type="date" className={inputClass} value={editing.data} onChange={(e) => setEditing({ ...editing, data: e.target.value })} />
            </Field>
            <Field label="Turmas participantes">
              <Escolhas opcoes={dados.turmas} selecionados={editing.turmaIds} onChange={(turmaIds) => setEditing({ ...editing, turmaIds })} corAtiva="bg-pink-400" vazio="Cria turmas primeiro" />
            </Field>
            <div className="flex gap-2">
              <PrimaryButton onClick={guardar} className="flex-1" disabled={!editing.nome.trim() || !editing.data}>Guardar</PrimaryButton>
              <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
            </div>
          </div>
        </Card>
      )}

      {!editing && (
        <PrimaryButton onClick={() => setEditing({ id: uid(), nome: "", data: "", turmaIds: [] })}>
          <Plus size={16} /> Novo espetáculo
        </PrimaryButton>
      )}
    </div>
  );
}
