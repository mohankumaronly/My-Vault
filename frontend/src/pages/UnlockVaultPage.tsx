import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Lock } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { PasswordInput } from "../components/ui/Input";
import { useVault } from "../contexts/VaultContext";
import { useToast } from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";

export function UnlockVaultPage() {
  const navigate = useNavigate();
  const { status, unlockVault, refreshStatus } = useVault();
  const { toast } = useToast();

  const [masterKey, setMasterKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect based on vault status.
  useEffect(() => {
    if (status === "unlocked") navigate("/dashboard", { replace: true });
    if (status === "setup") navigate("/setup", { replace: true });
  }, [status, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!masterKey || loading) return;
    setError(null);
    setLoading(true);
    try {
      await unlockVault(masterKey);
      toast("Vault unlocked", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not unlock vault";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Spinner className="h-7 w-7" />
          <p className="text-sm">Checking vault status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => void refreshStatus()}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            Refresh
          </button>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">Unlock your vault</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Enter your master key to decrypt your credentials locally.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <PasswordInput
              label="Master key"
              placeholder="Enter your master key"
              value={masterKey}
              onChange={(e) => {
                setMasterKey(e.target.value);
                if (error) setError(null);
              }}
              autoComplete="current-password"
              autoFocus
              disabled={loading}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} disabled={!masterKey || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Unlock Vault
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            A wrong master key fails locally — before any request reaches the server.
          </p>
        </div>
      </div>
    </div>
  );
}
