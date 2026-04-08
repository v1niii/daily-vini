"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, Clock, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FadeUp } from "@/components/Motion";
import { useToast } from "@/components/Toast";
import RegionSelect from "@/components/RegionSelect";
import { motion } from "framer-motion";

interface StatusUpdate {
  created_at: string;
  translations: { locale: string; content: string }[];
}

interface StatusEvent {
  titles: { locale: string; content: string }[];
  maintenance_status?: string;
  incident_severity?: string;
  updates: StatusUpdate[];
}

interface PlatformData {
  id: string;
  name: string;
  maintenances: StatusEvent[];
  incidents: StatusEvent[];
}

function getLocalized(
  arr: { locale: string; content?: string; title?: string }[]
): string {
  if (!arr?.length) return "";
  const en = arr.find((t) => t.locale === "en_US") || arr[0];
  return en.content || en.title || "";
}

export default function StatusPage() {
  const [region, setRegion] = useState("na");
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function loadStatus() {
    setLoading(true);
    setData(null);

    try {
      const res = await fetch(`/api/status?region=${region}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load status.");
      setData(json);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const hasIssues =
    data && (data.maintenances.length > 0 || data.incidents.length > 0);

  return (
    <>
      <FadeUp>
        <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          platform health
        </p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">server status</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          real-time valorant platform status for any region.
        </p>

        <div className="mt-6 flex items-center gap-2">
          <RegionSelect value={region} onChange={setRegion} />
          <Button onClick={loadStatus}>
            <Zap className="h-3.5 w-3.5" />
            check status
          </Button>
        </div>
      </FadeUp>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {data && (
        <FadeUp delay={0.05} className="mt-8 space-y-6 sm:mt-10">
          <Card>
            <CardContent className="flex items-center gap-3 sm:gap-4">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                  hasIssues ? "bg-draw/10" : "bg-win/10"
                }`}
              >
                {hasIssues ? (
                  <AlertTriangle className="h-4 w-4 text-draw" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-win" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {data.name || "Valorant"} — {region.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasIssues
                    ? `${data.maintenances.length} maintenance, ${data.incidents.length} incident(s)`
                    : "all systems operational"}
                </p>
              </div>
            </CardContent>
          </Card>

          {data.maintenances.length > 0 && (
            <div>
              <p className="mb-3 text-[13px] font-medium text-muted-foreground">
                maintenance
              </p>
              <div className="space-y-3">
                {data.maintenances.map((m, i) => (
                  <motion.div
                    key={`m-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <EventCard event={m} type="maintenance" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {data.incidents.length > 0 && (
            <div>
              <p className="mb-3 text-[13px] font-medium text-muted-foreground">
                incidents
              </p>
              <div className="space-y-3">
                {data.incidents.map((inc, i) => (
                  <motion.div
                    key={`i-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <EventCard event={inc} type="incident" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </FadeUp>
      )}
    </>
  );
}

function EventCard({ event, type }: { event: StatusEvent; type: string }) {
  const title = getLocalized(event.titles) || "Untitled";
  const severity =
    event.maintenance_status || event.incident_severity || "unknown";

  return (
    <Card>
      <CardContent>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={type === "incident" ? "incident" : "maintenance"}>
            {type}
          </Badge>
          <Badge variant="default">{severity}</Badge>
        </div>
        <p className="mb-2 text-sm font-medium">{title}</p>
        {event.updates.length > 0 ? (
          <div className="space-y-2">
            {event.updates.map((u, i) => {
              const msg = getLocalized(u.translations) || "No details.";
              const time = u.created_at
                ? new Date(u.created_at).toLocaleString()
                : "";
              return (
                <div key={i} className="border-t border-border pt-2">
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="truncate">{time}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{msg}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">no updates yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
