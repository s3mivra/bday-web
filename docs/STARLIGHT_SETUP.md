# Starlight theme setup

Step by step setup for the Starlight (envelope) invitation. Run `supabase/schema.sql` in the Supabase SQL Editor first. It is safe to re-run.

## 1. Create the admin login

1. In Supabase, go to **Authentication > Users > Add user** and enter an email and a password (8 characters or more).
2. Go to **Authentication > Providers > Email** and turn off **Allow new users to sign up**. Any signed-in user can edit the invitation, so public sign-ups must stay off.

## 2. Connect the app to Supabase

Both values come from **Project Settings > API**. Use the **anon** key only, never the service-role key.

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**Vercel:** add both under **Settings > Environment Variables** for Production and Preview, then redeploy. Add the site address under **Supabase > Authentication > URL Configuration > Site URL**.

**Local:** put both lines in a `.env` file in the project root, then run:

```bash
npm install
npm run dev
```

The site runs at `http://localhost:5173`.

## 3. Sign in

Open `/admin` and sign in with the account from step 1.

## 4. Fill in the admin pages

Work through them in this order.

### Event details

| Field | What to enter |
| --- | --- |
| Celebrant name | The celebrant, for example Zia Amara |
| Event date, start time | Reception date and time |
| Venue, address | Reception place |
| Google Maps link | Share link for the reception |
| Dress code | Shown in the Details section |
| Additional info | Shown as "Good to know" |
| Birthday message | Shown as the "Thank you!" note |

### Hero

| Field | What to enter |
| --- | --- |
| Small label | For example: Please join us to celebrate |
| Headline | The occasion, for example: Christening & 1st Birthday |
| Hero image | Main photo, shown in the round frame |
| Site theme | **Starlight (envelope)** |

### RSVP

| Field | What to enter |
| --- | --- |
| Method | Google Form |
| Form URL | Your Google Form link. The QR code is generated from it. |
| Deadline, note | Optional |

### Invitation sections

| Card | What to enter |
| --- | --- |
| Envelope intro | Leave it on, optionally change the heading and add a tagline |
| Music | Song title, subtitle and an MP3 or M4A file (up to 15 MB) |
| Countdown | Title, text, photo and the banner under it |
| Location | Ceremony title, time, venue, address and Maps link. The reception comes from Event details. |
| Godparents | Ninong and Ninang, one name per line |
| Details | Gift guide, reminders (one per line) and a photo |
| Save the date and closing | Line above SAVE THE DATE, closing photo, letter and signature |

Empty sections are hidden on the invitation.

## 5. Check the invitation

- Open the home page and tap the wax seal.
- Address the envelope to a guest by adding their name to the link: `https://your-site/?to=Tita%20Maria` (`%20` is a space).
- The song starts when the seal is tapped. Some phones block sound until a tap, so guests can also use the play button.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Supabase is not configured" screen | The env values are missing. Add them, then redeploy or restart `npm run dev`. |
| Setup notice on the home page | Save Event details at least once. |
| Invitation sections will not save, or a song is rejected | Re-run `supabase/schema.sql`. |
| Photo upload rejected | Use JPG, PNG, WebP or AVIF under 5 MB. |
