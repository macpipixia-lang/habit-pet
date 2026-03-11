# Habit Pet MVP

Habit Pet is a Next.js App Router MVP for daily task check-ins that convert into EXP, pet leveling, points, and makeup-card streak recovery.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- Custom signed session cookie auth with username/password

## Features

- Account + password registration/login
- Server-defined daily task template
- One settlement per Asia/Shanghai day
- EXP, points, and pet level progression up to level 30
- EXP continues accumulating after level cap
- Streak resets after missing a day
- Makeup card purchase with linear price growth: `50 + purchaseCount`
- Yesterday-only makeup recovery using a stored daily log
- History view for daily logs and points ledger
- Development-only `/api/debug/reset` endpoint for the current signed-in user

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Initialize the database:

```bash
npm run prisma:generate
npm run prisma:push
```

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Notes

- The app uses `Asia/Shanghai` day boundaries for settlement logic.
- Daily task templates are defined in [`lib/constants.ts`](/Users/ppx/.openclaw/workspace/projects/habit-pet/lib/constants.ts).
- The Prisma schema lives in [`prisma/schema.prisma`](/Users/ppx/.openclaw/workspace/projects/habit-pet/prisma/schema.prisma).
- In development, signed-in users can POST to `/api/debug/reset` to wipe their own profile, logs, and ledger.

## Commands

```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```
