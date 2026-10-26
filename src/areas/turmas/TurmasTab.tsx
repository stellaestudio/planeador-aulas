import { useState } from "react";
import { Edit2, Plus, Trash2, User, Users } from "lucide-react";
import type { Atualizar, Dados, Turma } from "../../tipos";
import { uid } from "../../util";
import { aulasDadasDe } from "../../regras";
import { Card, Escolhas, Field, GhostButton, IconButton, inputClass, Pill, PrimaryButton, Vazio } from "../../ui";
import { itensDosNomes, itensEmFalta, modalidadePorId, modalidadesProprias, nomeModalidade, nomesDoTexto } from "../../modalidades";
import { SeletorModalidade } from "../comum/SeletorModalidade";

const novaTurma = (privada = false): Turma => ({
  id: uid(),
  nome: "",
  diaHora: "",
  duracaoPadrao: 60,
  aquecimentoPadraoId: "",
  alongamentoPadraoId: "",
  objectivoIds: [],
  bailarinos: [],
  modalidade: "",
  privada,
  pacote: null,
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
    // Numa aula privada sem alunos escritos, o aluno é o próprio nome (serve para as coreografias).
    if (t.privada && !t.bailarinos.length) t.bailarinos = [t.nome.split(/[—–-]/)[0].trim()];

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
    const extra = nAulas || nCoreo ? `\n\nTambém vão ser eliminadas ${nAulas} aulas e ${nCoreo} coreografias.` : "";
    if (!confirm(`Eliminar ${t.privada ? "a aula privada" : "a turma"} "${t.nome}"?${extra}`)) return;
    atualizar("turmas", (l) => l.filter((x) => x.id !== t.id));
    atualizar("aulas", (l) => l.filter((a) => a.turmaId !== t.id));
    atualizar("coreografias", (l) => l.filter((c) => c.turmaId !== t.id));
    atualizar("espetaculos", (l) => l.map((e) => ({ ...e, turmaIds: e.turmaIds.filter((x) => x !== t.id) })));
  };

  const cartao = (t: Turma) => {
    const dadas = t.privada && t.pacote ? aulasDadasDe(dados.aulas, t.id) : 0;
    return (
      <Card key={t.id}>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-gray-800">{t.nome}</div>
            {t.modalidade && <div className="text-xs text-pink-500 font-medium">{nomeModalidade(t.modalidade)}</div>}
            {t.diaHora && <div className="text-xs text-gray-500">{t.diaHora}</div>}
            <div className="text-xs text-gray-500 mt-0.5">
              {t.duracaoPadrao} min por aula
              {!t.privada && t.bailarinos.length > 0 && ` · ${t.bailarinos.length} alunas`}
              {t.privada && t.bailarinos.length > 1 && ` · ${t.bailarinos.join(" e ")}`}
            </div>
            {t.privada && t.pacote && (
              <div className="mt-1.5"><Pill color={dadas >= t.pacote ? "red" : t.pacote - dadas <= 2 ? "amber" : "teal"}>Pacote: {dadas} de {t.pacote} aulas dadas</Pill></div>
            )}
          </div>
          <div className="flex gap-1.5">
            <IconButton onClick={() => abrir(t)} title="Editar"><Edit2 size={14} /></IconButton>
            <IconButton onClick={() => eliminar(t)} perigo title="Eliminar"><Trash2 size={14} /></IconButton>
          </div>
        </div>
        {t.objectivoIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {t.objectivoIds.map((oid) => {
              const o = dados.objectivos.find((x) => x.id === oid);
              return o ? <Pill key={oid} color="purple">{o.nome}</Pill> : null;
            })}
          </div>
        )}
      </Card>
    );
  };

  const turmas = dados.turmas.filter((t) => !t.privada);
  const privadas = dados.turmas.filter((t) => t.privada);
  const titulo = (icone: typeof Users, texto: string, n: number) => {
    const Icone = icone;
    return (
      <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 px-1 mt-1">
        <Icone size={13} /> {texto} <span className="font-normal text-gray-400">({n})</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {dados.turmas.length === 0 && !editing && <Vazio>Ainda não criaste nenhuma turma nem aula privada.</Vazio>}

      {turmas.length > 0 && titulo(Users, "Turmas", turmas.length)}
      {turmas.map(cartao)}
      {privadas.length > 0 && titulo(User, "Aulas privadas", privadas.length)}
      {privadas.map(cartao)}

      {editing && (
        <Card>
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              {editing.privada ? <><User size={15} className="text-pink-400" /> Aula privada</> : <><Users size={15} className="text-pink-400" /> Turma</>}
            </div>
            <Field label={editing.privada ? "Aluno/a ou nome da aula" : "Nome da turma"}>
              <input className={inputClass} value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} placeholder={editing.privada ? "Ex: Ana — solo de concurso" : "Ex: Turma juvenil"} />
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
            {editing.privada && (
              <Field label="Pacote de aulas (opcional)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className={inputClass}
                  value={editing.pacote ?? ""}
                  onChange={(e) => setEditing({ ...editing, pacote: e.target.value ? Math.max(1, Math.round(Number(e.target.value))) : null })}
                  placeholder="Ex: 10"
                />
                <span className="text-[11px] text-gray-400">Quantas aulas foram contratadas. A app conta as que já deu. Para renovar, aumenta o número (ex.: de 10 para 20).</span>
              </Field>
            )}
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
            <Field label={editing.privada ? "Aluno/a(s) (opcional, um por linha)" : "Bailarinos / alunas (uma por linha)"}>
              <textarea className={inputClass} rows={editing.privada ? 2 : 4} value={textoBailarinos} onChange={(e) => setTextoBailarinos(e.target.value)} placeholder={"Ex: Maria\nInês\nSofia"} />
            </Field>
            <div className="flex gap-2 mt-1">
              <PrimaryButton onClick={guardar} className="flex-1" disabled={!editing.nome.trim()}>Guardar</PrimaryButton>
              <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
            </div>
          </div>
        </Card>
      )}

      {!editing && (
        <div className="flex gap-2">
          <PrimaryButton onClick={() => abrir(novaTurma())} className="flex-1">
            <Plus size={16} /> Turma
          </PrimaryButton>
          <PrimaryButton onClick={() => abrir(novaTurma(true))} className="flex-1">
            <Plus size={16} /> Aula privada
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
