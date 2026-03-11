import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDashboardState } from "@/lib/data";
import { formatShanghaiDate } from "@/lib/time";

export default async function HistoryPage() {
  const user = await requireUser();
  const state = await getDashboardState(user.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <Pill className="text-accent">Daily logs</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">Recent days</h1>
        <div className="mt-6 space-y-3">
          {state.recentLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-line bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-white">{log.date}</p>
                <Pill className={log.settledAt ? "text-success" : "text-accentWarm"}>
                  {log.settledAt ? "Settled" : "Open"}
                </Pill>
              </div>
              <p className="mt-2 text-sm text-mist">
                {log.earnedExp} EXP · {log.earnedPoints} points · streak after {log.streakAfter}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Pill className="text-accentWarm">Points ledger</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white">Recent entries</h2>
        <div className="mt-6 space-y-3">
          {state.recentLedger.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-line bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-white">{entry.description}</p>
                <p className={entry.delta >= 0 ? "text-success" : "text-danger"}>{entry.delta >= 0 ? `+${entry.delta}` : entry.delta}</p>
              </div>
              <p className="mt-2 text-sm text-mist">
                {entry.reason} · {formatShanghaiDate(entry.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
