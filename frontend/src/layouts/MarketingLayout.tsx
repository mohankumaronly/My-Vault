import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X, GitBranch, ArrowRight } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Self-host", href: "#self-host" },
  { label: "FAQ", href: "#faq" },
];

const GITHUB_URL = (import.meta.env.VITE_GITHUB_URL as string | undefined) ?? "https://github.com";

export function MarketingLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="My-Vault home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/unlock">
              <Button size="sm" variant="ghost">
                Open Vault
              </Button>
            </Link>
            <Link to="/unlock">
              <Button size="sm">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button
            className="rounded-lg p-2 text-slate-600 md:hidden dark:text-slate-300"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/unlock" onClick={() => setMobileOpen(false)}>
                <Button fullWidth size="sm">Open Vault</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
            <div className="max-w-sm">
              <Logo />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                A zero-knowledge password manager you can self-host. Your master key never leaves your browser.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <div>
                <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Product</h4>
                <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                  <li><a href="#features" className="hover:text-brand-600">Features</a></li>
                  <li><a href="#security" className="hover:text-brand-600">Security</a></li>
                  <li><a href="#self-host" className="hover:text-brand-600">Self-hosting</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Resources</h4>
                <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                  <li><a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-brand-600">GitHub</a></li>
                  <li><a href="#faq" className="hover:text-brand-600">FAQ</a></li>
                  <li><Link to="/unlock" className="hover:text-brand-600">Open Vault</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Legal</h4>
                <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                  <li><span>MIT License</span></li>
                  <li><span>Open source</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
            © {new Date().getFullYear()} My-Vault · Built with zero-knowledge encryption.
          </div>
        </div>
      </footer>
    </div>
  );
}
