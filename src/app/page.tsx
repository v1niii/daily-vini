"use client";

import { useState } from "react";
import { ArrowRight, Trophy, Crosshair, Activity, TrendingUp, Search, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FadeUp } from "@/components/Motion";
import { useToast } from "@/components/Toast";
import RegionSelect from "@/components/RegionSelect";
import Link from "next/link";
import { type ComponentType } from "react";

export default function Home() {
  const [lbRegion, setLbRegion] = useState("na");
  const [lbData, setLbData] = useState<any[] | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const { toast } = useToast();

  async function loadLeaderboard() {
    setLbLoading(true);
    setLbData(null);

    try {
      const contentRes = await fetch(`/api/content?region=${lbRegion}`);
      if (!contentRes.ok) {
        const errData = await contentRes.json().catch(() => ({}));
        throw new Error(errData.error || `Content API error: ${contentRes.status}`);
      }
      const content = await contentRes.json();
      const acts = content.acts || [];
      const active =
        acts.find(
          (a: any) =>
            a.isActive && a.parentId && !a.parentId.startsWith("00000000")
        ) || acts.find((a: any) => a.isActive);
      if (!active) throw new Error("Could not determine current act.");

      const res = await fetch(
        `/api/leaderboard?region=${lbRegion}&actId=${active.id}&size=50&startIndex=0`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load leaderboard.");
      setLbData(data.players || []);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLbLoading(false);
    }
  }

  const navItems: { label: string; href: string; sub: string; icon: ComponentType<{ className?: string }> }[] = [
    { label: "leaderboard", href: "/", sub: "top 50 players", icon: Trophy },
    { label: "agents", href: "/agents", sub: "pick priority", icon: Crosshair },
    { label: "strats", href: "/strats", sub: "map planner", icon: Map },
    { label: "status", href: "/status", sub: "server health", icon: Activity },
  ];

  return (
    <>
      <FadeUp className="flex flex-col items-center px-2 pb-10 pt-12 text-center sm:pb-12 sm:pt-16">
        <p className="mb-3 text-sm text-muted-foreground">valorant companion</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          track your competitive edge
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          leaderboards, agent picks, and server status — all in one clean place.
        </p>

        <div className="mt-8 flex items-center gap-2">
          <RegionSelect value={lbRegion} onChange={setLbRegion} />
          <Button onClick={loadLeaderboard}>
            analyze
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </FadeUp>

      <FadeUp delay={0.1} className="mb-12 sm:mb-14">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="group no-underline">
              <Card className="text-center transition-colors duration-200 hover:bg-muted/50">
                <CardContent className="flex flex-col items-center gap-1.5 py-4 sm:gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-accent" />
                  <div>
                    <p className="text-xs font-medium text-foreground sm:text-sm">{item.label}</p>
                    <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">{item.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </FadeUp>

      <FadeUp delay={0.18}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            leaderboard
          </p>
          <div className="flex items-center gap-2">
            <RegionSelect value={lbRegion} onChange={setLbRegion} />
            <Button variant="secondary" size="sm" onClick={loadLeaderboard}>
              load
            </Button>
          </div>
        </div>

        {lbLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        {lbData && lbData.length > 0 && (
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {lbData.slice(0, 50).map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-muted/50 sm:gap-4 sm:px-5 sm:py-3"
                >
                  <span className="w-6 text-xs font-semibold text-accent">
                    {p.leaderboardRank ?? i + 1}
                  </span>
                  <div className="min-w-0 flex-1 truncate">
                    <span className="text-xs font-medium sm:text-sm">
                      {p.gameName || "Hidden"}
                    </span>
                    {p.tagLine && (
                      <span className="ml-1 text-xs text-muted-foreground sm:text-sm">
                        #{p.tagLine}
                      </span>
                    )}
                  </div>
                  <Badge variant="teal" className="hidden sm:inline-flex">{p.rankedRating ?? "—"} RR</Badge>
                  <span className="text-xs text-muted-foreground sm:hidden">{p.rankedRating ?? "—"}</span>
                  <span className="w-10 text-right text-xs text-win sm:w-12">
                    {p.numberOfWins ?? "—"} W
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {lbData && lbData.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            no data available for this region.
          </p>
        )}

        {!lbLoading && !lbData && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Search className="h-5 w-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              select a region and press analyze to get started.
            </p>
          </div>
        )}
      </FadeUp>
    </>
  );
}
