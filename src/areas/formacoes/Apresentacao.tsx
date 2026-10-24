// Animação das formações com a música, em ecrã inteiro, e gravação em vídeo.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Pause, Play, Share2, Square, Video, X } from "lucide-react";
import type { Coreografia } from "../../tipos";
import { duracaoTotal, fmtTempo, formacaoEm, posicoesEm } from "./animacao";
import { GhostButton, IconButton, PrimaryButton } from "../../ui";

// Vídeo vertical (bom para WhatsApp e Instagram).
const W = 720;
const H = 1280;
const PALCO = { x: 40, y: 230, w: 640, h: 800 };

interface Props {
  coreografia: Coreografia;
  musicaUrl: string | null;
  onFechar: () => void;
}

function desenhar(ctx: CanvasRenderingContext2D, c: Coreografia, t: number, total: number) {
  const fs = c.formacoes;
  const fundo = ctx.createLinearGradient(0, 0, W, H);
  fundo.addColorStop(0, "#FDF2F8");
  fundo.addColorStop(0.45, "#F3F0FC");
  fundo.addColorStop(1, "#EFF6FF");
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, W, H);

  const k = formacaoEm(fs, t);
  const f = fs[k];
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1f2937";
  ctx.font = "600 40px Poppins, system-ui, sans-serif";
  ctx.fillText(c.nome || "Coreografia", W / 2, 95, W - 80);
  if (f) {
    ctx.fillStyle = "#a855f7";
    ctx.font = "600 30px Poppins, system-ui, sans-serif";
    ctx.fillText(`${k + 1}/${fs.length} · ${f.nome}`, W / 2, 150, W - 80);
  }

  // Palco
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 18px Poppins, system-ui, sans-serif";
  ctx.fillText("FUNDO DO PALCO", W / 2, PALCO.y - 14);
  ctx.fillText("PÚBLICO", W / 2, PALCO.y + PALCO.h + 32);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(PALCO.x, PALCO.y, PALCO.w, PALCO.h, 24);
  ctx.fill();
  ctx.stroke();

  for (const p of posicoesEm(fs, t)) {
    const b = c.bailarinos.find((x) => x.id === p.bailarinoId);
    if (!b) continue;
    const x = PALCO.x + (p.x / 100) * PALCO.w;
    const y = PALCO.y + (p.y / 100) * PALCO.h;
    ctx.globalAlpha = p.opacidade;
    ctx.fillStyle = b.cor;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px Poppins, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(b.nome.slice(0, 2).toUpperCase(), x, y + 1);
    ctx.fillStyle = "#374151";
    ctx.font = "500 16px Poppins, system-ui, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(b.nome, x, y + 50, 140);
    ctx.globalAlpha = 1;
  }

  // Notas da formação
  if (f?.notas) {
    ctx.fillStyle = "#4b5563";
    ctx.font = "400 22px Poppins, system-ui, sans-serif";
    const linhas = quebrar(ctx, f.notas, W - 100).slice(0, 3);
    linhas.forEach((l, i) => ctx.fillText(l, W / 2, PALCO.y + PALCO.h + 80 + i * 30));
  }

  // Barra de progresso
  const by = H - 70;
  ctx.fillStyle = "#e9d5ff";
  ctx.beginPath();
  ctx.roundRect(60, by, W - 120, 8, 4);
  ctx.fill();
  ctx.fillStyle = "#f472b6";
  ctx.beginPath();
  ctx.roundRect(60, by, Math.max(8, (W - 120) * Math.min(1, total ? t / total : 0)), 8, 4);
  ctx.fill();
  ctx.fillStyle = "#6b7280";
  ctx.font = "500 18px Poppins, system-ui, sans-serif";
  ctx.fillText(`${fmtTempo(t)} / ${fmtTempo(total)}`, W / 2, by + 40);
}

function quebrar(ctx: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const linhas: string[] = [];
  for (const paragrafo of texto.split("\n")) {
    let linha = "";
    for (const palavra of paragrafo.split(" ")) {
      const tentativa = linha ? `${linha} ${palavra}` : palavra;
      if (ctx.measureText(tentativa).width > largura && linha) {
        linhas.push(linha);
        linha = palavra;
      } else linha = tentativa;
    }
    linhas.push(linha);
  }
  return linhas;
}

function formatoVideo(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  // H.264 primeiro: é o que abre em todo o lado (iPhone, WhatsApp, Instagram).
  // "video/mp4" sem codec pode sair em VP9, que o iPhone não abre, por isso fica em último.
  const opcoes = [
    { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
    { mime: "video/mp4;codecs=avc1.42E01E,opus", ext: "mp4" },
    { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
    { mime: "video/mp4", ext: "mp4" },
  ];
  return opcoes.find((o) => MediaRecorder.isTypeSupported(o.mime)) ?? null;
}

export function Apresentacao({ coreografia, musicaUrl, onFechar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duracaoMusica, setDuracaoMusica] = useState<number>();
  const [t, setT] = useState(0);
  const [aTocar, setATocar] = useState(false);
  const [aGravar, setAGravar] = useState(false);
  const [video, setVideo] = useState<{ blob: Blob; nome: string } | null>(null);

  // Relógio sem música: segundo atual = base + tempo desde que começou a tocar.
  const relogio = useRef({ base: 0, desde: 0 });
  const audioGrafo = useRef<{ ctx: AudioContext; destino: MediaStreamAudioDestinationNode } | null>(null);
  const gravador = useRef<MediaRecorder | null>(null);

  const total = duracaoTotal(coreografia.formacoes, musicaUrl ? duracaoMusica : undefined);
  const tAgora = useCallback(() => {
    if (musicaUrl && audioRef.current) return audioRef.current.currentTime;
    const r = relogio.current;
    return r.desde ? r.base + (performance.now() - r.desde) / 1000 : r.base;
  }, [musicaUrl]);

  const pausar = useCallback(() => {
    if (musicaUrl) audioRef.current?.pause();
    else relogio.current = { base: tAgora(), desde: 0 };
    setATocar(false);
  }, [musicaUrl, tAgora]);

  const tocar = useCallback(async () => {
    if (tAgora() >= total - 0.05) irPara(0);
    if (musicaUrl) await audioRef.current?.play();
    else relogio.current = { base: relogio.current.base, desde: performance.now() };
    setATocar(true);
  }, [musicaUrl, total, tAgora]);

  const irPara = (s: number) => {
    if (musicaUrl && audioRef.current) audioRef.current.currentTime = s;
    else relogio.current = { base: s, desde: relogio.current.desde ? performance.now() : 0 };
    setT(s);
  };

  // Desenha a cada fotograma.
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    let id = 0;
    const passo = () => {
      const agora = Math.min(tAgora(), total);
      desenhar(ctx, coreografia, agora, total);
      setT(agora);
      if (agora >= total && total > 0) {
        if (gravador.current?.state === "recording") gravador.current.stop();
        if (!musicaUrl && relogio.current.desde) {
          relogio.current = { base: total, desde: 0 };
          setATocar(false);
        }
      }
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [coreografia, total, tAgora, musicaUrl]);

  // Ao fechar: parar tudo.
  useEffect(
    () => () => {
      gravador.current?.state === "recording" && gravador.current.stop();
      audioGrafo.current?.ctx.close();
    },
    []
  );

  const gravarVideo = async () => {
    const formato = formatoVideo();
    if (!formato || !canvasRef.current?.captureStream) {
      alert("Este browser não consegue gravar vídeo. Experimenta no Chrome ou no Safari atualizado.");
      return;
    }
    setVideo(null);
    const stream = canvasRef.current.captureStream(30);
    if (musicaUrl && audioRef.current) {
      // O som passa por aqui para ir ao mesmo tempo para as colunas e para o vídeo.
      if (!audioGrafo.current) {
        const ctx = new AudioContext();
        const fonte = ctx.createMediaElementSource(audioRef.current);
        const destino = ctx.createMediaStreamDestination();
        fonte.connect(ctx.destination);
        fonte.connect(destino);
        audioGrafo.current = { ctx, destino };
      }
      await audioGrafo.current.ctx.resume();
      audioGrafo.current.destino.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    }
    const partes: Blob[] = [];
    const rec = new MediaRecorder(stream, { mimeType: formato.mime, videoBitsPerSecond: 4_000_000 });
    rec.ondataavailable = (e) => e.data.size && partes.push(e.data);
    rec.onstop = () => {
      pausar();
      setAGravar(false);
      gravador.current = null;
      const blob = new Blob(partes, { type: formato.mime.split(";")[0] });
      const nome = `${(coreografia.nome || "coreografia").replace(/[^\w-]+/g, "-")}.${formato.ext}`;
      setVideo({ blob, nome });
    };
    gravador.current = rec;
    irPara(0);
    rec.start(1000);
    setAGravar(true);
    await tocar();
  };

  const pararGravacao = () => gravador.current?.state === "recording" && gravador.current.stop();

  const descarregar = () => {
    if (!video) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(video.blob);
    a.download = video.nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  };
  const ficheiroVideo = video ? new File([video.blob], video.nome, { type: video.blob.type }) : null;
  const podePartilhar = Boolean(ficheiroVideo && navigator.canShare?.({ files: [ficheiroVideo] }));

  return createPortal(
    <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col items-center gap-3 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] overflow-auto">
      <div className="w-full max-w-md flex items-center justify-between gap-2 text-white">
        <span className="text-sm font-medium truncate">{coreografia.nome}</span>
        <IconButton onClick={onFechar} title="Fechar"><X size={16} /></IconButton>
      </div>

      <canvas ref={canvasRef} width={W} height={H} className="w-auto max-w-full rounded-2xl shadow-lg" style={{ maxHeight: "calc(100dvh - 210px)", aspectRatio: `${W}/${H}` }} />

      {musicaUrl && (
        <audio
          ref={audioRef}
          src={musicaUrl}
          preload="auto"
          onLoadedMetadata={(e) => setDuracaoMusica(e.currentTarget.duration)}
          onEnded={() => setATocar(false)}
          onPause={() => setATocar(false)}
          onPlay={() => setATocar(true)}
        />
      )}

      <div className="w-full max-w-md flex flex-col gap-2">
        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={Math.min(t, total)}
          disabled={aGravar}
          onChange={(e) => irPara(Number(e.target.value))}
          className="w-full accent-pink-400"
          aria-label="Posição na música"
        />
        <div className="flex gap-2">
          {aGravar ? (
            <PrimaryButton onClick={pararGravacao} className="flex-1"><Square size={15} /> Parar gravação ({fmtTempo(t)})</PrimaryButton>
          ) : (
            <>
              <PrimaryButton onClick={aTocar ? pausar : tocar} className="flex-1">
                {aTocar ? <><Pause size={16} /> Pausa</> : <><Play size={16} /> Tocar</>}
              </PrimaryButton>
              <GhostButton onClick={gravarVideo} className="shrink-0"><Video size={15} /> Gravar vídeo</GhostButton>
            </>
          )}
        </div>
        {aGravar && <p className="text-[11px] text-gray-300 text-center">A gravação demora o tempo da música. Deixa este ecrã aberto até ao fim.</p>}
        {video && (
          <div className="flex gap-2">
            <GhostButton onClick={descarregar} className="flex-1"><Download size={15} /> Descarregar vídeo</GhostButton>
            {podePartilhar && (
              <GhostButton onClick={() => navigator.share({ files: [ficheiroVideo!], title: coreografia.nome }).catch(() => {})} className="flex-1">
                <Share2 size={15} /> Partilhar
              </GhostButton>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
