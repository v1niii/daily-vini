import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-semibold text-accent sm:text-7xl">404</p>
      <p className="mt-3 text-sm text-muted-foreground">
        this page doesn't exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-foreground no-underline transition-colors duration-200 hover:bg-muted/70"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        back to home
      </Link>
    </div>
  );
}
