import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Download, Eye, EyeOff, Grid3x3, Plus, Printer, Trash2, Users, X } from "lucide-react";
import type { Coreografia, Formacao } from "../../tipos";
import { CORES_BAILARINO, corParaIndice, uid } from "../../util";
import { Cabecalho, Card, GhostButton, IconButton, inputClass, PrimaryButton } from "../../ui";
import { exportarPng, PalcoEditor, PalcoEstatico } from "./Palco";

interface Props {
  coreografia: Coreografia;
  onChange: (c: Coreografia) => void;
  onVoltar: () => void;
  onEliminar: () => void;
}

export function CoreografiaEditor({ coreografia, onChange, onVoltar, onEliminar }: Props) {
  const [ativaId, setAtivaId] = useState<string | null>(coreografia.formacoes[0]?.id ?? null);
  const [trajetorias, setTrajetorias] = useState(true);
  const [grelha, setGrelha] = useState(false);
  const [verBailarinos, setVerBailarinos] = useState(false);
  const [aImprimir, setAImprimir] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const formacoes = coreografia.formacoes;
  const idx = formacoes.findIndex((f) => f.id === ativaId);
  const ativa = formacoes[idx] as Formacao | undefined;
  const anterior = idx > 0 ? formacoes[idx - 1] : undefined;

  useEffect(() => {
    if (!aImprimir) return;
    document.body.classList.add("a-imprimir");
    const t = setTimeout(() => window.print(), 300);
    return () => {
      clearTimeout(t);
      document.body.classList.remove("a-imprimir");
    };
  }, [aImprimir]);

  const mudarFormacoes = (fs: Formacao[]) => onChange({ ...coreografia, formacoes: fs });
  const mudarAtiva = (patch: Partial<Formacao>) => ativa && mudarFormacoes(formacoes.map((f) => (f.id === ativa.id ? { ...f, ...patch } : f)));

  const addBailarino = () =>
    onChange({ ...coreografia, bailarinos: [...coreografia.bailarinos, { id: uid(), nome: "Novo bailarino", cor: corParaIndice(coreografia.bailarinos.length) }] });
  const updateBailarino = (id: string, patch: { nome?: string; cor?: string }) =>
    onChange({ ...coreografia, bailarinos: coreografia.bailarinos.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  const removeBailarino = (id: string, nome: string) => {
    if (!confirm(`Tirar "${nome}" da coreografia? Sai de todas as formações.`)) return;
    onChange({
      ...coreografia,
      bailarinos: coreografia.bailarinos.filter((b) => b.id !== id),
      formacoes: formacoes.map((f) => ({ ...f, posicoes: f.posicoes.filter((p) => p.bailarinoId !== id) })),
    });
  };

  const addFormacao = (copiarAtual: boolean) => {
    const nova: Formacao = {
      id: uid(),
      nome: `Formação ${formacoes.length + 1}`,
      notas: "",
      posicoes: copiarAtual && ativa ? ativa.posicoes.map((p) => ({ ...p })) : [],
    };
    // A nova formação entra logo a seguir à atual.
    const pos = copiarAtual && idx >= 0 ? idx + 1 : formacoes.length;
    mudarFormacoes([...formacoes.slice(0, pos), nova, ...formacoes.slice(pos)]);
    setAtivaId(nova.id);
  };
  const deleteFormacao = (f: Formacao) => {
    if (!confirm(`Eliminar "${f.nome}"?`)) return;
    const resto = formacoes.filter((x) => x.id !== f.id);
    mudarFormacoes(resto);
    setAtivaId(resto[Math.max(0, idx - 1)]?.id ?? null);
  };
  const moveFormacao = (dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= formacoes.length) return;
    const arr = [...formacoes];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    mudarFormacoes(arr);
  };

  const foraDoPalco = ativa ? coreografia.bailarinos.filter((b) => !ativa.posicoes.some((p) => p.bailarinoId === b.id)) : [];

  const colocarNoPalco = (bailarinoId: string) => {
    if (!ativa) return;
    const n = ativa.posicoes.length;
    mudarAtiva({ posicoes: [...ativa.posicoes, { bailarinoId, x: 20 + (n % 5) * 15, y: 20 + (Math.floor(n / 5) % 5) * 15 }] });
  };
  const tirarDoPalco = (bailarinoId: string) => ativa && mudarAtiva({ posicoes: ativa.posicoes.filter((p) => p.bailarinoId !== bailarinoId) });
  const mover = (bailarinoId: string, x: number, y: number) =>
    ativa && mudarAtiva({ posicoes: ativa.posicoes.map((p) => (p.bailarinoId === bailarinoId ? { ...p, x, y } : p)) });

  const corDe = (id: string) => coreografia.bailarinos.find((b) => b.id === id)?.cor ?? "#999";
  const nomeDe = (id: string) => coreografia.bailarinos.find((b) => b.id === id)?.nome ?? "?";

  return (
    <div className="flex flex-col gap-3">
      <Cabecalho
        titulo={
          <input value={coreografia.nome} onChange={(e) => onChange({ ...coreografia, nome: e.target.value })} className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full" aria-label="Nome da coreografia" />
        }
        onVoltar={onVoltar}
      >
        <IconButton onClick={onEliminar} perigo title="Eliminar coreografia"><Trash2 size={14} /></IconButton>
      </Cabecalho>

      <Card>
        <button type="button" onClick={() => setVerBailarinos((v) => !v)} className="flex items-center justify-between w-full text-sm font-medium text-gray-700">
          <span className="flex items-center gap-1.5"><Users size={15} className="text-purple-500" /> Bailarinos ({coreografia.bailarinos.length})</span>
          {verBailarinos ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {verBailarinos && (
          <div className="mt-2 flex flex-col gap-1.5">
            {coreografia.bailarinos.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateBailarino(b.id, { cor: corParaIndice(CORES_BAILARINO.indexOf(b.cor) + 1) })}
                  className="w-6 h-6 rounded-full shrink-0 border-2 border-white shadow"
                  style={{ background: b.cor }}
                  title="Trocar cor"
                  aria-label="Trocar cor"
                />
                <input className="flex-1 text-xs bg-gray-50 rounded-lg px-2 py-1.5 min-w-0" value={b.nome} onChange={(e) => updateBailarino(b.id, { nome: e.target.value })} />
                <IconButton onClick={() => removeBailarino(b.id, b.nome)} perigo title="Remover" className="p-1!"><Trash2 size={12} /></IconButton>
              </div>
            ))}
            <GhostButton onClick={addBailarino} className="mt-1"><Plus size={13} /> Adicionar bailarino</GhostButton>
          </div>
        )}
      </Card>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {formacoes.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setAtivaId(f.id)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${f.id === ativaId ? "bg-purple-400 text-white" : "bg-white text-gray-500"}`}
          >
            {i + 1}. {f.nome}
          </button>
        ))}
        {formacoes.length > 0 && (
          <button type="button" onClick={() => addFormacao(true)} className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-purple-100 text-purple-500 flex items-center gap-1">
            <Plus size={12} /> A partir da atual
          </button>
        )}
      </div>
      {formacoes.length === 0 && <PrimaryButton onClick={() => addFormacao(false)}><Plus size={16} /> Criar primeira formação</PrimaryButton>}

      {ativa && (
        <>
          <Card>
            <div className="flex items-center gap-1.5 mb-2">
              <input className="flex-1 min-w-0 text-sm font-medium bg-gray-50 rounded-lg px-2 py-1.5" value={ativa.nome} onChange={(e) => mudarAtiva({ nome: e.target.value })} aria-label="Nome da formação" />
              <IconButton onClick={() => moveFormacao(-1)} title="Mover para trás"><ArrowUp size={13} /></IconButton>
              <IconButton onClick={() => moveFormacao(1)} title="Mover para a frente"><ArrowDown size={13} /></IconButton>
              <IconButton onClick={() => deleteFormacao(ativa)} perigo title="Eliminar formação"><Trash2 size={13} /></IconButton>
            </div>

            <div className="flex gap-1.5 mb-2">
              <button type="button" onClick={() => setTrajetorias((v) => !v)} className={`text-[11px] px-2 py-1 rounded-full flex items-center gap-1 ${trajetorias ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"}`}>
                {trajetorias ? <Eye size={12} /> : <EyeOff size={12} />} Trajetórias
              </button>
              <button type="button" onClick={() => setGrelha((v) => !v)} className={`text-[11px] px-2 py-1 rounded-full flex items-center gap-1 ${grelha ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"}`}>
                <Grid3x3 size={12} /> Grelha
              </button>
            </div>

            <div className="text-center text-[10px] text-gray-400 mb-1 tracking-wide">FUNDO DO PALCO</div>
            <PalcoEditor
              svgRef={svgRef}
              posicoes={ativa.posicoes}
              posicoesAnteriores={anterior?.posicoes ?? []}
              showTrajetorias={trajetorias}
              showGrid={grelha}
              corDe={corDe}
              nomeDe={nomeDe}
              onMover={mover}
            />
            <div className="text-center text-[10px] text-gray-400 mt-1 tracking-wide">PÚBLICO</div>

            {foraDoPalco.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1.5">Por colocar em palco:</div>
                <div className="flex flex-wrap gap-1.5">
                  {foraDoPalco.map((b) => (
                    <button key={b.id} type="button" onClick={() => colocarNoPalco(b.id)} className="text-xs px-2.5 py-1 rounded-full text-white" style={{ background: b.cor }}>
                      + {b.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {ativa.posicoes.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-gray-500 cursor-pointer">Tirar alguém do palco nesta formação</summary>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ativa.posicoes.map((p) => (
                    <button key={p.bailarinoId} type="button" onClick={() => tirarDoPalco(p.bailarinoId)} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: corDe(p.bailarinoId) }} /> {nomeDe(p.bailarinoId)} <X size={11} />
                    </button>
                  ))}
                </div>
              </details>
            )}

            <textarea className={`${inputClass} mt-3`} rows={2} placeholder="Notas sobre esta formação (opcional)" value={ativa.notas} onChange={(e) => mudarAtiva({ notas: e.target.value })} />
          </Card>

          <div className="flex gap-2">
            <GhostButton onClick={() => svgRef.current && exportarPng(svgRef.current, `${ativa.nome.replace(/\s+/g, "-")}.png`)} className="flex-1">
              <Download size={13} /> Exportar PNG
            </GhostButton>
            <GhostButton onClick={() => setAImprimir(true)} className="flex-1">
              <Printer size={13} /> Imprimir / PDF
            </GhostButton>
          </div>
        </>
      )}

      {aImprimir &&
        createPortal(
          <div className="vista-impressao fixed inset-0 bg-white z-50 overflow-auto">
            <div className="so-ecra sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-2 z-10">
              <span className="text-sm font-medium text-gray-700">Pré-visualização para impressão</span>
              <div className="flex gap-2">
                <GhostButton onClick={() => window.print()}><Printer size={14} /> Imprimir</GhostButton>
                <IconButton onClick={() => setAImprimir(false)} title="Fechar"><X size={16} /></IconButton>
              </div>
            </div>
            <div className="p-6">
              {formacoes.map((f, i) => (
                <div key={f.id} style={{ breakAfter: "page", marginBottom: 24 }}>
                  <h2 style={{ fontWeight: 600, marginBottom: 4 }}>{i + 1}. {f.nome} — {coreografia.nome}</h2>
                  <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Formação {i + 1} de {formacoes.length}</p>
                  <PalcoEstatico posicoes={f.posicoes} corDe={corDe} nomeDe={nomeDe} />
                  {f.notas && <p style={{ fontSize: 12, marginTop: 8, whiteSpace: "pre-line" }}>{f.notas}</p>}
                  <div style={{ marginTop: 8, fontSize: 11 }}>
                    {coreografia.bailarinos.map((b) => (
                      <span key={b.id} style={{ marginRight: 10, whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: b.cor, marginRight: 4 }} />
                        {b.nome}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
