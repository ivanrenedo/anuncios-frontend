"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { Phone, ShieldCheck, X } from "lucide-react";
import { SEND_PHONE_OTP, VERIFY_PHONE_OTP } from "@/graphql/mutations";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/errors";
import Spinner from "@/components/Spinner";

export default function PhoneVerificationModal({
  onClose,
}: {
  onClose?: () => void;
} = {}) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  const [sendOtp, { loading: sendingOtp }] = useMutation(SEND_PHONE_OTP);
  const [verifyOtp, { loading: verifyingOtp }] =
    useMutation(VERIFY_PHONE_OTP);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const fullPhone = `+240${phone.replace(/\s/g, "")}`;
  const loading = sendingOtp || verifyingOtp;

  const handleSendCode = async () => {
    setError("");
    if (phone.replace(/\s/g, "").length < 6) {
      setError("Ingresa un número de teléfono válido");
      return;
    }
    try {
      await sendOtp({ variables: { input: { phone: fullPhone } } });
      setStep("code");
      setResendTimer(60);
      setTimeout(() => codeRef.current?.focus(), 200);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo enviar el código"));
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }
    try {
      await verifyOtp({ variables: { input: { code } } });
      await useAuthStore.getState().refresh();
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err, "Código incorrecto"));
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setError("");
    setCode("");
    try {
      await sendOtp({ variables: { input: { phone: fullPhone } } });
      setResendTimer(60);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo reenviar el código"));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-surface-lowest p-8 shadow-card">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-container"
          >
            <X size={18} />
          </button>
        )}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
            {step === "phone" ? (
              <Phone size={36} className="text-primary" />
            ) : (
              <ShieldCheck size={36} className="text-primary" />
            )}
          </div>
        </div>

        {step === "phone" ? (
          <>
            <h2 className="mb-2 text-center text-xl font-bold text-on-surface">
              Verifica tu teléfono
            </h2>
            <p className="mb-6 text-center text-sm text-on-surface-variant">
              Para usar Market EG necesitas verificar tu número de teléfono.
            </p>

            <div className="mb-4 flex gap-2">
              <div className="flex h-11 items-center rounded-xl border border-outline-variant/50 bg-surface px-4 text-sm font-semibold text-on-surface">
                +240
              </div>
              <input
                type="tel"
                inputMode="tel"
                placeholder="Número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                maxLength={12}
                className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
                {error}
              </p>
            )}

            <button
              onClick={handleSendCode}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Spinner size={16} /> : null}
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-center text-xl font-bold text-on-surface">
              Introduce el código
            </h2>
            <p className="mb-6 text-center text-sm text-on-surface-variant">
              Hemos enviado un SMS al {fullPhone}
            </p>

            <input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={loading}
              maxLength={6}
              className="mb-4 h-14 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-center text-2xl font-bold tracking-[0.5em] text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {error && (
              <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
                {error}
              </p>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Spinner size={16} /> : null}
              {loading ? "Verificando..." : "Verificar"}
            </button>

            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className="text-sm font-semibold text-primary disabled:opacity-50"
              >
                {resendTimer > 0
                  ? `Reenviar código (${resendTimer}s)`
                  : "Reenviar código"}
              </button>
              <button
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError("");
                }}
                className="text-sm font-semibold text-primary"
              >
                Cambiar número
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
