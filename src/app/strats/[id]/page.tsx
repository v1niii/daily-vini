"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function SharedStrat() {
  const router = useRouter();
  const { id } = useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/strats?id=${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        sessionStorage.setItem("dv-import-strat", JSON.stringify(data));
        router.replace("/strats");
      })
      .catch(() => setError(true));
  }, [id, router]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">strat not found</p>
        <button onClick={() => router.push("/strats")} className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white">
          go to strats
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        loading strat...
      </div>
    </div>
  );
}
