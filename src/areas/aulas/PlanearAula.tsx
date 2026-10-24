import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Flame, Music, Sparkles, Theater, Users, Wind, X, type LucideIcon } from "lucide-react";
import type { Atualizar, Aula, BlocoLista, BlocoSimples, Coreografia, Dados, ItemAula, ItemBiblioteca, Turma } from "../../tipos";
import { fmtData, hojeISO, uid } from "../../util";
import {
  algumTempoDefinido, nomeDoItem, porFazerDaUltima, proximoEspetaculo, tempoTotal, textoContagem, ultimaAulaDada, vezesPorFazer,
} from "../../regras";
import { Cabecalho, Card, Field, GhostButton, inputClass, PrimaryButton } from "../../ui";
import { EtiquetaPorFazer } from "./EtiquetaPorFazer";
import { nomeModalidade } from "../../modalidades";

interface Props {
  dados: Dados;
  atualizar: Atualizar;
  turma: Turma;
  aulaId: string | null;
  onDone: () => void;
  onAbrirEditorFormacoes: (turmaId: string, coreografiaId?: string) => void;
}

export function PlanearAula({ dados, atualizar, turma, aulaId, onDone, onAbrirEditorFormacoes }: Props) {
  const existente = dados.aulas.find((a) => a.id === aulaId);
  const ultimaDada = useMemo(() => ultimaAulaDada(dados.aulas, turma.id), [dados.aulas, turma.id]);
  const porFazer = useMemo(() => porFazerDaUltima(ultimaDada), [ultimaDada]);

  const [aula, setAula] = useState<Aula>(
    () =>
      existente ?? {
        id: uid(),
        turmaId: turma.id,
        data: hojeISO(),
        objectivoDia: "",
        duracao: turma.duracaoPadrao,
        estado: "planeada",
        blocos: {
          aquecimento: { itemId: turma.aquecimentoPadraoId, tempo: "" },
          movimentos: porFazer.movimentos,
          dinamicas: porFazer.dinamicas,
          coreografia: { coreografiaId: "", tempo: "" },
          alongamento: { itemId: turma.alongamentoPadraoId, tempo: "" },
        },
      }
  );

  // Mostra só os itens da modalidade da turma e os gerais (a não ser que se peça para ver todos).
  const [verTodas, setVerTodas] = useState(false);
  const filtrar = Boolean(turma.modalidade) && !verTodas;
  const lib = dados.biblioteca.filter((m) => !filtrar || !m.modalidade || m.modalidade === turma.modalidade);
  const haOutras = Boolean(turma.modalidade) && dados.biblioteca.some((m) => m.modalidade && m.modalidade !== turma.modalidade);
  const movimentosLib = lib.filter((m) => m.tipo === "movimento" && m.categoria !== "aquecimento" && m.categoria !== "alongamento");
  // O item já escolhido aparece sempre, mesmo que seja de outra modalidade.
  const comEscolhido = (categoria: string, escolhido: string) =>
    dados.biblioteca.filter((m) => m.categoria === categoria && (lib.includes(m) || m.id === escolhido));
  const aquecimentosLib = comEscolhido("aquecimento", aula.blocos.aquecimento.itemId);
  const alongamentosLib = comEscolhido("alongamento", aula.blocos.alongamento.itemId);
  const dinamicasLib = lib.filter((m) => m.tipo === "dinamica");

  const setBloco = <K extends keyof Aula["blocos"]>(k: K, v: Aula["blocos"][K]) => setAula((a) => ({ ...a, blocos: { ...a.blocos, [k]: v } }));

  const alternarItem = (bloco: BlocoLista, itemId: string) =>
    setAula((a) => {
      const l = a.blocos[bloco];
      const novo = l.some((i) => i.itemId === itemId) ? l.filter((i) => i.itemId !== itemId) : [...l, { itemId, feito: null, tempo: "" }];
      return { ...a, blocos: { ...a.blocos, [bloco]: novo } };
    });

  const setTempoItem = (bloco: BlocoLista, itemId: string, tempo: string) =>
    setAula((a) => ({ ...a, blocos: { ...a.blocos, [bloco]: a.blocos[bloco].map((i) => (i.itemId === itemId ? { ...i, tempo } : i)) } }));

  const total = tempoTotal(aula);
  const duracao = Number(aula.duracao) || 0;
  const espetaculo = proximoEspetaculo(dados.espetaculos, turma.id, aula.data || hojeISO());

  const guardar = () => {
    atualizar("aulas", (l) => (l.some((a) => a.id === aula.id) ? l.map((a) => (a.id === aula.id ? aula : a)) : [...l, aula]));
    onDone();
  };

  return (
    <div className="flex flex-col gap-3">
      <Cabecalho titulo={`Planear aula — ${turma.nome}`} onVoltar={onDone} />

      {espetaculo && (
        <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-none! flex items-center gap-2 py-2.5!">
          <Theater size={16} className="text-pink-500 shrink-0" />
          <div className="text-xs text-gray-700">
            <span className="font-semibold">{espetaculo.nome}</span> ({fmtData(espetaculo.data)}) — a contar desta aula, {textoContagem(espetaculo, aula.data || hojeISO())}
          </div>
        </Card>
      )}

      {ultimaDada && ultimaDada.id !== aula.id && (
        <Card className="bg-gray-50! border-none!">
          <div className="text-xs font-medium text-gray-500 mb-1">Revisão da aula anterior ({fmtData(ultimaDada.data)})</div>
          <div className="text-xs text-gray-600">
            {[...ultimaDada.blocos.movimentos, ...ultimaDada.blocos.dinamicas].filter((i) => i.feito).map((i) => nomeDoItem(dados, i.itemId)).join(", ") || "Nada registado"}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3">
          <Field label="Data"><input type="date" className={inputClass} value={aula.data} onChange={(e) => setAula({ ...aula, data: e.target.value })} /></Field>
          <Field label="Objetivo da aula (livre)">
            <input className={inputClass} value={aula.objectivoDia} onChange={(e) => setAula({ ...aula, objectivoDia: e.target.value })} placeholder="Ex: revisão para o espetáculo" />
          </Field>
          <Field label="Duração da aula (min)">
            <input type="number" inputMode="numeric" className={inputClass} value={aula.duracao} onChange={(e) => setAula({ ...aula, duracao: Number(e.target.value) })} />
          </Field>
        </div>
      </Card>

      {haOutras && (
        <button type="button" onClick={() => setVerTodas((v) => !v)} className="text-xs text-pink-500 font-medium self-start px-1">
          {verTodas ? `Mostrar só ${nomeModalidade(turma.modalidade)} e gerais` : "Mostrar também itens de outras modalidades"}
        </button>
      )}

      <BlocoUmItem titulo="Aquecimento" icon={Flame} lib={aquecimentosLib} value={aula.blocos.aquecimento} onChange={(v) => setBloco("aquecimento", v)} />

      {(["movimentos", "dinamicas"] as const).map((bloco) => (
        <BlocoVarios
          key={bloco}
          titulo={bloco === "movimentos" ? "Movimentos" : "Dinâmicas / jogos"}
          icon={bloco === "movimentos" ? Sparkles : Users}
          lib={bloco === "movimentos" ? movimentosLib : dinamicasLib}
          itens={aula.blocos[bloco]}
          porFazerIds={porFazer[bloco].map((p) => p.itemId)}
          vezes={(id) => vezesPorFazer(dados.aulas, turma.id, bloco, id)}
          nome={(id) => nomeDoItem(dados, id)}
          onAlternar={(id) => alternarItem(bloco, id)}
          onTempo={(id, t) => setTempoItem(bloco, id, t)}
        />
      ))}

      <BlocoCoreo
        coreografias={dados.coreografias.filter((c) => c.turmaId === turma.id)}
        value={aula.blocos.coreografia}
        onChange={(v) => setBloco("coreografia", v)}
        onAbrirEditor={(id) => onAbrirEditorFormacoes(turma.id, id)}
      />

      <BlocoUmItem titulo="Alongamento final" icon={Wind} lib={alongamentosLib} value={aula.blocos.alongamento} onChange={(v) => setBloco("alongamento", v)} />

      {algumTempoDefinido(aula) && (
        <Card className={`py-2.5! flex items-center gap-2 ${total !== duracao ? "bg-amber-50!" : "bg-teal-50!"}`}>
          {total !== duracao && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
          <span className="text-xs text-gray-600">
            Tempo reservado: <strong>{total} min</strong> de {duracao} min
            {total > duracao && ` — passa ${total - duracao} min do tempo`}
            {total < duracao && ` — faltam atribuir ${duracao - total} min`}
          </span>
        </Card>
      )}

      <PrimaryButton onClick={guardar}><Check size={16} /> Guardar plano</PrimaryButton>
    </div>
  );
}

const inputMin = `${inputClass} w-20! shrink-0`;

function BlocoUmItem({ titulo, icon: Icon, lib, value, onChange }: {
  titulo: string; icon: LucideIcon; lib: ItemBiblioteca[]; value: BlocoSimples; onChange: (v: BlocoSimples) => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-gray-700"><Icon size={15} className="text-teal-500" /> {titulo}</div>
      <div className="flex gap-2">
        <select className={inputClass} value={value.itemId} onChange={(e) => onChange({ ...value, itemId: e.target.value })}>
          <option value="">Nenhum</option>
          {lib.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <input type="number" inputMode="numeric" placeholder="min" className={inputMin} value={value.tempo} onChange={(e) => onChange({ ...value, tempo: e.target.value })} />
      </div>
    </Card>
  );
}

function BlocoCoreo({ coreografias, value, onChange, onAbrirEditor }: {
  coreografias: Coreografia[]; value: Aula["blocos"]["coreografia"]; onChange: (v: Aula["blocos"]["coreografia"]) => void; onAbrirEditor: (coreografiaId?: string) => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-gray-700"><Music size={15} className="text-purple-500" /> Coreografia</div>
      {coreografias.length === 0 ? (
        <div className="text-xs text-gray-400 flex items-center justify-between gap-2">
          Ainda não há coreografias para esta turma.
          <GhostButton onClick={() => onAbrirEditor()} className="py-1! px-2.5! shrink-0">Criar <ChevronRight size={12} /></GhostButton>
        </div>
      ) : (
        <div className="flex gap-2">
          <select className={inputClass} value={value.coreografiaId} onChange={(e) => onChange({ ...value, coreografiaId: e.target.value })}>
            <option value="">Nenhuma</option>
            {coreografias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input type="number" inputMode="numeric" placeholder="min" className={inputMin} value={value.tempo} onChange={(e) => onChange({ ...value, tempo: e.target.value })} />
        </div>
      )}
      {value.coreografiaId && (
        <button type="button" onClick={() => onAbrirEditor(value.coreografiaId)} className="text-xs text-pink-500 font-medium mt-2 flex items-center gap-1">
          Abrir editor de formações <ChevronRight size={12} />
        </button>
      )}
    </Card>
  );
}

function BlocoVarios({ titulo, icon: Icon, lib, itens, porFazerIds, vezes, nome, onAlternar, onTempo }: {
  titulo: string;
  icon: LucideIcon;
  lib: ItemBiblioteca[];
  itens: ItemAula[];
  porFazerIds: string[];
  vezes: (itemId: string) => number;
  nome: (itemId: string) => string;
  onAlternar: (itemId: string) => void;
  onTempo: (itemId: string, tempo: string) => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-gray-700"><Icon size={15} className="text-orange-500" /> {titulo}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {lib.map((m) => {
          const ativo = itens.some((i) => i.itemId === m.id);
          const pendente = porFazerIds.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onAlternar(m.id)}
              title={pendente ? "Ficou por fazer na última aula" : undefined}
              className={`px-2.5 py-1 rounded-full text-xs ${ativo ? "bg-orange-400 text-white" : "bg-gray-100 text-gray-500"} ${m.parentId ? "italic" : ""}`}
            >
              {m.parentId && "↳ "}{m.nome}{pendente && <span className="ml-1">•</span>}
            </button>
          );
        })}
        {lib.length === 0 && <span className="text-xs text-gray-400">Biblioteca vazia</span>}
      </div>
      {itens.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2">
          {itens.map((i) => (
            <div key={i.itemId} className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-600 flex items-center flex-wrap gap-1.5 min-w-0">
                {nome(i.itemId)}
                <EtiquetaPorFazer vezes={vezes(i.itemId)} />
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <input type="number" inputMode="numeric" placeholder="min" className="rounded-lg border border-gray-200 px-2 py-1 text-xs w-16" value={i.tempo} onChange={(e) => onTempo(i.itemId, e.target.value)} />
                <button type="button" onClick={() => onAlternar(i.itemId)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Tirar do plano"><X size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
