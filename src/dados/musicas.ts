// Ficheiros de música no Supabase Storage (pasta privada de cada professor).
import { supabase } from "./supabase";

const BALDE = "musicas";
const cache = new Map<string, string>(); // caminho → URL local já descarregado

export async function enviarMusica(ficheiro: File, coreografiaId: string): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão terminada. Entra outra vez.");
  const limpo = ficheiro.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
  const caminho = `${data.user.id}/${coreografiaId}/${Date.now()}-${limpo}`;
  const { error } = await supabase.storage.from(BALDE).upload(caminho, ficheiro, { contentType: ficheiro.type || "audio/mpeg" });
  if (error) throw error;
  cache.set(caminho, URL.createObjectURL(ficheiro));
  return caminho;
}

/** Descarrega a música (uma vez) e devolve um endereço local para o leitor de áudio. */
export async function urlDaMusica(caminho: string): Promise<string> {
  const ja = cache.get(caminho);
  if (ja) return ja;
  const { data, error } = await supabase.storage.from(BALDE).download(caminho);
  if (error) throw error;
  const url = URL.createObjectURL(data);
  cache.set(caminho, url);
  return url;
}

export async function apagarMusica(caminho: string) {
  if (!caminho) return;
  await supabase.storage.from(BALDE).remove([caminho]);
  cache.delete(caminho);
}
