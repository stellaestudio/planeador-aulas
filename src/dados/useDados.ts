import { useCallback, useEffect, useRef, useState } from "react";
import type { Atualizar, Dados } from "../tipos";
import type { Armazenamento } from "./armazenamento";
import { dadosVazios } from "./normalizar";

// Espera um pouco antes de gravar, para juntar várias alterações seguidas
// (por exemplo, arrastar um bailarino no palco) num só envio.
const ESPERA_MS = 500;

export type EstadoGravacao = "gravado" | "a-gravar" | "erro";

export function useDados(armazenamento: Armazenamento) {
  const [dados, setDados] = useState<Dados>(dadosVazios);
  const [carregado, setCarregado] = useState(false);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoGravacao>("gravado");
  // Só se grava depois de uma ação da utilizadora, para nunca apagar os dados
  // guardados com o estado vazio inicial.
  const alterado = useRef(false);
  const pendente = useRef<(() => void) | null>(null);

  const carregar = useCallback(() => {
    setErroCarregar(null);
    armazenamento
      .carregar()
      .then((d) => {
        setDados(d);
        setCarregado(true);
      })
      .catch((e) => {
        console.error("Erro ao ler os dados", e);
        setErroCarregar(e?.message ?? String(e));
      });
  }, [armazenamento]);

  useEffect(carregar, [carregar]);

  useEffect(() => {
    if (!carregado || !alterado.current) return;
    setEstado("a-gravar");
    const gravar = () => {
      pendente.current = null;
      armazenamento
        .guardar(dados)
        .then(() => setEstado((e) => (pendente.current ? e : "gravado")))
        .catch((e) => {
          console.error("Erro ao guardar", e);
          setEstado("erro");
        });
    };
    const t = setTimeout(gravar, ESPERA_MS);
    pendente.current = () => {
      clearTimeout(t);
      gravar();
    };
    return () => clearTimeout(t);
  }, [dados, carregado, armazenamento]);

  // Se a app for para segundo plano (ou fechar), grava logo o que estiver à espera.
  useEffect(() => {
    const agora = () => pendente.current?.();
    const aoEsconder = () => document.visibilityState === "hidden" && agora();
    document.addEventListener("visibilitychange", aoEsconder);
    window.addEventListener("pagehide", agora);
    return () => {
      document.removeEventListener("visibilitychange", aoEsconder);
      window.removeEventListener("pagehide", agora);
    };
  }, []);

  // No computador, avisa antes de fechar a página se ainda houver alterações por gravar.
  useEffect(() => {
    if (estado !== "a-gravar") return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [estado]);

  const atualizar: Atualizar = useCallback((chave, fn) => {
    alterado.current = true;
    setDados((d) => ({ ...d, [chave]: fn(d[chave]) }));
  }, []);

  /** Substitui tudo (usado ao importar uma cópia). */
  const substituir = useCallback((novos: Dados) => {
    alterado.current = true;
    setDados(novos);
  }, []);

  /** Tenta gravar outra vez depois de um erro. */
  const tentarDeNovo = useCallback(() => {
    alterado.current = true;
    setDados((d) => ({ ...d }));
  }, []);

  return { dados, carregado, erroCarregar, estado, atualizar, substituir, carregar, tentarDeNovo };
}
