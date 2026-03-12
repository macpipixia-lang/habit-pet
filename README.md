# 习惯宠物 MVP

习惯宠物是一个基于 Next.js App Router 的 MVP 应用，用于把每日任务打卡转成经验、宠物升级、积分，以及补签卡形式的连续记录修复。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- 基于用户名和密码的自定义签名 Session Cookie 鉴权

## 功能特性

- 支持用户名和密码注册、登录
- 每日任务模板由服务端统一定义
- 每天仅可结算一次，以北京时间(Asia/Shanghai)为准
- 经验、积分和宠物等级最高可成长到 30 级
- 达到满级后经验仍会继续累计
- 缺勤一天后，连续天数会重置
- 补签卡价格线性增长：`50 + purchaseCount`
- 补签仅支持恢复昨天的记录，并依赖已保存的每日日志
- 可查看每日记录和积分流水
- 提供仅限开发环境的 `/api/debug/reset` 接口，用于重置当前登录用户数据

## 使用方法

1. 安装依赖：

```bash
npm install
```

2. 创建环境变量文件：

```bash
cp .env.example .env
```

3. 初始化数据库：

```bash
npm run prisma:generate
npm run prisma:push
```

4. 启动应用：

```bash
npm run dev
```

如果你刚改过 Prisma schema / 路由 / Server Actions，出现了类似 `Cannot find module './xxx.js'`、`routes-manifest.json` 丢失、`prisma.xxx is undefined`、或页面 500（常见于 `.next` 缓存与 Prisma Client 不一致），用下面这个“强制干净启动”命令：

```bash
npm run dev:clean
```

5. 打开 `http://localhost:3000`。

## 说明

- 结算日界线以北京时间(Asia/Shanghai)为准。
- 每日任务模板定义在 [`lib/constants.ts`](/Users/ppx/.openclaw/workspace/projects/habit-pet/lib/constants.ts)。
- Prisma Schema 位于 [`prisma/schema.prisma`](/Users/ppx/.openclaw/workspace/projects/habit-pet/prisma/schema.prisma)。
- 在开发环境下，已登录用户可以向 `/api/debug/reset` 发送 POST 请求，清空自己的资料、日志和积分流水。

## 常用命令

```bash
npm run dev
npm run dev:clean
npm run build
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## 故障排查（开发环境）

如果遇到以下症状之一：
- 页面突然 500
- `Cannot find module './xxx.js'`
- `ENOENT: ... .next/routes-manifest.json`
- `prisma.xxx is undefined`（新增/修改 Prisma Model 后常见）
- `Failed to find Server Action ...`

优先按下面顺序处理：

1) **停掉 dev server**（Ctrl+C）
2) 运行：

```bash
npm run dev:clean
```

这会自动：清理 `.next` → 重新生成 Prisma Client → 同步 SQLite schema → 再启动 Next dev。
