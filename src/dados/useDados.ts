import { useCallback, useEffect, useRef, useState } from "react";
import type { Atualizar, Dados } from "../tipos";
import { armazenamentoLocal, type Armazenamento } from "./armazenamento";
import { dadosVazios } from "./normalizar";

export function useDados(armazenamento: Armazenamento = armazenamentoLocal) {
  const [dados, setDados] = useState<Dados>(dadosVazios);
  const [carregado, setCarregado] = useState(false);
  const [erroGuardar, setErroGuardar] = useState(false);
  const [erroCarregar, setErroCarregar] = useState(false);
  // Só se grava depois de uma ação da utilizadora, para nunca apagar dados
  // guardados com o estado vazio inicial se a leitura falhar.
  const alterado = useRef(false);

  useEffect(() => {
    armazenamento
      .carregar()
      .then((d) => d && setDados(d))
      .catch((e) => {
        console.error("Erro ao ler os dados", e);
        setErroCarregar(true);
      })
      .finally(() => setCarregado(true));
  }, [armazenamento]);

  useEffect(() => {
    if (!carregado || !alterado.current || erroCarregar) return;
    armazenamento
      .guardar(dados)
      .then(() => setErroGuardar(false))
      .catch((e) => {
        console.error("Erro ao guardar", e);
        setErroGuardar(true);
      });
  }, [dados, carregado, erroCarregar, armazenamento]);

  const atualizar: Atualizar = useCallback((chave, fn) => {
    alterado.current = true;
    setDados((d) => ({ ...d, [chave]: fn(d[chave]) }));
  }, []);

  /** Substitui tudo (usado ao importar uma cópia). */
  const substituir = useCallback((novos: Dados) => {
    alterado.current = true;
    setErroCarregar(false);
    setDados(novos);
  }, []);

  return { dados, carregado, erroGuardar, erroCarregar, atualizar, substituir };
}
