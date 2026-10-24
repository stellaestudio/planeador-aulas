import { useState } from "react";
import { BookOpen, Check, Edit2, Flame, ListPlus, Music, Plus, Sparkles, Trash2, Wind, type LucideIcon } from "lucide-react";
import type { Atualizar, Categoria, Dados, ItemBiblioteca } from "../../tipos";
import { uid } from "../../util";
import { aulasQueUsam, semItens } from "../../regras";
import { Card, Escolhas, Field, GhostButton, IconButton, inputClass, Pill, PrimaryButton, Vazio } from "../../ui";
import { itensDosNomes, itensEmFalta, MODALIDADES, modalidadesProprias, modalidadesUsadas, nomeModalidade, nomesDoTexto } from "../../modalidades";
import { SeletorModalidade } from "../comum/SeletorModalidade";

const TODAS = "*";

interface Varios {
  texto: string;
  categoria: Categoria;
  modalidade: string;
}

export const CATEGORIAS_MOV: { id: Categoria; label: string; icon: LucideIcon }[] = [
  { id: "aquecimento", label: "Aquecimento", icon: Flame },
  { id: "tecnica", label: "Técnica", icon: Sparkles },
  { id: "coreografia", label: "Coreografia", icon: Music },
  { id: "alongamento", label: "Alongamento", icon: Wind },
];

type SubTab = "movimentos" | "dinamicas" | "objetivos";

export function BibliotecaTab({ dados, atualizar }: { dados: Dados; atualizar: Atualizar }) {
  const [subTab, setSubTab] = useState<SubTab>("movimentos");
  const [editing, setEditing] = useState<ItemBiblioteca | null>(null);
  const [novoObjetivo, setNovoObjetivo] = useState<string | null>(null);
  const [filtro, setFiltro] = useState(TODAS); // modalidade a mostrar
  const [varios, setVarios] = useState<Varios | null>(null); // "Adicionar vários"
  const [aviso, setAviso] = useState<string | null>(null);

  const tipo = subTab === "dinamicas" ? "dinamica" : "movimento";
  const usadas = modalidadesUsadas(dados.turmas, dados.biblioteca);
  const proprias = modalidadesProprias(dados.turmas, dados.biblioteca);
  const haGerais = dados.biblioteca.some((m) => !m.modalidade);
  const lista = dados.biblioteca.filter((m) => m.tipo === tipo && (filtro === TODAS || m.modalidade === filtro));
  const pais = lista.filter((m) => !m.parentId || !lista.some((p) => p.id === m.parentId));
  const modalidadeNova = filtro === TODAS ? "" : filtro;
  const objetivosAtivos = dados.objectivos.filter((o) => !o.arquivado || editing?.objectivoIds.includes(o.id));

  const mudarSubTab = (s: SubTab) => {
    setSubTab(s);
    setEditing(null);
    setVarios(null);
    setAviso(null);
  };

  const guardarVarios = () => {
    if (!varios) return;
    const nomes = nomesDoTexto(varios.texto);
    const novos = itensDosNomes(dados.biblioteca, nomes, { tipo, categoria: varios.categoria, modalidade: varios.modalidade });
    if (novos.length) atualizar("biblioteca", (l) => [...l, ...novos]);
    const repetidos = nomes.length - novos.length;
    setAviso(`${novos.length} adicionados${repetidos ? ` (${repetidos} já existiam)` : ""}.`);
    setVarios(null);
  };

  const juntarTipicos = (modalidadeId: string) => {
    const novos = itensEmFalta(dados.biblioteca, modalidadeId);
    if (novos.length) atualizar("biblioteca", (l) => [...l, ...novos]);
    setAviso(`${nomeModalidade(modalidadeId)}: ${novos.length} itens adicionados.`);
    setFiltro(modalidadeId);
  };

  const novoItem = (parent?: ItemBiblioteca): ItemBiblioteca => ({
    id: uid(),
    tipo,
    nome: "",
    descricao: "",
    categoria: parent ? parent.categoria : tipo === "movimento" ? "tecnica" : "",
    objectivoIds: [],
    parentId: parent?.id ?? "",
    modalidade: parent ? parent.modalidade : modalidadeNova,
  });

  const guardar = () => {
    if (!editing || !editing.nome.trim()) return;
    const item = { ...editing, nome: editing.nome.trim() };
    atualizar("biblioteca", (l) => (l.some((m) => m.id === item.id) ? l.map((m) => (m.id === item.id ? item : m)) : [...l, item]));
    // As variações seguem a categoria e a modalidade do item pai.
    if (!item.parentId) {
      atualizar("biblioteca", (l) => l.map((m) => (m.parentId === item.id ? { ...m, categoria: item.categoria, modalidade: item.modalidade } : m)));
    }
    setEditing(null);
  };

  const eliminar = (m: ItemBiblioteca) => {
    const afetados = [m.id, ...dados.biblioteca.filter((v) => v.parentId === m.id).map((v) => v.id)];
    const nVar = afetados.length - 1;
    const nAulas = aulasQueUsam(dados.aulas, afetados);
    const partes = [`Eliminar "${m.nome}"?`];
    if (nVar) partes.push(`As ${nVar} variações também são eliminadas.`);
    if (nAulas) partes.push(`É usado em ${nAulas} aulas e vai sair desses planos.`);
    if (!confirm(partes.join("\n\n"))) return;
    atualizar("biblioteca", (l) => l.filter((x) => !afetados.includes(x.id)));
    atualizar("aulas", (l) => l.map((a) => semItens(a, afetados)));
    atualizar("turmas", (l) =>
      l.map((t) => ({
        ...t,
        aquecimentoPadraoId: afetados.includes(t.aquecimentoPadraoId) ? "" : t.aquecimentoPadraoId,
        alongamentoPadraoId: afetados.includes(t.alongamentoPadraoId) ? "" : t.alongamentoPadraoId,
      }))
    );
  };

  const adicionarObjetivo = () => {
    const nome = novoObjetivo?.trim();
    if (!nome) return;
    atualizar("objectivos", (o) => [...o, { id: uid(), nome, arquivado: false }]);
    setNovoObjetivo(null);
  };

  const eliminarObjetivo = (id: string, nome: string) => {
    if (!confirm(`Eliminar o objetivo "${nome}"? Sai das turmas e dos itens onde está.`)) return;
    atualizar("objectivos", (l) => l.filter((x) => x.id !== id));
    atualizar("turmas", (l) => l.map((t) => ({ ...t, objectivoIds: t.objectivoIds.filter((x) => x !== id) })));
    atualizar("biblioteca", (l) => l.map((m) => ({ ...m, objectivoIds: m.objectivoIds.filter((x) => x !== id) })));
  };

  const alternarArquivo = (id: string) =>
    atualizar("objectivos", (l) => l.map((o) => (o.id === id ? { ...o, arquivado: !o.arquivado } : o)));

  const botaoSub = (s: SubTab, label: string, cor: string) => (
    <button type="button" onClick={() => mudarSubTab(s)} className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 ${subTab === s ? `${cor} text-white` : "bg-white text-gray-500"}`}>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {botaoSub("movimentos", "Movimentos", "bg-teal-400")}
        {botaoSub("dinamicas", "Dinâmicas / jogos", "bg-orange-400")}
        {botaoSub("objetivos", "Objetivos", "bg-purple-400")}
      </div>

      {subTab === "objetivos" ? (
        <div className="flex flex-col gap-2">
          {[...dados.objectivos].sort((a, b) => Number(a.arquivado) - Number(b.arquivado)).map((o) => (
            <Card key={o.id} className="flex flex-row items-center justify-between gap-2 py-2.5!">
              <span className={`text-sm ${o.arquivado ? "text-gray-400 line-through" : "text-gray-700"}`}>{o.nome}</span>
              <div className="flex gap-1.5">
                <GhostButton onClick={() => alternarArquivo(o.id)} className="py-1! text-xs!">{o.arquivado ? "Reativar" : "Arquivar"}</GhostButton>
                <IconButton onClick={() => eliminarObjetivo(o.id, o.nome)} perigo title="Eliminar"><Trash2 size={13} /></IconButton>
              </div>
            </Card>
          ))}
          {dados.objectivos.length === 0 && <Vazio>Ainda não há objetivos.</Vazio>}
          {novoObjetivo !== null ? (
            <Card>
              <div className="flex gap-2">
                <input
                  autoFocus
                  className={inputClass}
                  value={novoObjetivo}
                  onChange={(e) => setNovoObjetivo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && adicionarObjetivo()}
                  placeholder="Ex: Melhorar equilíbrio"
                />
                <PrimaryButton onClick={adicionarObjetivo} title="Adicionar"><Check size={16} /></PrimaryButton>
              </div>
            </Card>
          ) : (
            <PrimaryButton onClick={() => setNovoObjetivo("")}><Plus size={16} /> Novo objetivo</PrimaryButton>
          )}
          <p className="text-[11px] text-gray-400 px-1">Um objetivo arquivado deixa de aparecer nas escolhas, mas continua nas turmas e itens onde já estava.</p>
        </div>
      ) : (
        <>
          {(usadas.length > 0 || filtro !== TODAS) && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mt-1">
              {[TODAS, ...usadas, ...(haGerais && usadas.length ? [""] : [])].map((m) => (
                <button
                  key={m || "geral"}
                  type="button"
                  onClick={() => setFiltro(m)}
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border ${filtro === m ? "bg-pink-400 text-white border-pink-400" : "bg-white/70 text-gray-500 border-white"}`}
                >
                  {m === TODAS ? "Todas" : m === "" ? "Gerais" : nomeModalidade(m)}
                </button>
              ))}
            </div>
          )}

          {aviso && <div className="text-xs text-teal-800 bg-teal-50 rounded-lg px-3 py-2">{aviso}</div>}

          {pais.length === 0 && !editing && !varios && (
            <Vazio>{filtro === TODAS ? "Biblioteca vazia. Adiciona o primeiro item ou junta uma biblioteca típica (mais abaixo)." : "Nada nesta modalidade."}</Vazio>
          )}

          {(tipo === "movimento" ? CATEGORIAS_MOV.map((c) => c.id) : [""]).map((cat) => {
            const doGrupo = pais.filter((m) => (tipo === "movimento" ? (m.categoria || "tecnica") === cat : true));
            if (!doGrupo.length) return null;
            const info = CATEGORIAS_MOV.find((c) => c.id === cat);
            return (
              <div key={cat || "dinamicas"} className="flex flex-col gap-2">
                {info && (
                  <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 px-1 mt-1">
                    <info.icon size={13} /> {info.label} <span className="font-normal text-gray-400">({doGrupo.length})</span>
                  </div>
                )}
                {doGrupo.map((m) => {
                  const variacoes = lista.filter((v) => v.parentId === m.id);
                  return (
                    <Card key={m.id} className="py-3!">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800 text-sm">{m.nome}</div>
                          {m.descricao && <div className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{m.descricao}</div>}
                          {(m.objectivoIds.length > 0 || (filtro === TODAS && m.modalidade)) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {filtro === TODAS && m.modalidade && <Pill color="pink">{nomeModalidade(m.modalidade)}</Pill>}
                              {m.objectivoIds.map((oid) => {
                                const o = dados.objectivos.find((x) => x.id === oid);
                                return o ? <Pill key={oid} color="purple">{o.nome}</Pill> : null;
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <IconButton onClick={() => setEditing(m)} title="Editar"><Edit2 size={13} /></IconButton>
                          <IconButton onClick={() => eliminar(m)} perigo title="Eliminar"><Trash2 size={13} /></IconButton>
                        </div>
                      </div>
                      {variacoes.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-gray-100 flex flex-col gap-1.5">
                          {variacoes.map((v) => (
                            <div key={v.id} className="flex justify-between items-center gap-2">
                              <span className="text-xs text-gray-600">↳ {v.nome}</span>
                              <div className="flex gap-1">
                                <IconButton onClick={() => setEditing(v)} title="Editar variação" className="p-1!"><Edit2 size={11} /></IconButton>
                                <IconButton onClick={() => eliminar(v)} perigo title="Eliminar variação" className="p-1!"><Trash2 size={11} /></IconButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => setEditing(novoItem(m))} className="text-xs text-pink-500 font-medium mt-1.5 flex items-center gap-1">
                        <Plus size={12} /> Adicionar variação
                      </button>
                    </Card>
                  );
                })}
              </div>
            );
          })}

          {editing && (
            <Card>
              <div className="flex flex-col gap-3">
                {editing.parentId && <div className="text-xs text-gray-500">Variação de: {lista.find((x) => x.id === editing.parentId)?.nome}</div>}
                <Field label="Nome">
                  <input autoFocus className={inputClass} value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
                </Field>
                <Field label="Descrição (opcional)">
                  <textarea className={inputClass} rows={2} value={editing.descricao} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} />
                </Field>
                {!editing.parentId && (
                  <Field label="Modalidade">
                    <SeletorModalidade value={editing.modalidade} onChange={(modalidade) => setEditing({ ...editing, modalidade })} proprias={proprias} semModalidade="Geral (todas as modalidades)" />
                  </Field>
                )}
                {subTab === "movimentos" && !editing.parentId && (
                  <Field label="Categoria">
                    <select className={inputClass} value={editing.categoria} onChange={(e) => setEditing({ ...editing, categoria: e.target.value as Categoria })}>
                      {CATEGORIAS_MOV.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Objetivos">
                  <Escolhas opcoes={objetivosAtivos} selecionados={editing.objectivoIds} onChange={(objectivoIds) => setEditing({ ...editing, objectivoIds })} vazio="Ainda não há objetivos" />
                </Field>
                <div className="flex gap-2">
                  <PrimaryButton onClick={guardar} className="flex-1" disabled={!editing.nome.trim()}>Guardar</PrimaryButton>
                  <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
                </div>
              </div>
            </Card>
          )}

          {varios && (
            <Card>
              <div className="flex flex-col gap-3">
                <Field label={subTab === "movimentos" ? "Movimentos" : "Dinâmicas"}>
                  <textarea
                    autoFocus
                    className={inputClass}
                    rows={5}
                    value={varios.texto}
                    onChange={(e) => setVarios({ ...varios, texto: e.target.value })}
                    placeholder={"Um por linha ou separados por vírgulas.\nEx: plié, tendu, jeté"}
                  />
                  <span className="text-[11px] text-gray-400">{nomesDoTexto(varios.texto).length} para adicionar</span>
                </Field>
                <Field label="Modalidade">
                  <SeletorModalidade value={varios.modalidade} onChange={(modalidade) => setVarios({ ...varios, modalidade })} proprias={proprias} semModalidade="Geral (todas as modalidades)" />
                </Field>
                {subTab === "movimentos" && (
                  <Field label="Categoria">
                    <select className={inputClass} value={varios.categoria} onChange={(e) => setVarios({ ...varios, categoria: e.target.value as Categoria })}>
                      {CATEGORIAS_MOV.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Field>
                )}
                <div className="flex gap-2">
                  <PrimaryButton onClick={guardarVarios} className="flex-1" disabled={!nomesDoTexto(varios.texto).length}>Adicionar</PrimaryButton>
                  <GhostButton onClick={() => setVarios(null)}>Cancelar</GhostButton>
                </div>
              </div>
            </Card>
          )}

          {!editing && !varios && (
            <div className="flex gap-2">
              <PrimaryButton onClick={() => { setAviso(null); setEditing(novoItem()); }} className="flex-1">
                <Plus size={16} /> {subTab === "movimentos" ? "Novo movimento" : "Nova dinâmica"}
              </PrimaryButton>
              <GhostButton onClick={() => { setAviso(null); setVarios({ texto: "", categoria: "tecnica", modalidade: modalidadeNova }); }} className="shrink-0">
                <ListPlus size={15} /> Vários
              </GhostButton>
            </div>
          )}

          <Card className="mt-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1"><BookOpen size={15} className="text-pink-400" /> Bibliotecas típicas</div>
            <p className="text-xs text-gray-500 mb-2">Junta os movimentos, aquecimentos, alongamentos e dinâmicas típicos de uma modalidade. Os que já tens não são repetidos.</p>
            <div className="flex flex-col gap-1.5">
              {MODALIDADES.map((m) => {
                const n = itensEmFalta(dados.biblioteca, m.id).length;
                return (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700">{m.nome}</span>
                    {n ? (
                      <GhostButton onClick={() => juntarTipicos(m.id)} className="py-1! text-xs!"><Plus size={12} /> Juntar {n}</GhostButton>
                    ) : (
                      <span className="text-xs text-teal-600 flex items-center gap-1"><Check size={13} /> Já tens</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
