import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  EyeOff,
  Fingerprint,
  GitBranch,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";

const GITHUB_URL = (import.meta.env.VITE_GITHUB_URL as string | undefined) ?? "https://github.com";

const FEATURES = [
  {
    icon: Lock,
    title: "Client-side encryption",
    description: "Everything is encrypted with AES-256-GCM in your browser before it ever touches the network.",
  },
  {
    icon: KeyRound,
    title: "Master-key-only access",
    description: "No email, no passwords, no admin approval. Your master key is the only credential.",
  },
  {
    icon: Timer,
    title: "Automatic auto-lock",
    description: "The vault locks itself after inactivity and on refresh. Decrypted data never persists.",
  },
  {
    icon: Server,
    title: "Self-hostable",
    description: "Deploy the backend anywhere with Docker. You own the database, the server, and the data.",
  },
  {
    icon: Fingerprint,
    title: "Zero-knowledge",
    description: "The server stores only encrypted blobs and a salted hash of the auth verifier. Nothing else.",
  },
  {
    icon: Sparkles,
    title: "Open source",
    description: "Audit every line. No telemetry, no tracking, no hidden behaviour. MIT-licensed.",
  },
];

const STEPS = [
  {
    title: "Create your master key",
    description: "A single strong passphrase. It derives your encryption key locally and never leaves your device.",
  },
  {
    title: "Add your credentials",
    description: "Each entry is encrypted in the browser and only ciphertext is stored on the server.",
  },
  {
    title: "Unlock anytime",
    description: "Return and enter your master key to decrypt your vault locally — instantly and privately.",
  },
];

const FAQS = [
  {
    q: "What happens if I forget my master key?",
    a: "It cannot be recovered. Because we operate on a true zero-knowledge model, we never see your key and cannot reset it. Keep a backup of your master key in a safe place.",
  },
  {
    q: "Is my data sent to a server?",
    a: "Only encrypted ciphertext leaves your browser. The server never receives your master key, KEK, or any decrypted credential.",
  },
  {
    q: "Can I self-host My-Vault?",
    a: "Yes. The backend ships with a Dockerfile and Docker Compose configuration. Clone the repo, configure your environment, and run it on your own infrastructure.",
  },
  {
    q: "Which algorithms are used?",
    a: "Argon2id for key derivation, AES-256-GCM for encryption, and a salted Argon2id hash of the auth verifier on the server. Modern, audited primitives only.",
  },
];

const SELF_HOST_SNIPPET = `git clone https://github.com/mohankumaronly/My-Vault.git
cd My-Vault
cp backend/.env.example backend/.env
docker compose up -d`;

export function LandingPage() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(SELF_HOST_SNIPPET);
      toast("Command copied to clipboard", "success");
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-60 dark:opacity-20" aria-hidden="true" />
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-800/20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="brand" className="mx-auto mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Zero-knowledge · AES-256-GCM · Argon2id
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              Your secrets, <span className="text-gradient">encrypted</span> before they leave your browser.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-slate-600 dark:text-slate-300">
              My-Vault is a self-hostable password manager with a true zero-knowledge design.
              No email, no account password — just your master key.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/unlock">
                <Button size="lg">
                  Get Started — it's free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline">
                  <GitBranch className="h-4 w-4" />
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>

          {/* Product mockup */}
          <div className="mx-auto mt-16 max-w-4xl animate-slide-up">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-2 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-slate-400">my-vault.app/dashboard</span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-[180px_1fr]">
                  <div className="hidden flex-col gap-1 sm:flex">
                    {["Dashboard", "All items", "Favorites", "Settings"].map((item, i) => (
                      <div
                        key={item}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          i === 0
                            ? "bg-brand-50 font-medium text-brand-700"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "GitHub", user: "dev@example.com" },
                      { name: "Google", user: "me@gmail.com" },
                      { name: "AWS Console", user: "root-account" },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                            {row.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.name}</p>
                            <p className="text-xs text-slate-400">{row.user}</p>
                          </div>
                        </div>
                        <span className="rounded-md bg-white px-2 py-1 font-mono text-xs text-slate-400 dark:bg-slate-800">••••••••</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 text-center text-sm font-medium text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
          {["AES-256-GCM", "Argon2id", "Zero-knowledge", "Open source"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="brand" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Security that works for you, not against you
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Every design decision favours privacy, speed, and simplicity.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand" className="mb-4">How it works</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Up and running in three steps
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-lg shadow-brand-600/30">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="brand" className="mb-4">Security model</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Your master key never leaves the browser
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              The master key derives two things locally: a Key Encryption Key (KEK) and an auth verifier.
              The KEK wraps a random data key that encrypts your credentials. Only an Argon2id hash of the
              auth verifier is ever sent to the server.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Master key, KEK, and data key stay in browser memory only",
                "Server stores only a salted Argon2id hash of the auth verifier",
                "AES-256-GCM with a fresh nonce for every record",
                "AAD binds each ciphertext to its record identity",
                "Auto-lock after inactivity and on page refresh",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
                  <EyeOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Encrypted payload</p>
                  <p className="text-xs text-slate-400">What the server actually stores</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  <span className="text-slate-400">ciphertext</span>
                  <span className="truncate text-slate-700 dark:text-slate-300">a9F3kL2...xQz8wV</span>
                </div>
                <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  <span className="text-slate-400">nonce</span>
                  <span className="text-slate-700 dark:text-slate-300">mK9pQ2vR</span>
                </div>
                <div className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  <span className="text-slate-400">authVerifierHash</span>
                  <span className="truncate text-slate-700 dark:text-slate-300">$argon2id$v=19...</span>
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                ✓ No plaintext, no master key, no way to decrypt server-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Self-hosting */}
      <section id="self-host" className="scroll-mt-20 bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-4 bg-white/10 text-white ring-white/20">Self-hosting</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Own your vault. Run it anywhere.
              </h2>
              <p className="mt-4 text-slate-300">
                My-Vault is fully self-hostable. Spin up the backend with Docker Compose, point the
                frontend at your API, and you have a private, zero-knowledge password manager.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
                    <GitBranch className="h-4 w-4" />
                    Star on GitHub
                  </Button>
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <button
                  onClick={copySnippet}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-relaxed text-emerald-300">
                <code>{SELF_HOST_SNIPPET}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge tone="brand" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map((faq, index) => {
            const open = openFaq === index;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  onClick={() => setOpenFaq(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-16 text-center shadow-2xl sm:px-12">
          <div className="absolute inset-0 grid-pattern opacity-20" aria-hidden="true" />
          <div className="relative">
            <Zap className="mx-auto h-10 w-10 text-white/90" />
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Ready to take control of your secrets?</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Set up your vault in under a minute. No account, no email, no compromise.
            </p>
            <Link to="/unlock" className="mt-8 inline-block">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
                Open My Vault
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
