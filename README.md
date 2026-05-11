# TeamMatch

Platform dashboard untuk mencari rekan tim lomba kampus berbasis profile, board ide, aplikasi pelamar, team formation, dan trust snapshot.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Font:** Inter (via `next/font/google`)
- **API:** Unsplash API (public photo fetching)
- **Linting:** ESLint + Prettier

## Setup Singkat

1. Install dependency

```bash
git clone https://github.com/febss20/Teammatch-Compro.git
cd Teammatch-Compro
npm install
```

2. Isi `.env.local`

Minimal env yang dipakai project ini:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
UNSPLASH_ACCESS_KEY=
```

> Dapatkan Unsplash Access Key gratis di [unsplash.com/developers](https://unsplash.com/developers).

3. Jalankan semua migration Supabase

Pastikan migration sudah ter-apply, terutama yang terkait:

- foundation dashboard dan RLS
- team acceptance / cleanup

4. Jalankan app

```bash
npm run dev
```

## Area Utama

- `/dashboard/profile/setup` untuk onboarding profile
- `/dashboard/find-team` untuk discovery kandidat
- `/dashboard/boards` untuk board ide lomba
- `/dashboard/requests` untuk request flow
- `/dashboard/teams` untuk team workspace
- `/dashboard/settings` untuk privacy dan notification preference

## Validasi

```bash
npm run lint
cmd /c npx tsc --noEmit
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
