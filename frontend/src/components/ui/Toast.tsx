import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastType, { ring: string; icon: ReactNode }> = {
  success: { ring: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> },
  error: { ring: "border-red-200 bg-red-50 text-red-800", icon: <AlertCircle className="h-4 w-4 text-red-600" /> },
  info: { ring: "border-brand-200 bg-brand-50 text-brand-800", icon: <Info className="h-4 w-4 text-brand-600" /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => {
          const s = styles[item.type];
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-up",
                s.ring
              )}
              role="status"
            >
              <span className="mt-0.5 shrink-0">{s.icon}</span>
              <p className="flex-1 text-sm font-medium">{item.message}</p>
              <button onClick={() => remove(item.id)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
