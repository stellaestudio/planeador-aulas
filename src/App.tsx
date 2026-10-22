import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, Calendar, Music, Save, Sparkles, Theater, Users, type LucideIcon } from "lucide-react";
import { supabase } from "./dados/supabase";
import { armazenamentoSupabase } from "./dados/armazenamento";
import { useDados } from "./dados/useDados";
import { Entrar } from "./areas/entrar/Entrar";
import { TurmasTab } from "./areas/turmas/TurmasTab";
import { BibliotecaTab } from "./areas/biblioteca/BibliotecaTab";
import { EspetaculosTab } from "./areas/espetaculos/EspetaculosTab";
import { AulasTab } from "./areas/aulas/AulasTab";
import { CoreografiasTab, type Salto } from "./areas/formacoes/CoreografiasTab";
import { CopiasTab } from "./areas/copias/CopiasTab";
import { GhostButton } from "./ui";

type Separador = "turmas" | "biblioteca" | "espetaculos" | "aulas" | "coreografias" | "copias";

const SEPARADORES: { id: Separador; label: string; icon: LucideIcon }[] = [
  { id: "turmas", label: "Turmas", icon: Users },
  { id: "biblioteca", label: "Biblioteca", icon: Sparkles },
  { id: "aulas", label: "Aulas", icon: Calendar },
  { id: "espetaculos", label: "Espetáculos", icon: Theater },
  { id: "coreografias", label: "Formações", icon: Music },
];

const Aviso = ({ texto }: { texto: string }) => <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">{texto}</div>;

export default function App() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (sessao === undefined) return <Aviso texto="A carregar…" />;
  if (!sessao) return <Entrar />;
  // A chave garante que, se mudar de conta, os dados da conta anterior não ficam no ecrã.
  return <Planeador key={sessao.user.id} email={sessao.user.email ?? ""} />;
}

function Planeador({ email }: { email: string }) {
  const armazenamento = useMemo(() => armazenamentoSupabase(), []);
  const { dados, carregado, erroCarregar, estado, atualizar, substituir, carregar, tentarDeNovo } = useDados(armazenamento);
  const [separador, setSeparador] = useState<Separador>("aulas");
  const [salto, setSalto] = useState<Salto | null>(null);
  const saltoUsado = useCallback(() => setSalto(null), []);

  if (erroCarregar) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-gray-600">Não consegui ler os teus dados. Confirma que tens internet.</p>
        <p className="text-[11px] text-gray-400">{erroCarregar}</p>
        <GhostButton onClick={carregar}>Tentar de novo</GhostButton>
      </div>
    );
  }
  if (!carregado) return <Aviso texto="A carregar os teus dados…" />;

  return (
    <div className="min-h-dvh pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-3 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles size={20} className="text-pink-400" />
            Planeador de aulas
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {estado === "a-gravar" ? "A guardar…" : "Turmas, biblioteca e planeamento de aulas"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeparador("copias")}
          className={`p-2 rounded-full ${separador === "copias" ? "bg-white text-pink-500 shadow-sm" : "bg-white/70 text-gray-500"}`}
          title="Conta e cópias de segurança"
          aria-label="Conta e cópias de segurança"
        >
          <Save size={17} />
        </button>
      </div>

      {estado === "erro" && (
        <div className="max-w-md mx-auto px-4 mb-2">
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="flex-1">Não consegui guardar a última alteração (sem internet?).</span>
            <button type="button" onClick={tentarDeNovo} className="font-medium underline shrink-0">Tentar de novo</button>
          </div>
        </div>
      )}

      <nav className="max-w-md mx-auto px-4 mb-3 sticky top-0 z-20 pt-1">
        <div className="flex bg-white/80 backdrop-blur rounded-full p-1 gap-1 shadow-sm">
          {SEPARADORES.map((t) => {
            const Icon = t.icon;
            const ativo = separador === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSeparador(t.id)}
                className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-full text-[10.5px] font-medium transition ${ativo ? "bg-white shadow-sm text-pink-500" : "text-gray-500"}`}
              >
                <Icon size={16} />
                <span className="truncate max-w-full">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4">
        {separador === "turmas" && <TurmasTab dados={dados} atualizar={atualizar} />}
        {separador === "biblioteca" && <BibliotecaTab dados={dados} atualizar={atualizar} />}
        {separador === "espetaculos" && <EspetaculosTab dados={dados} atualizar={atualizar} />}
        {separador === "aulas" && (
          <AulasTab
            dados={dados}
            atualizar={atualizar}
            onIrParaFormacoes={(turmaId, coreografiaId) => {
              setSalto({ turmaId, coreografiaId });
              setSeparador("coreografias");
            }}
          />
        )}
        {separador === "coreografias" && <CoreografiasTab dados={dados} atualizar={atualizar} salto={salto} onSaltoUsado={saltoUsado} />}
        {separador === "copias" && <CopiasTab dados={dados} email={email} onSubstituir={substituir} onVoltar={() => setSeparador("aulas")} />}
      </main>
    </div>
  );
}
