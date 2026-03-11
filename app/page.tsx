import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { zhCN } from "@/lib/i18n/zhCN";

export default function LandingPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-line px-6 py-5">
          <Pill className="text-accent">{zhCN.landing.badge}</Pill>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            {zhCN.landing.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-mist">
            {zhCN.landing.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth" className="rounded-full bg-accent px-5 py-3 font-medium text-slate-950">
              {zhCN.landing.primaryCta}
            </Link>
            <Link href="/today" className="rounded-full border border-line px-5 py-3 text-mist">
              {zhCN.landing.secondaryCta}
            </Link>
          </div>
        </div>
        <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
          {zhCN.landing.highlights.map((item) => (
            <div key={item} className="rounded-2xl border border-line bg-black/20 p-4 text-sm text-mist">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col justify-between">
        <div>
          <Pill className="text-accentWarm">{zhCN.landing.loopBadge}</Pill>
          <ol className="mt-4 space-y-4 text-sm text-mist">
            {zhCN.landing.loopSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="mt-8 rounded-3xl border border-accent/20 bg-accent/10 p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">{zhCN.landing.designBadge}</p>
          <p className="mt-3 text-sm leading-7 text-white/80">{zhCN.landing.designDescription}</p>
        </div>
      </Card>
    </div>
  );
}
