"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const lastRef = useRef<{ msg: string; time: number }>({ msg: "", time: 0 });

  const toast = useCallback((message: string, type: ToastType = "info") => {
    // Deduplicate rapid-fire identical toasts (React Strict Mode, double calls)
    const now = Date.now();
    if (message === lastRef.current.msg && now - lastRef.current.time < 500) {
      return;
    }
    lastRef.current = { msg: message, time: now };

    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle className="h-4 w-4 shrink-0 text-win" />,
    error: <AlertCircle className="h-4 w-4 shrink-0 text-loss" />,
    info: <Info className="h-4 w-4 shrink-0 text-teal" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-[999] flex flex-col items-center gap-2 p-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="pointer-events-auto flex w-full max-w-xs items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
            >
              {icons[t.type]}
              <p className="flex-1 text-[13px] text-foreground">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
