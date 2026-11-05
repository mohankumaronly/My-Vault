import { useMemo, useState } from "react";
import { KeyRound, Plus, Search, ShieldCheck, X } from "lucide-react";
import { AppLayout } from "../layouts/AppLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Dialog } from "../components/ui/Dialog";
import { Spinner } from "../components/ui/Spinner";
import { useVault } from "../contexts/VaultContext";
import { useToast } from "../components/ui/Toast";
import { CredentialFormDialog } from "../features/credentials/CredentialFormDialog";
import { CredentialRow } from "../features/credentials/CredentialRow";
import type { VaultCredential } from "../types";
import type { PlainCredential } from "../crypto/vaultKey";

export function DashboardPage() {
  const { credentials, loadingCredentials, addCredential, updateCredential, deleteCredential } = useVault();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VaultCredential | null>(null);
  const [deleting, setDeleting] = useState<VaultCredential | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return credentials;
    return credentials.filter((c) =>
      [c.title, c.username, c.url ?? ""].some((field) => field.toLowerCase().includes(q))
    );
  }, [credentials, query]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (credential: VaultCredential) => {
    setEditing(credential);
    setFormOpen(true);
  };

  const handleSubmit = async (data: PlainCredential) => {
    if (editing) {
      await updateCredential(editing.id, data);
      toast("Credential updated", "success");
    } else {
      await addCredential(data);
      toast("Credential added", "success");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCredential(deleting.id);
      toast("Credential deleted", "success");
      setDeleting(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Your vault</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {credentials.length} {credentials.length === 1 ? "credential" : "credentials"} · encrypted locally
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add credential
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by title, username or URL…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            trailing={
              query ? (
                <button
                  onClick={() => setQuery("")}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      {loadingCredentials ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
          <Spinner />
          <p className="text-sm">Decrypting your vault…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-20 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30">
            {credentials.length === 0 ? <KeyRound className="h-7 w-7" /> : <Search className="h-7 w-7" />}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            {credentials.length === 0 ? "Your vault is empty" : "No matching credentials"}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {credentials.length === 0
              ? "Add your first credential. It will be encrypted in your browser before being stored."
              : "Try a different search term."}
          </p>
          {credentials.length === 0 && (
            <Button className="mt-6" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add your first credential
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((credential) => (
            <CredentialRow
              key={credential.id}
              credential={credential}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
        All entries are encrypted with AES-256-GCM in your browser. The server only ever sees ciphertext.
      </div>

      <CredentialFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />

      <Dialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete credential?"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteLoading}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You are about to permanently delete{" "}
          <span className="font-semibold text-slate-900 dark:text-white">{deleting?.title}</span>.
          This will remove the encrypted record from the server.
        </p>
      </Dialog>
    </AppLayout>
  );
}
