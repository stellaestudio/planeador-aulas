import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import type { Atualizar, Dados, Turma } from "../../tipos";
import { uid } from "../../util";
import { Card, Escolhas, Field, GhostButton, IconButton, inputClass, Pill, PrimaryButton, Vazio } from "../../ui";
import { itensDosNomes, itensEmFalta, modalidadePorId, modalidadesProprias, nomeModalidade, nomesDoTexto } from "../../modalidades";
import { SeletorModalidade } from "../comum/SeletorModalidade";

const novaTurma = (): Turma => ({
  id: uid(),
  nome: "",
  diaHora: "",
  duracaoPadrao: 60,
  aquecimentoPadraoId: "",
  alongamentoPadraoId: "",
  objectivoIds: [],
  bailarinos: [],
  modalidade: "",
});

export function TurmasTab({ dados, atualizar }: { dados: Dados; atualizar: Atualizar }) {
  const [editing, setEditing] = useState<Turma | null>(null);
  // O texto dos bailarinos fica à parte para se poder escrever linhas vazias enquanto se edita.
  const [textoBailarinos, setTextoBailarinos] = useState("");
  const [importarTipicos, setImportarTipicos] = useState(true);
  const [textoMovimentos, setTextoMovimentos] = useState(""); // movimentos de uma modalidade definida pela professora

  const aquecimentos = dados.biblioteca.filter((m) => m.categoria === "aquecimento");
  const alongamentos = dados.biblioteca.filter((m) => m.categoria === "alongamento");

  const abrir = (t: Turma) => {
    setEditing(t);
    setTextoBailarinos(t.bailarinos.join("\n"));
    setImportarTipicos(true);
    setTextoMovimentos("");
  };

  const modalidadeConhecida = editing ? modalidadePorId(editing.modalidade) : undefined;
  const emFalta = editing && modalidadeConhecida ? itensEmFalta(dados.biblioteca, editing.modalidade) : [];
  const nomesNovos = nomesDoTexto(textoMovimentos);

  const guardar = () => {
    if (!editing || !editing.nome.trim()) return;
    const t = { ...editing, nome: editing.nome.trim(), bailarinos: textoBailarinos.split("\n").map((s) => s.trim()).filter(Boolean) };

    // Itens novos para a biblioteca: os típicos da modalidade, ou os que a professora escreveu.
    const novos = modalidadeConhecida
      ? importarTipicos ? emFalta : []
      : t.modalidade ? itensDosNomes(dados.biblioteca, nomesNovos, { tipo: "movimento", categoria: "tecnica", modalidade: t.modalidade }) : [];
    if (novos.length) {
      atualizar("biblioteca", (l) => [...l, ...novos]);
      // Se a turma ainda não tem aquecimento/alongamento padrão, usa o primeiro da modalidade.
      const daModalidade = [...dados.biblioteca, ...novos].filter((m) => m.modalidade === t.modalidade);
      t.aquecimentoPadraoId ||= daModalidade.find((m) => m.categoria === "aquecimento")?.id ?? "";
      t.alongamentoPadraoId ||= daModalidade.find((m) => m.categoria === "alongamento")?.id ?? "";
    }
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
              {t.modalidade && <div className="text-xs text-pink-500 font-medium">{nomeModalidade(t.modalidade)}</div>}
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
            <Field label="Modalidade">
              <SeletorModalidade
                value={editing.modalidade}
                onChange={(modalidade) => setEditing({ ...editing, modalidade })}
                proprias={modalidadesProprias(dados.turmas, dados.biblioteca)}
                semModalidade="Sem modalidade"
              />
            </Field>
            {modalidadeConhecida && (emFalta.length > 0 ? (
              <div className="rounded-xl bg-pink-50 px-3 py-2.5 text-xs text-gray-700">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 accent-pink-500" checked={importarTipicos} onChange={(e) => setImportarTipicos(e.target.checked)} />
                  <span>Juntar à biblioteca os <strong>{emFalta.length} itens típicos</strong> de {modalidadeConhecida.nome} (movimentos, aquecimentos, alongamentos e dinâmicas).</span>
                </label>
                <details className="mt-1.5 ml-5">
                  <summary className="cursor-pointer text-pink-500">Ver a lista</summary>
                  <p className="mt-1 text-gray-500 leading-relaxed">{emFalta.map((i) => i.nome).join(" · ")}</p>
                </details>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 -mt-1">A biblioteca já tem os itens típicos de {modalidadeConhecida.nome}.</p>
            ))}
            {editing.modalidade && !modalidadeConhecida && (
              <Field label="Movimentos desta modalidade (opcional)">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={textoMovimentos}
                  onChange={(e) => setTextoMovimentos(e.target.value)}
                  placeholder={"Um por linha ou separados por vírgulas.\nEx: passo básico, giro, pose final"}
                />
                {nomesNovos.length > 0 && <span className="text-[11px] text-gray-400">{nomesNovos.length} movimentos para juntar à biblioteca</span>}
              </Field>
            )}
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
