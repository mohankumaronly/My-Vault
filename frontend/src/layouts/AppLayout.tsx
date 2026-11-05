import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { useVault } from "../contexts/VaultContext";
import { useToast } from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { status, lockVault, vaultId, unlockExpiresAt } = useVault();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "locked") navigate("/unlock", { replace: true });
    if (status === "setup") navigate("/setup", { replace: true });
  }, [status, navigate]);

  if (status === "checking" || status === "locked" || status === "setup") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const onLock = async () => {
    await lockVault();
    toast("Vault locked", "info");
    navigate("/unlock", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex dark:bg-emerald-900/30 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Unlocked
            </div>
            <Button variant="outline" size="sm" onClick={onLock}>
              <Lock className="h-4 w-4" />
              Lock vault
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        Vault <span className="font-mono">{vaultId?.slice(0, 8) ?? "—"}</span>
        {unlockExpiresAt && (
          <span className="ml-3">· Auto-locks on inactivity</span>
        )}
      </footer>
    </div>
  );
}
