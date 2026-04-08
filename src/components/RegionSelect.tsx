"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const REGIONS = ["eu", "na", "ap", "kr", "br", "latam"] as const;

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function RegionSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-muted px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted/70"
      >
        {value.toUpperCase()}
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 z-50 mt-1 min-w-[80px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer px-3 py-1.5 text-sm transition-colors duration-100 ${
                  r === value
                    ? "font-medium text-accent"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
