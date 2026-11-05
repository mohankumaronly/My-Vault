import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, Lock, ShieldCheck } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { PasswordInput } from "../components/ui/Input";
import { useVault } from "../contexts/VaultContext";
import { useToast } from "../components/ui/Toast";
import { evaluatePasswordStrength } from "../utils/passwordStrength";

const MIN_LENGTH = 12;

export function SetupVaultPage() {
  const navigate = useNavigate();
  const { setupVault } = useVault();
  const { toast } = useToast();

  const [masterKey, setMasterKey] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(masterKey);
  const tooShort = masterKey.length > 0 && masterKey.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && masterKey !== confirm;
  const canSubmit =
    masterKey.length >= MIN_LENGTH && masterKey === confirm && acknowledged && !loading;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await setupVault(masterKey);
      toast("Vault created successfully. Welcome!", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create vault";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">Create your vault</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Choose a strong master key. It encrypts everything and never leaves your browser.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <PasswordInput
              label="Master key"
              placeholder="Enter a strong master key"
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              autoComplete="new-password"
              autoFocus
              error={tooShort ? `Master key must be at least ${MIN_LENGTH} characters` : undefined}
            />

            {masterKey.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        strength.score >= i ? strength.color : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{strength.label}</span>
                  <span className="text-slate-400">{strength.hint}</span>
                </div>
              </div>
            )}

            <PasswordInput
              label="Confirm master key"
              placeholder="Re-enter your master key"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              error={mismatch ? "Master keys do not match" : undefined}
            />

            {mismatch ? null : masterKey && masterKey === confirm && masterKey.length >= MIN_LENGTH ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Master keys match
              </p>
            ) : null}

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-semibold">This key cannot be recovered.</p>
                  <p className="mt-1">
                    If you lose your master key, your data is permanently inaccessible. There is no reset.
                    Store it in a safe place.
                  </p>
                </div>
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-medium text-amber-900 dark:text-amber-100">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 text-brand-600 focus:ring-brand-500"
                />
                I understand my master key cannot be recovered if lost.
              </label>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} disabled={!canSubmit}>
              <Lock className="h-4 w-4" />
              Create Vault
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Your master key is processed locally with Argon2id. Only a derived auth verifier hash is sent to the server.
          </p>
        </div>
      </div>
    </div>
  );
}
