# Birthday Invitation & RSVP Template

A reusable digital birthday invitation with a public invitation site and an admin content builder. React + TypeScript + Vite + Tailwind on the front, Supabase for database, auth and storage. No paid services and no custom backend.

Every piece of event content lives in Supabase, so turning this into a different client's invitation means changing rows and images, not code.

---

## Stack

| Concern | Choice |
| --- | --- |

| Framework | React 18, TypeScript (strict, project references), Vite 5 |
| Styling | Tailwind CSS 3 with a project token layer |
| Data / auth / files | Supabase Postgres, Supabase Auth, Supabase Storage |
| Validation | Zod, shared between forms and service calls |
| Icons | lucide-react |
| QR | qrcode.react |
| Hosting | Vercel (or any static host; `vercel.json` holds the SPA rewrite) |

---

## Setup

### 1. Install

```bash
pnpm install
```

### 2. Create the Supabase project

Create a free project at supabase.com, then open **SQL Editor** and run the whole of `supabase/schema.sql`. It is idempotent, so re-running it is safe. It creates:

- `event_settings`, `hero_settings`, `about_settings` — singleton rows pinned to `id = 1`
- `gallery` — one row per photo, with `display_order` and `is_visible`
- `rsvps` — responses for the built-in RSVP form
- `updated_at` triggers, RLS policies, and the `invitation-media` storage bucket with its object policies

Optionally run `supabase/seed.sql` for placeholder content so the site renders before you have filled anything in.

### 3. Create the admin user

**Authentication → Users → Add user**, with an email and password. Then go to **Authentication → Providers → Email** and turn off *Allow new users to sign up*.

This matters: the RLS policies treat any authenticated user as an admin. Leaving public sign-ups enabled would let anyone register and edit the invitation.

### 4. Environment

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Both values come from **Project Settings → API**. Only the anon key belongs here — it is designed to be public and is safe because RLS is doing the real work. Never put the service-role key in a `VITE_` variable; anything prefixed `VITE_` is compiled into the browser bundle.

The app detects missing env vars and renders a configuration screen rather than throwing.

### 5. Run

```bash
pnpm dev        # http://localhost:5173
pnpm typecheck
pnpm build
pnpm preview
```

---

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Hero, countdown, about, details, gallery preview, RSVP call to action |
| `/about` | About the celebrant |
| `/details` | Date, time, venue, dress code, notes, Maps link |
| `/gallery` | Full paginated gallery with lightbox |
| `/rsvp` | QR + form link, or the built-in RSVP form |
| `/admin` | Dashboard (auth required) |
| `/admin/login` | Sign in |
| `/admin/event`, `/hero`, `/about`, `/gallery` | Content editors |
| `/admin/rsvp` | RSVP method, form URL, deadline, QR preview, responses |

---

## Security model

The client-side route guard controls navigation only. Authorization is enforced in Postgres:

- **anon** — `SELECT` on the three settings tables; `SELECT` on `gallery` restricted to `is_visible = true`; `INSERT` only on `rsvps`. There is no anon `SELECT` policy on `rsvps`, so guest responses are never readable from the browser. This is why `submitRsvp` inserts without `.select()` — an `INSERT ... RETURNING` would be blocked by the missing read policy.
- **authenticated** — full read/write on content tables and the storage bucket.
- The RSVP insert policy re-checks name length, guest bounds and the declined-means-zero-guests rule, so the same constraints hold whether or not the client validated.
- Table-level `CHECK` constraints mirror the Zod schemas, and URL columns are constrained to `^https?://`.
- Stored URLs are additionally filtered through `safeExternalUrl` before reaching an `href` or a QR payload, so a `javascript:` value written directly into the database can never become a live link.
- CSV export prefixes formula-leading characters to neutralise spreadsheet injection.

---

## Storage

`supabase/schema.sql` creates the `invitation-media` bucket as public-read with a 5 MB limit and an image-only MIME allowlist. Uploads are namespaced by folder: `gallery/`, `hero/`, `about/`.

Compress photos before upload. Around 1600px on the long edge, saved as WebP, gives a sharp gallery at a fraction of the bytes; the bucket rejects anything over 5 MB.

Deleting a photo removes the row first and then the object. If the object delete fails, the orphan is harmless — the table is the source of truth. The inverse case is also handled: if a gallery row insert fails after a successful upload, the upload is rolled back.

---

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import it in Vercel. The framework preset is detected as Vite; build command `pnpm build`, output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings → Environment Variables** for Production and Preview.
4. Deploy.

`vercel.json` rewrites all paths to `index.html` so deep links like `/rsvp` resolve, and sets a one-year immutable cache on hashed assets.

For Netlify, the equivalent is a `_redirects` file containing `/* /index.html 200`. Cloudflare Pages needs the same rewrite in its SPA setting.

After deploying, add the production origin to **Supabase → Authentication → URL Configuration → Site URL** so auth redirects resolve correctly.

---

## Architecture notes

**Singleton settings tables.** `id integer primary key check (id = 1)` means every save is an idempotent upsert. Without it, two admin tabs saving at once silently create competing rows and the public site picks one arbitrarily.

**Admin editors block until content loads.** `RequireAuth` waits on both the auth session and the content fetch, and refuses to render the editors if the fetch failed. `getSession()` resolves from local storage and usually beats the network, so without this an editor could mount against a null row, seed its form from the defaults, and overwrite real content on the next save.

**One content fetch per session.** `SiteContentProvider` loads event/hero/about once and shares it across routes, so navigation costs no queries. Admin editors push the saved row back into the provider via `applyEvent`/`applyHero`/`applyAbout`, which is why the public site reflects changes immediately without a refetch or a reload.

**Gallery pagination.** The public grid pulls 12 rows at a time through a range query rather than loading the whole album. Reordering writes the entire new order in a single upsert instead of one update per row.

**Countdown.** Ticks once per second and clears its own interval the moment the target passes, then swaps in a closing message rather than showing negative values.

**Code splitting.** Every route is lazy-loaded, and `react`/`supabase` are split into their own vendor chunks. The initial public payload is roughly 60 kB gzipped before the route chunk.

---

## Accessibility

Semantic landmarks and a single `h1` per page; a skip link to `#main`; visible focus rings on every interactive element; the lightbox and confirmation dialog trap focus, close on `Escape` and restore focus on exit; the lightbox also responds to arrow keys and horizontal swipes. The countdown exposes a text summary to screen readers instead of announcing four changing numbers every second. Status is never carried by color alone — attendance badges and upload states carry text. `prefers-reduced-motion` disables scroll reveals, smooth scrolling and transitions globally.

---

## Reusing this for another client

1. Create a new Supabase project and run `supabase/schema.sql`.
2. Point `.env` at it and deploy a fresh Vercel project.
3. Sign in at `/admin`, fill in Event details, Hero, About, upload gallery photos, and set the RSVP method.

Nothing about the celebrant is hardcoded. To restyle, edit the palette and font families in `tailwind.config.js` and the two font links in `index.html` — the rest of the UI reads from those tokens.

---

## Project layout

```
src/
├── components/
│   ├── layout/       SiteLayout, Navbar, AdminPage
│   ├── hero/  about/  details/  countdown/
│   ├── gallery/      GalleryGrid, Lightbox
│   ├── rsvp/         RsvpForm, RsvpQr
│   └── ui/           Button, Field, ConfirmDialog, States, ErrorBoundary, ...
├── pages/
│   ├── Home, AboutPage, DetailsPage, GalleryPage, RsvpPage
│   └── admin/        AdminApp, Login, Dashboard, editors
├── hooks/            useSiteContent, useAuth, useToast, useCountdown, useReveal
├── lib/              supabase, storage, utils, validation
├── services/         settings, gallery, rsvp
└── types/
supabase/
├── schema.sql        tables, RLS, storage bucket
└── seed.sql          optional placeholder content
```
#   r s v p - 0 0 0 1 
 
 