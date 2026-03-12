# 习惯宠物（habit-pet）迭代记录

> 目标：记录每次迭代做了什么、为什么做、改动范围与验证方式，便于回溯与复盘。

## 项目信息
- Repo：https://github.com/macpipixia-lang/habit-pet
- 技术栈：Next.js App Router + Tailwind + Prisma(SQLite)
- 本地启动：`npm run dev`
- 强制干净启动（解决 .next / Prisma Client 不一致导致的 500）：`npm run dev:clean`

---

## Milestone 1（MVP）：账号 + 每日任务结算 + EXP/等级 + 积分 + 补签卡

### 完成内容
- 账号密码注册/登录（session cookie），跨设备同步（服务端数据库）。
- 今日任务清单：勾选 → 结算（一天一次，Asia/Shanghai）。
- EXP 与等级（等级上限 30，后续改为指数曲线；满级后 EXP 继续累计但不再升级）。
- 积分流水（PointsLedger）与历史记录（DailyLog）。
- 补签卡：可用积分兑换，价格递增；可补“昨天”。
- Debug：dev-only reset/health 等辅助接口。

### 主要文件/模块
- `app/actions.ts`：登录/结算/商店/补签等 server actions。
- `lib/data.ts`：核心事务逻辑与聚合 state。
- `prisma/schema.prisma`、`prisma/seed.ts`：数据模型与种子。

### 验证方式
- 注册/登录 → /today 勾选任务并结算 → /pet 查看等级/经验 → /shop 兑换补签卡 → /history 验证流水与记录。

---

## Milestone 2A：商店扩展 + 兑换券/兑换码 + Admin 管理

### 完成内容
- 商店升级为多商品：
  - `MAKEUP_CARD`（补签卡）
  - `COUPON`（兑换券：生成 UUID 兑换码）
- 兑换码：ISSUED/REDEEMED/VOID 状态流转，用户侧可查看并复制。
- `/admin` 后台：ADMIN_SECRET 保护；支持商品管理、兑换码筛选/搜索/核销/作废与备注。
- 修复 admin 任务新增缺少 isActive 导致提交报错。
- 后台拆分导航：`/admin`（概览）+ `/admin/items` + `/admin/codes` + `/admin/tasks`。

### 验证方式
- /shop 购买兑换券 → 弹出 UUID → /history 可见；
- /admin/codes 搜索该 UUID → 标记 REDEEMED/VOID → /history 状态同步。

---

## Milestone 2B：任务池 + 解锁条件 + 性能/UX

### 完成内容
- 任务从硬编码模板升级为 DB 任务池 `TaskDefinition`：
  - `unlockLevel`：等级解锁
  - `unlockAfterTaskSlug`：完成前置任务解锁
- `DailyLog.tasksJson` 固化当天任务列表，保证历史稳定。
- /today 增加“未解锁”折叠区与解锁提示。
- /admin 增加任务管理，并把 `unlockAfterTaskSlug` 改为下拉选择。
- 完成任务索引：`Profile.completedTaskSlugsJson`（避免反复扫 DailyLog JSON）；结算时事务内更新。
- dev-only 健康检查：`GET /api/debug/health`。

### 验证方式
- /admin/tasks 设置 unlockLevel / 前置任务 → /today 查看是否隐藏/提示；
- 完成前置任务后，第二天或重置后验证解锁出现。

---

## 宠物模块（v1）：宠物蛋 + 宠物 XP 阶段 + 图鉴

### 完成内容
- 数据模型：`PetSpecies` / `PetStage` / `UserPet`。
- 规则：宠物阶段与 **宠物 XP** 绑定（每日结算时 active pet 获取 XP）。
- 宠物蛋：`/shop/pet-egg` 选择物种后购买获得宠物。
- /pet：查看当前宠物、阶段与进度、切换出战宠物。
- /pokedex：图鉴页；后续增强为带筛选/排序/搜索与详情页 `/pokedex/[slug]`。

### 图鉴增强（Option C）
- /pokedex：已拥有/未拥有筛选、稀有度/名称排序、名称搜索、收集进度。
- /pokedex/[slug]：阶段时间轴、大图、minXp；已拥有时展示当前阶段高亮；未拥有给去商店领取引导。

---

## 宠物自定义与虚拟商品闭环：昵称 + 皮肤 + 阶段解锁

### 完成内容
- 宠物昵称：每只宠物可改昵称（1–12 字，可清空）。
- 皮肤系统：`PetSkin` / `UserPetSkin`，`UserPet.activeSkinId`。
- 商店购买皮肤（积分兑换），防重复购买。
- 皮肤阶段解锁：`PetSkin.stageIndex` 作为最低阶段门槛；/pet 禁用并提示；服务端强校验。
- 商店 gating：必须先拥有对应物种才允许买其皮肤。

---

## 背包模块：统一查看与操作

### 完成内容
- 新增 `/backpack`：统一查看/操作已拥有宠物、皮肤、兑换码、补签卡。
- 支持在背包里直接：切换出战宠物、改昵称、应用/移除皮肤、复制兑换码。
- 导航新增“背包”。

---

## 新手引导：每个用户可免费领取一次宠物

### 完成内容
- 新增 `/onboarding/pet-egg`：欢迎领取第一只宠物，选择物种后立即获得（免费）。
- 注册后直接进入 onboarding；登录后若无宠物则进入 onboarding。
- 全局防绕过：已登录但无宠物时访问 `/pet /today /shop /backpack /pokedex /history` 会重定向到 onboarding。
- 提示文案与成功/失败反馈已中文化。

---

## 开发环境稳定性（经验总结）

### 常见问题
- Next dev 在大量改动（尤其路由/Server Actions/Prisma schema）后，`.next` 产物可能与代码/Prisma Client 不一致，引发：
  - `Cannot find module './xxx.js'`
  - `.next/routes-manifest.json` 缺失
  - `Failed to find Server Action ...`
  - `prisma.xxx is undefined`

### 解决方式（已固化为脚本）
- 统一使用：

```bash
npm run dev:clean
```

该命令会自动：清理 `.next` → `prisma generate` → `prisma db push` → 启动 `next dev`。

---

## 里程碑时间线（commit 摘要）
- `3e456ec` feat: backpack module
- `9ee8ddb` feat: starter pet onboarding

> 注：更早的 commit 请在 GitHub 提交历史中查看。
