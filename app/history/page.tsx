import { PointsLedger, RedeemCodeStatus } from "@prisma/client";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDashboardState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { formatShanghaiDate } from "@/lib/time";

function getLedgerReason(reason: string) {
  switch (reason) {
    case "daily_settlement":
      return zhCN.ledger.dailySettlementReason;
    case "makeup_settlement":
      return zhCN.ledger.makeupSettlementReason;
    case "makeup_card_used":
      return zhCN.ledger.makeupCardUsedReason;
    case "shop_makeup_card":
      return zhCN.ledger.shopMakeupCardReason;
    case "shop_coupon":
      return zhCN.ledger.shopCouponReason;
    default:
      return reason;
  }
}

function getLedgerDescription(entry: PointsLedger) {
  try {
    const meta = entry.metaJson ? (JSON.parse(entry.metaJson) as { date?: string; name?: string }) : {};

    switch (entry.reason) {
      case "daily_settlement":
        return formatText(zhCN.ledger.dailySettlement, { date: meta.date ?? "" });
      case "makeup_settlement":
        return formatText(zhCN.ledger.makeupSettlement, { date: meta.date ?? "" });
      case "makeup_card_used":
        return formatText(zhCN.ledger.usedMakeupCard, { date: meta.date ?? "" });
      case "shop_makeup_card":
        return zhCN.ledger.purchasedMakeupCard;
      default:
        return entry.description;
    }
  } catch {
    return entry.description;
  }
}

function getRedeemStatusLabel(status: RedeemCodeStatus) {
  switch (status) {
    case "ISSUED":
      return zhCN.history.issued;
    case "REDEEMED":
      return zhCN.history.redeemed;
    case "VOID":
      return zhCN.history.void;
  }
}

export default async function HistoryPage() {
  const user = await requireUser();
  const state = await getDashboardState(user.id);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <Pill className="text-accent">{zhCN.history.logsBadge}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.history.logsTitle}</h1>
        <p className="mt-3 text-sm text-mist">{zhCN.history.timezoneHint}</p>
        <div className="mt-6 space-y-3">
          {state.recentLogs.length === 0 ? (
            <p className="text-sm text-mist">{zhCN.history.emptyLogs}</p>
          ) : (
            state.recentLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{log.date}</p>
                  <Pill className={log.settledAt ? "text-success" : "text-accentWarm"}>
                    {log.settledAt ? zhCN.history.settled : zhCN.history.open}
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-mist">
                  {formatText(zhCN.history.logSummary, {
                    exp: log.earnedExp,
                    points: log.earnedPoints,
                    streak: log.streakAfter,
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <Pill className="text-accentWarm">{zhCN.history.pointsBadge}</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white">{zhCN.history.pointsTitle}</h2>
        <p className="mt-3 text-sm text-mist">{zhCN.history.timezoneHint}</p>
        <div className="mt-6 space-y-3">
          {state.recentLedger.length === 0 ? (
            <p className="text-sm text-mist">{zhCN.history.emptyLedger}</p>
          ) : (
            state.recentLedger.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{getLedgerDescription(entry)}</p>
                  <p className={entry.delta >= 0 ? "text-success" : "text-danger"}>
                    {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                  </p>
                </div>
                <p className="mt-2 text-sm text-mist">
                  {formatText(zhCN.history.entrySummary, {
                    reason: getLedgerReason(entry.reason),
                    date: formatShanghaiDate(entry.createdAt),
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <Pill className="text-accent">{zhCN.history.purchasesBadge}</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white">{zhCN.history.purchasesTitle}</h2>
        <p className="mt-3 text-sm text-mist">{zhCN.history.timezoneHint}</p>
        <div className="mt-6 space-y-3">
          {state.recentPurchases.length === 0 ? (
            <p className="text-sm text-mist">{zhCN.history.emptyPurchases}</p>
          ) : (
            state.recentPurchases.map((purchase) => (
              <div key={purchase.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <p className="font-medium text-white">
                  {formatText(zhCN.history.purchaseSummary, {
                    item: purchase.item.nameZh,
                    quantity: purchase.quantity,
                    cost: purchase.totalCost,
                  })}
                </p>
                <p className="mt-2 text-sm text-mist">{formatShanghaiDate(purchase.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <Pill className="text-accentWarm">{zhCN.history.redeemCodesBadge}</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white">{zhCN.history.redeemCodesTitle}</h2>
        <p className="mt-3 text-sm text-mist">{zhCN.history.timezoneHint}</p>
        <div className="mt-6 space-y-3">
          {state.recentRedeemCodes.length === 0 ? (
            <p className="text-sm text-mist">{zhCN.history.emptyRedeemCodes}</p>
          ) : (
            state.recentRedeemCodes.map((code) => (
              <div key={code.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{code.item.nameZh}</p>
                  <Pill>{getRedeemStatusLabel(code.status)}</Pill>
                </div>
                <p className="mt-2 break-all text-sm text-white">
                  {formatText(zhCN.history.codeValue, { code: code.id })}
                </p>
                <p className="mt-2 text-sm text-mist">
                  {formatText(zhCN.history.codeSummary, {
                    item: code.item.nameZh,
                    date: formatShanghaiDate(code.issuedAt),
                  })}
                </p>
                {code.adminNote ? (
                  <p className="mt-2 text-sm text-mist">
                    {formatText(zhCN.history.adminNote, { note: code.adminNote })}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
