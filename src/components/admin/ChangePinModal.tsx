"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Mail, ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import Spinner from "@/components/Spinner";
import { getErrorMessage } from "@/lib/errors";
import {
  REQUEST_PIN_CHANGE_OTP,
  VERIFY_PIN_CHANGE_OTP,
  CHANGE_PIN_WITH_OTP,
} from "@/graphql/mutations";

type Step = "request" | "verify" | "newPin" | "success";

export default function ChangePinModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("request");
  const [code, setCode] = useState("");
  const [pinChangeToken, setPinChangeToken] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const [requestOtp, { loading: requesting }] = useMutation(
    REQUEST_PIN_CHANGE_OTP,
  );
  const [verifyOtp, { loading: verifying }] =
    useMutation(VERIFY_PIN_CHANGE_OTP);
  const [changePin, { loading: changing }] = useMutation(CHANGE_PIN_WITH_OTP);

  const reset = () => {
    setStep("request");
    setCode("");
    setPinChangeToken("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRequestOtp = async () => {
    setError("");
    try {
      await requestOtp();
      setStep("verify");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo enviar el código"));
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }
    try {
      const { data } = await verifyOtp({
        variables: { input: { code } },
      });
      const token = (data as any)?.verifyPinChangeOtp?.pinChangeToken;
      if (!token) throw new Error("No se recibió el token");
      setPinChangeToken(token);
      setStep("newPin");
    } catch (err) {
      setError(getErrorMessage(err, "Código incorrecto"));
    }
  };

  const handleChangePin = async () => {
    setError("");
    if (newPin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }
    if (newPin !== confirmPin) {
      setError("Los PINs no coinciden");
      return;
    }
    try {
      await changePin({
        variables: { input: { pinChangeToken, newPin } },
      });
      setStep("success");
      setTimeout(handleClose, 2000);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cambiar el PIN"));
    }
  };

  const loading = requesting || verifying || changing;

  return (
    <Modal open={open} onClose={handleClose} title="Cambiar PIN">
      {step === "request" && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
              <Mail size={28} className="text-primary" />
            </div>
          </div>
          <p className="text-center text-sm text-on-surface-variant">
            Para cambiar tu PIN, enviaremos un código de verificación a tu email
            registrado.
          </p>
          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
              {error}
            </p>
          )}
          <button
            onClick={handleRequestOtp}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Spinner size={16} /> : null}
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
              <ShieldCheck size={28} className="text-primary" />
            </div>
          </div>
          <p className="text-center text-sm text-on-surface-variant">
            Introduce el código de 6 dígitos que enviamos a tu email.
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            disabled={loading}
            maxLength={6}
            className="h-14 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-center text-2xl font-bold tracking-[0.5em] text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
              {error}
            </p>
          )}
          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Spinner size={16} /> : null}
            {loading ? "Verificando..." : "Verificar"}
          </button>
        </div>
      )}

      {step === "newPin" && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
              <KeyRound size={28} className="text-primary" />
            </div>
          </div>
          <p className="text-center text-sm text-on-surface-variant">
            Introduce tu nuevo PIN de acceso al panel de administración.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Nuevo PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              disabled={loading}
              placeholder="••••••"
              className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm tracking-widest text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Confirmar PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              disabled={loading}
              placeholder="••••••"
              className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm tracking-widest text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
              {error}
            </p>
          )}
          <button
            onClick={handleChangePin}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Spinner size={16} /> : null}
            {loading ? "Guardando..." : "Guardar PIN"}
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <p className="text-center text-sm font-semibold text-on-surface">
            PIN actualizado correctamente
          </p>
        </div>
      )}
    </Modal>
  );
}
