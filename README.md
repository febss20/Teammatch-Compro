# TeamMatch — Cari Teman Lomba Kampus 🏆

Platform kolaborasi mahasiswa untuk menemukan rekan tim dan memenangkan berbagai kompetisi tingkat nasional maupun internasional.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Font:** Inter (via `next/font/google`)
- **API:** Unsplash API (public photo fetching)
- **Linting:** ESLint + Prettier

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/febss20/Teammatch-Compro.git
cd Teammatch-Compro
npm install
```

### 2. Environment Variables

Buat file `.env.local` di root project:

```bash
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> Dapatkan Unsplash Access Key gratis di [unsplash.com/developers](https://unsplash.com/developers).

### 3. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Key Features

| Feature | Implementation |
|---------|---------------|
| App Router | `app/` directory with layouts, pages, dynamic routes |
| Server Component | Services page fetches from Unsplash API |
| Client Component | Navbar (mobile toggle), ContactForm (form state) |
| Data Fetching | `await fetch()` in Server Component + ISR (1 hour) |
| Route Handler | `GET /api/photos`, `POST /api/contact` |
| Dynamic Route | `/services/[id]` with `generateStaticParams` |
| Image Optimization | `next/image` with Unsplash `remotePatterns` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
