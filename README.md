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
RATE_LIMIT_SECRET=
CRON_SECRET=
CRON_ALLOWED_IPS=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

> `NEXT_PUBLIC_BASE_URL` dipakai sebagai canonical origin untuk metadata, `robots.txt`, dan `sitemap.xml`, jadi isi dengan origin production saat deploy.
> `CRON_ALLOWED_IPS` opsional dan dipisahkan koma. Pakai hanya jika scheduler/deployment Anda memberi egress IP yang stabil.
> Dapatkan Unsplash Access Key gratis di [unsplash.com/developers](https://unsplash.com/developers).
> Turnstile wajib untuk contact dan register di production. Development boleh berjalan tanpa `TURNSTILE_SECRET_KEY`.

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
npm run typecheck
npm run format:check
npm run build
```

## Scripts

| Command                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `npm run dev`            | Start development server                                     |
| `npm run build`          | Build for production                                         |
| `npm run start`          | Start production server                                      |
| `npm run lint`           | Run ESLint                                                   |
| `npm run typecheck`      | Run TypeScript type check                                    |
| `npm run test`           | Placeholder local test command                               |
| `npm run verify:release` | Jalankan lint, typecheck, format check, production build, dan build budget |
| `npm run check:build-budget` | Validasi ukuran JS fondasi hasil build Next.js |
| `npm run smoke:routes`   | Smoke check public/protected routes against a running server |
| `npm run format`         | Format code with Prettier                                    |
| `npm run format:check`   | Check formatting with Prettier                               |

## Release Gate Lokal

Urutan minimum sebelum release:

```bash
npm install
npm run lint
npm run typecheck
npm run format:check
npm run build

# atau satu command
npm run verify:release
```

Untuk smoke route dasar, jalankan server production lokal lalu eksekusi:

```bash
npm run build
npm run start
npm run smoke:routes
```

Opsional bila port berbeda:

```bash
SMOKE_BASE_URL=http://127.0.0.1:4000 npm run smoke:routes
```

## Internal Maintenance Endpoint

Endpoint `POST /api/internal/dashboard-maintenance` hanya untuk scheduler server-to-server.

- Header wajib: `Authorization: Bearer <CRON_SECRET>`
- Secret harus disimpan di provider scheduler/deployment, bukan di client
- Endpoint mengembalikan respons `no-store`, dibatasi rate limit server-side, dan sebaiknya hanya dipanggil dari scheduler tepercaya
- Jika scheduler punya IP keluar statis, isi `CRON_ALLOWED_IPS` untuk allowlist tambahan
- Scheduler yang tidak punya IP statis tetap bisa memakai bearer secret, tetapi hygiene secret menjadi kontrol utama
