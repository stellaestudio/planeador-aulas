import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { supabase } from "../../dados/supabase";
import { Card, Field, GhostButton, inputClass, PrimaryButton } from "../../ui";

// Entrada sem password: a professora escreve o email e recebe um código (e um link).
// O código é o mais prático na app instalada no telemóvel, porque o link abre no browser.
export function Entrar() {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [aEsperar, setAEsperar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return setErro("Escreve um email válido.");
    setAEsperar(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { emailRedirectTo: window.location.origin } });
    setAEsperar(false);
    if (error) return setErro(traduzir(error.message));
    setEmail(e);
    setEnviado(true);
  };

  const confirmar = async () => {
    const token = codigo.replace(/\D/g, "");
    if (token.length < 6) return setErro("O código tem pelo menos 6 algarismos.");
    setAEsperar(true);
    setErro(null);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setAEsperar(false);
    if (error) setErro(traduzir(error.message));
    // Se correr bem, a sessão muda e a app abre sozinha.
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center justify-center gap-2">
            <Sparkles size={22} className="text-pink-400" /> Planeador de aulas
          </h1>
          <p className="text-sm text-gray-500 mt-1">Turmas, biblioteca e planeamento de aulas</p>
        </div>

        <Card>
          {!enviado ? (
            <div className="flex flex-col gap-3">
              <Field label="O teu email">
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviar()}
                  placeholder="nome@exemplo.com"
                />
              </Field>
              <PrimaryButton onClick={enviar} disabled={aEsperar}><Mail size={16} /> {aEsperar ? "A enviar…" : "Receber código"}</PrimaryButton>
              <p className="text-[11px] text-gray-400">Sem password: enviamos-te um código por email. Se for a primeira vez, a conta é criada.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                Enviámos um email para <strong>{email}</strong>. Escreve aqui o código que lá vem (ou toca no link do email).
              </p>
              <Field label="Código">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  className={`${inputClass} tracking-widest text-center text-lg!`}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmar()}
                  placeholder="123456"
                />
              </Field>
              <PrimaryButton onClick={confirmar} disabled={aEsperar}>{aEsperar ? "A confirmar…" : "Entrar"}</PrimaryButton>
              <GhostButton onClick={() => { setEnviado(false); setCodigo(""); setErro(null); }} className="text-xs!">Usar outro email / enviar de novo</GhostButton>
            </div>
          )}
          {erro && <p className="text-xs text-red-500 mt-3">{erro}</p>}
        </Card>
      </div>
    </div>
  );
}

function traduzir(msg: string): string {
  if (/rate limit|security purposes|only request this/i.test(msg)) return "Foram pedidos demasiados emails. Espera um bocadinho e tenta de novo.";
  if (/expired|invalid/i.test(msg)) return "Código errado ou fora de prazo. Pede um novo.";
  if (/not authorized|not allowed/i.test(msg)) return "Este email ainda não pode receber emails da app.";
  return `Não foi possível: ${msg}`;
}
