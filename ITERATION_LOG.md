# 习惯宠物（habit-pet）迭代记录

> 目标：记录每次迭代做了什么、为什么做、改动范围与验证方式，便于回溯与复盘。

## 项目信息
- Repo：https://github.com/macpipixia-lang/habit-pet
- 技术栈：Next.js App Router + Tailwind + Prisma(PostgreSQL)
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

## 运营/部署：Postgres + Vercel（生产可用）

### 完成内容
- Prisma 从 SQLite 迁移到 PostgreSQL，适配 Vercel Serverless（`migrate deploy`）。
- `vercel-build` 串联：`prisma generate` → `prisma migrate deploy` → `prisma:seed` → `next build`。
- 本机安装并启动 `postgresql@16`，创建 `habit_pet` 数据库与 `habit` 用户。

### 验证方式
- 本地：`pg_isready` 可连；`npm run prisma:seed` 成功；`npm run build` 成功；`npm run dev` 正常启动。
- 线上：Vercel 部署通过，`/api/debug/health` 正常。

---

## Pet 3D（v0）：加载态修复 + 资源策略调整

### 完成内容
- 修复“3D 模型加载中...”常驻：使用 `model-viewer` 的 `load/error` 事件控制 overlay。
- 线上构建时避免 Git LFS 指针文件导致 `.glb` 失效：将 `public/pet3d/*.glb` 从 LFS 撤回普通 Git 文件。

### 验证方式
- `/pet/3d`：模型加载成功后加载提示消失；失败显示友好中文提示。
- 线上访问 `/pet3d/pet.glb` 返回真实二进制（非 1KB LFS pointer）。

---

## Admin：宠物管理 + Vercel Blob（物种级）

### 完成内容
- 新增后台模块：`/admin/pets`（列表）+ `/admin/pets/new` + `/admin/pets/[id]`。
- `PetSpecies` 增加字段：`summaryZh`、`coverImageUrl`、`modelGlbUrl`、`sortOrder`，并加索引。
- 新增 Blob 上传 API：`POST /api/admin/blob/upload`（ADMIN_SECRET 保护；缺 `BLOB_READ_WRITE_TOKEN` 返回中文错误）。
- pets 表单支持上传封面图与 GLB，拿到 Blob URL 回填并预览。

### 验证方式
- 配置 `BLOB_READ_WRITE_TOKEN` 后，在后台上传图片/GLB，保存后列表可见 URL 与预览。

---

## Admin：阶段资源（Stage 级）

### 完成内容
- `PetStage` 增加字段：`coverImageUrl`、`modelGlbUrl`。
- 后台在 `/admin/pets/[id]` 增加“阶段资源配置”，可对每个 stage 上传/填写封面与 GLB。
- 前台读取策略：**当前阶段优先 → 物种兜底 → placeholder**；`/pet/3d` 优先 `currentStage.modelGlbUrl`。

### 验证方式
- 后台给不同 stage 上传不同图片/模型，前台切换阶段后展示随阶段变化。

---

## 小优化：上传尺寸/大小提示

### 完成内容
- 后台上传按钮增加提示：封面图推荐 `512x512`；GLB 建议 `< 15MB`。

---

## 今日任务系统重构：实时结算 + 管理审核回滚

### 完成内容
- /today 改为“任务清单”模式：单条任务点击完成即可实时结算（积分 + 用户XP + 宠物XP）。
- 新增 `DailyTaskCompletion`（按 `userId + dateKey + taskSlug` 唯一）和 `XpLedger`（USER/PET scope）。
- 管理后台新增 `/admin/today`：可对“今天”任务执行标记完成/回滚。
- 回滚时自动写负向 ledger（可逆对账），并同步状态。

### 验证方式
- 用户侧点击单条任务后立即生效；管理员回滚后积分/XP同步扣回。

---

## Dashboard 合并与 Admin 无刷新

### 完成内容
- 新增 `/dashboard`：合并“今日任务 + 当前宠物卡”。
- `/today` 与 `/pet` 改为重定向到 `/dashboard`（保留 query 透传）。
- Admin 各模块（items/codes/tasks/pets/today）改为 API + client 局部更新，无整页刷新。

### 验证方式
- 用户侧进入统一面板；后台保存/切换/审核后仅局部更新并即时反馈。

---

## 上传与交互体验：Blob 直传 + 阶段名可编辑 + 全局 Toast

### 完成内容
- Blob 上传改为直传签发模式（解决大体积 `.glb` 中转失败）。
- 阶段配置支持编辑 `PetStage.nameZh`（随资源一起保存）。
- 新增全局 `ToastProvider`，统一操作型请求成功/失败提示（admin + 用户侧）。
- 新增用户侧 API 层（shop/pet/onboarding/today makeup 等）统一 JSON 返回。

### 验证方式
- `.glb` 上传成功；阶段名称保存生效；操作反馈统一 toast。

---

## 运营修复：今日任务同步机制 + 视觉细节优化

### 完成内容
- 新增 `/api/admin/tasks/sync-today` 与后台“同步今日任务”入口：可将新建任务增量并入指定用户当天清单。
- 宠物新增第4阶段（每物种 stageIndex=3，minXp=360）并补充视觉映射。
- 图鉴与面板视觉修正：
  - 今日面板宠物图按完整比例显示（不裁切）；
  - 图鉴未拥有时阶段区模糊不可读；
  - 删除两句图鉴提示文案；
  - 宠物蛋选择图标优先使用阶段1图片。

### 验证方式
- 后台同步后前台可见新任务；图鉴/面板/宠物蛋页面视觉符合预期。

---

## 里程碑时间线（commit 摘要）
- `3e456ec` feat: backpack module
- `9ee8ddb` feat: starter pet onboarding
- `2d202b7` feat: admin pets + blob uploads
- `c4de72a` feat: stage assets for pets
- `30994ca` feat: annotate upload dimensions for pet assets
- `f85871a` feat: realtime daily tasks + admin audit
- `96d219c` feat: today complete without refresh
- `fc3a4a9` feat: admin no-refresh + dashboard merge
- `2796e10` feat: add 4th pet stage
- `6580008` feat: blob direct upload + editable stages + unified toasts
- `0626442` feat: add admin sync today tasks action
- `92997e0` feat: refine dashboard and pokedex visuals

> 注：更早的 commit 请在 GitHub 提交历史中查看。
