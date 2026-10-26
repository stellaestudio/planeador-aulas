import { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircle, Plus, Star, Undo2, X } from "lucide-react";
import type { Atualizar, Aula, BlocoLista, Dados, Turma } from "../../tipos";
import { fmtData, uid } from "../../util";
import { nomeDoItem, numeroDaAula, resumoWhatsApp, vezesPorFazer } from "../../regras";
import { Cabecalho, Card, GhostButton, inputClass, Pill, PrimaryButton } from "../../ui";
import { EtiquetaPorFazer } from "./EtiquetaPorFazer";

interface Props {
  dados: Dados;
  atualizar: Atualizar;
  aula: Aula;
  turma: Turma;
  onDone: () => void;
}

const BLOCOS: { key: BlocoLista; label: string }[] = [
  { key: "movimentos", label: "Movimentos" },
  { key: "dinamicas", label: "Dinâmicas / jogos" },
];

export function DarAula({ dados, atualizar, aula, turma, onDone }: Props) {
  const [aAdicionar, setAAdicionar] = useState<BlocoLista | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Cada toque é guardado logo, para não se perder nada se a app fechar a meio da aula.
  const mudar = (fn: (a: Aula) => Aula) => atualizar("aulas", (l) => l.map((a) => (a.id === aula.id ? fn(a) : a)));

  const setFeito = (bloco: BlocoLista, itemId: string, feito: boolean) =>
    mudar((a) => ({
      ...a,
      blocos: { ...a.blocos, [bloco]: a.blocos[bloco].map((i) => (i.itemId === itemId ? { ...i, feito: i.feito === feito ? null : feito } : i)) },
    }));

  const adicionarExtra = (bloco: BlocoLista) => {
    const nome = novoNome.trim();
    if (!nome) return;
    const tipo = bloco === "dinamicas" ? "dinamica" : "movimento";
    const existente = dados.biblioteca.find((m) => m.tipo === tipo && m.nome.toLowerCase() === nome.toLowerCase());
    const itemId = existente?.id ?? uid();
    if (!existente) {
      atualizar("biblioteca", (l) => [...l, { id: itemId, tipo, nome, descricao: "", categoria: tipo === "movimento" ? "tecnica" : "", objectivoIds: [], parentId: "", modalidade: turma.modalidade }]);
    }
    mudar((a) => {
      const lista = a.blocos[bloco];
      const novaLista = lista.some((i) => i.itemId === itemId)
        ? lista.map((i) => (i.itemId === itemId ? { ...i, feito: true } : i))
        : [...lista, { itemId, feito: true, tempo: "", extra: true }];
      return { ...a, blocos: { ...a.blocos, [bloco]: novaLista } };
    });
    setNovoNome("");
    setAAdicionar(null);
  };

  const resumo = useMemo(() => resumoWhatsApp(dados, aula, turma), [dados, aula, turma]);
  const [texto, setTexto] = useState(resumo);
  useEffect(() => setTexto(resumo), [resumo]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      alert("Não consegui copiar. Seleciona o texto e copia à mão.");
    }
  };

  const b = aula.blocos;
  const coreo = dados.coreografias.find((c) => c.id === b.coreografia.coreografiaId);
  const resto = [
    b.aquecimento.itemId && `Aquecimento: ${nomeDoItem(dados, b.aquecimento.itemId)}`,
    coreo && `Coreografia: ${coreo.nome}`,
    b.alongamento.itemId && `Alongamento: ${nomeDoItem(dados, b.alongamento.itemId)}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <Cabecalho titulo={`${aula.estado === "dada" ? "Aula dada" : "A dar aula"} — ${fmtData(aula.data)}`} onVoltar={onDone} />
      {turma.privada && (
        <div className="text-xs text-gray-500 px-1 -mt-1">
          {turma.nome}{turma.pacote ? ` · aula ${numeroDaAula(dados.aulas, aula)} de ${turma.pacote}` : ""}
        </div>
      )}

      {aula.objectivoDia && <div className="text-xs text-gray-500 px-1">Objetivo: {aula.objectivoDia}</div>}
      {resto.length > 0 && (
        <Card className="bg-teal-50! border-none! py-2.5! text-xs text-teal-900 flex flex-col gap-0.5">
          {resto.map((r) => <div key={r as string}>{r}</div>)}
        </Card>
      )}

      {BLOCOS.map(({ key, label }) => (
        <Card key={key}>
          <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
          <div className="flex flex-col gap-2">
            {b[key].map((i) => (
              <div key={i.itemId} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600 flex items-center flex-wrap gap-1.5 min-w-0">
                  {nomeDoItem(dados, i.itemId)}
                  {i.extra && <Pill color="coral" className="py-0.5! text-[10px]!">extra</Pill>}
                  {aula.estado === "planeada" && <EtiquetaPorFazer vezes={vezesPorFazer(dados.aulas, turma.id, key, i.itemId)} />}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button type="button" aria-label="Feito" onClick={() => setFeito(key, i.itemId, true)} className={`p-2 rounded-full ${i.feito === true ? "bg-teal-400 text-white" : "bg-gray-100 text-gray-400"}`}><Check size={14} /></button>
                  <button type="button" aria-label="Não feito" onClick={() => setFeito(key, i.itemId, false)} className={`p-2 rounded-full ${i.feito === false ? "bg-red-300 text-white" : "bg-gray-100 text-gray-400"}`}><X size={14} /></button>
                </div>
              </div>
            ))}
            {b[key].length === 0 && <div className="text-xs text-gray-400">Nada planeado</div>}
          </div>

          {aAdicionar === key ? (
            <div className="flex gap-2 mt-2">
              <input
                autoFocus
                className={inputClass}
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionarExtra(key)}
                placeholder="Nome do que foi dado"
                list={`biblioteca-${key}`}
              />
              <datalist id={`biblioteca-${key}`}>
                {dados.biblioteca.filter((m) => m.tipo === (key === "dinamicas" ? "dinamica" : "movimento")).map((m) => <option key={m.id} value={m.nome} />)}
              </datalist>
              <PrimaryButton onClick={() => adicionarExtra(key)} className="px-3!" title="Adicionar"><Check size={14} /></PrimaryButton>
            </div>
          ) : (
            <button type="button" onClick={() => { setAAdicionar(key); setNovoNome(""); }} className="text-xs text-pink-500 font-medium mt-2 flex items-center gap-1">
              <Plus size={12} /> Adicionar o que foi dado
            </button>
          )}
        </Card>
      ))}

      <Card>
        <div className="text-sm font-medium text-gray-700 mb-2">Para treinar em casa</div>
        <textarea
          className={inputClass}
          rows={2}
          value={aula.paraCasa}
          onChange={(e) => mudar((a) => ({ ...a, paraCasa: e.target.value }))}
          placeholder="Opcional. Ex: repetir o shimmy 5 min por dia; ver o vídeo da coreografia"
        />
        <p className="text-[11px] text-gray-400 mt-1">Entra no resumo para WhatsApp.</p>
      </Card>

      {aula.estado === "planeada" ? (
        <>
          <PrimaryButton onClick={() => mudar((a) => ({ ...a, estado: "dada" }))}><Check size={16} /> Marcar aula como dada</PrimaryButton>
          <p className="text-[11px] text-gray-400 px-1">O que não marcares como feito passa para a próxima aula desta turma.</p>
        </>
      ) : (
        <>
          <Card>
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><Star size={14} className="text-pink-400" /> Resumo para WhatsApp</div>
            <textarea className={inputClass} rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <GhostButton onClick={copiar} className="flex-1"><Copy size={13} /> {copiado ? "Copiado!" : "Copiar texto"}</GhostButton>
              <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" className="rounded-full px-3 py-2 text-sm font-medium text-white bg-green-500 flex items-center justify-center gap-1 flex-1">
                <MessageCircle size={13} /> WhatsApp
              </a>
            </div>
          </Card>
          <GhostButton onClick={() => mudar((a) => ({ ...a, estado: "planeada" }))} className="text-xs!"><Undo2 size={13} /> Voltar a pôr como planeada</GhostButton>
        </>
      )}
    </div>
  );
}
