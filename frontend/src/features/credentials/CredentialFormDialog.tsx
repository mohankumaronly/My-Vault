import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input, PasswordInput } from "../../components/ui/Input";
import type { PlainCredential } from "../../crypto/vaultKey";
import type { VaultCredential } from "../../types";

interface CredentialFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PlainCredential) => Promise<void>;
  initial?: VaultCredential | null;
}

interface FormState {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

const emptyState: FormState = { title: "", username: "", password: "", url: "", notes: "" };

export function CredentialFormDialog({ open, onClose, onSubmit, initial }: CredentialFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        username: initial.username,
        password: initial.password,
        url: initial.url ?? "",
        notes: initial.notes ?? "",
      });
    } else {
      setForm(emptyState);
    }
    setError(null);
  }, [open, initial]);

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const canSubmit = form.title.trim().length > 0 && form.password.length > 0 && !saving;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: form.title.trim(),
        username: form.username.trim(),
        password: form.password,
        url: form.url.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save credential");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Edit credential" : "Add credential"}
      description={initial ? "Update the details below." : "Your data is encrypted locally before it is saved."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="credential-form" loading={saving} disabled={!canSubmit}>
            {initial ? "Save changes" : "Add credential"}
          </Button>
        </>
      }
    >
      <form id="credential-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. GitHub"
          value={form.title}
          onChange={update("title")}
          autoFocus
          required
        />
        <Input
          label="Username or email"
          placeholder="you@example.com"
          value={form.username}
          onChange={update("username")}
        />
        <PasswordInput
          label="Password"
          placeholder="Enter a password"
          value={form.password}
          onChange={update("password")}
          required
        />
        <Input
          label="Website URL"
          placeholder="https://example.com"
          value={form.url}
          onChange={update("url")}
          type="url"
        />
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notes
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={update("notes")}
            rows={3}
            placeholder="Optional notes…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
      </form>
    </Dialog>
  );
}
