import { useRef, type RefObject, type PointerEvent } from "react";
import type { Posicao } from "../../tipos";

export const STAGE_W = 300;
export const STAGE_H = 400;

const px = (p: Posicao) => ({ x: (p.x / 100) * STAGE_W, y: (p.y / 100) * STAGE_H });

function Bailarino({ p, cor, nome }: { p: Posicao; cor: string; nome: string }) {
  return (
    <>
      <circle r="12" fill={cor} stroke="white" strokeWidth="2" />
      <text textAnchor="middle" dominantBaseline="central" fontSize="9" fill="white" fontWeight="600" style={{ pointerEvents: "none", userSelect: "none" }}>
        {nome.slice(0, 2).toUpperCase()}
      </text>
      <title>{`${nome} (${Math.round(p.x)}, ${Math.round(p.y)})`}</title>
    </>
  );
}

interface EditorProps {
  svgRef: RefObject<SVGSVGElement | null>;
  posicoes: Posicao[];
  posicoesAnteriores: Posicao[];
  showTrajetorias: boolean;
  showGrid: boolean;
  corDe: (id: string) => string;
  nomeDe: (id: string) => string;
  onMover: (bailarinoId: string, x: number, y: number) => void;
}

export function PalcoEditor({ svgRef, posicoes, posicoesAnteriores, showTrajetorias, showGrid, corDe, nomeDe, onMover }: EditorProps) {
  const aArrastar = useRef<string | null>(null);

  const emPercentagem = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100)),
    };
  };

  const onPointerDown = (e: PointerEvent<SVGGElement>, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    aArrastar.current = id;
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!aArrastar.current) return;
    const { x, y } = emPercentagem(e.clientX, e.clientY);
    onMover(aArrastar.current, x, y);
  };
  const largar = () => { aArrastar.current = null; };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      className="w-full rounded-xl bg-gray-50 border border-gray-200 touch-none select-none"
      style={{ aspectRatio: `${STAGE_W}/${STAGE_H}` }}
      onPointerMove={onPointerMove}
      onPointerUp={largar}
      onPointerCancel={largar}
    >
      <rect width={STAGE_W} height={STAGE_H} fill="#f9fafb" />
      {showGrid &&
        Array.from({ length: 9 }).flatMap((_, i) => [
          <line key={"v" + i} x1={(STAGE_W / 10) * (i + 1)} y1={0} x2={(STAGE_W / 10) * (i + 1)} y2={STAGE_H} stroke="#e5e7eb" strokeWidth="1" />,
          <line key={"h" + i} x1={0} y1={(STAGE_H / 10) * (i + 1)} x2={STAGE_W} y2={(STAGE_H / 10) * (i + 1)} stroke="#e5e7eb" strokeWidth="1" />,
        ])}

      {showTrajetorias &&
        posicoes.map((p) => {
          const antes = posicoesAnteriores.find((pp) => pp.bailarinoId === p.bailarinoId);
          if (!antes) return null;
          const a = px(antes), b = px(p);
          return <line key={"traj-" + p.bailarinoId} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={corDe(p.bailarinoId)} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />;
        })}

      {posicoes.map((p) => {
        const { x, y } = px(p);
        return (
          <g key={p.bailarinoId} transform={`translate(${x}, ${y})`} onPointerDown={(e) => onPointerDown(e, p.bailarinoId)} style={{ cursor: "grab" }}>
            <Bailarino p={p} cor={corDe(p.bailarinoId)} nome={nomeDe(p.bailarinoId)} />
          </g>
        );
      })}
    </svg>
  );
}

export function PalcoEstatico({ posicoes, corDe, nomeDe }: { posicoes: Posicao[]; corDe: (id: string) => string; nomeDe: (id: string) => string }) {
  return (
    <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} style={{ width: 240, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
      {posicoes.map((p) => {
        const { x, y } = px(p);
        return (
          <g key={p.bailarinoId} transform={`translate(${x}, ${y})`}>
            <Bailarino p={p} cor={corDe(p.bailarinoId)} nome={nomeDe(p.bailarinoId)} />
          </g>
        );
      })}
    </svg>
  );
}

export function exportarPng(svg: SVGSVGElement, nomeFicheiro: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgStr = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = STAGE_W * 3;
    canvas.height = STAGE_H * 3;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement("a");
    a.download = nomeFicheiro;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
}
