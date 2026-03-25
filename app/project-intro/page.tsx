"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Pill } from "@/components/ui";

const slides = [
  {
    title: "痛点",
    headline: "习惯打卡很容易半途而废",
    desc: "多数习惯应用只记录，不激励。我们把“坚持”做成可感知的成长反馈。",
    note: "讲解词：先讲用户痛点，再引出游戏化解决方案。",
  },
  {
    title: "方案",
    headline: "游戏化习惯系统 + 宠物成长",
    desc: "每日任务完成后即时获得积分与经验，驱动宠物阶段进化，形成正反馈闭环。",
    note: "讲解词：强调“任务→奖励→成长→继续任务”闭环。",
  },
  {
    title: "能力",
    headline: "前台体验 + 后台运营一体化",
    desc: "用户端有 Dashboard/图鉴/背包，后台可管理任务、商品、兑换码、宠物资源与同步动作。",
    note: "讲解词：说明这不是 Demo 皮，而是可运营系统。",
  },
  {
    title: "结果",
    headline: "可演示、可扩展、可持续迭代",
    desc: "支持注册登录、实时结算、3D 预览与运营闭环，适合产品演示与后续商业化扩展。",
    note: "讲解词：最后收束到价值与落地能力。",
  },
];

const features = [
  "账号密码注册登录，服务端会话持久化",
  "任务实时结算（积分 + 用户XP + 宠物XP）",
  "宠物成长体系：阶段、图鉴、皮肤、背包",
  "Admin 后台：任务/商品/兑换码/宠物资源管理",
  "支持 3D 预览与阶段资源切换",
];

export default function ProjectIntroPage() {
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showScript, setShowScript] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = useMemo(() => slides[index], [index]);

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setIndex((v) => (v + 1) % slides.length);
    }, 4200);
    return () => clearInterval(id);
  }, [autoPlay]);

  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div ref={wrapRef} className="space-y-6">
      <Card className="relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,164,106,.18),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(168,132,79,.2),transparent_28%)] animate-pulse" />

        <div className="relative border-b border-line px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Pill className="text-accent">演示模式 · Habit Pet</Pill>
            <button onClick={() => setAutoPlay((v) => !v)} className="rounded-full border border-line px-3 py-1 text-xs text-mist hover:border-accent/35 hover:text-ink">
              {autoPlay ? "暂停轮播" : "继续轮播"}
            </button>
            <button onClick={() => setShowScript((v) => !v)} className="rounded-full border border-line px-3 py-1 text-xs text-mist hover:border-accent/35 hover:text-ink">
              {showScript ? "隐藏讲解词" : "显示讲解词"}
            </button>
            <button onClick={toggleFullscreen} className="rounded-full border border-accent/35 px-3 py-1 text-xs text-accent hover:bg-accent/10">
              全屏演示
            </button>
          </div>

          <div className="mt-5 [animation:fadeInUp_.35s_ease]" key={index}>
            <p className="text-sm uppercase tracking-[0.2em] text-accentWarm">{current.title}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">{current.headline}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-mist">{current.desc}</p>
            {showScript ? (
              <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-ink/85">{current.note}</div>
            ) : null}
          </div>

          <div className="mt-5 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-8 rounded-full transition ${i === index ? "bg-accent" : "bg-panelAlt border border-line"}`}
                aria-label={`go-${i}`}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth" className="rounded-full bg-accent px-5 py-3 font-medium text-night transition hover:brightness-105">
              立即体验
            </Link>
            <Link href="/dashboard" className="rounded-full border border-line px-5 py-3 text-mist transition hover:border-accent/35 hover:text-ink">
              进入 Dashboard
            </Link>
          </div>
        </div>

        <div className="relative grid gap-3 px-6 py-5 sm:grid-cols-2 sm:px-8">
          {features.map((item, idx) => (
            <div
              key={item}
              className="rounded-2xl border border-line bg-panelAlt/70 p-4 text-sm text-mist [animation:fadeInUp_.45s_ease_both]"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {item}
            </div>
          ))}
        </div>
      </Card>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
