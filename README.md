# Island Heats — Court Schedule

Static site for viewing basketball court availability from Google Calendar. Hosted on GitHub Pages.

## Features

- Day schedule (08:00–22:00, Asia/Bangkok)
- 30-minute booking start times, 60/90/120 min durations
- Event types: Training session, 3×3 game, Open game (detected from calendar titles/tags)
- Private events show as busy blocks without details
- Languages: Russian, English, Thai
- Booking form → WhatsApp with pre-filled message

## Setup

### 1. Google Calendar

1. Open your court calendar → **Settings** → **Access permissions**
2. Enable **"Make available to public"** (required for API read access)
3. Staff keep **"Make changes to events"** permission

### 2. Data source (choose one)

#### Option A — Google Calendar API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project where **you are Owner**
3. Enable **Google Calendar API**
4. Open **APIs & Services → Credentials** (left menu — not AI / Agent Platform settings)
5. **Create credentials → API key** → restrict:
   - HTTP referrers: `https://YOUR_USERNAME.github.io/*` and `http://localhost:*`
   - API: Google Calendar API only

**Can't create API keys?** Common causes:
- Wrong section: "Authenticate for API access" under AI settings ≠ API Credentials
- You're not Owner/Editor on the project "Simple Signature"
- Organization policy blocks keys → use Option B

#### Option B — Google Apps Script (no API key) **recommended if keys are blocked**

1. Open [script.google.com](https://script.google.com) → **New project**
2. Copy code from `apps-script/Code.gs`
3. **Run** once → authorize with the Google account that owns the calendar
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy deployment URL into `config.js` → `appsScriptUrl`

### 3. Configure `config.js`

```js
// One of these is enough:
apiKey: 'YOUR_API_KEY',
appsScriptUrl: 'https://script.google.com/macros/s/XXXX/exec',

whatsappPhone: '66812345678', // country code, no + or spaces
```

### 4. Event types in Google Calendar

The site detects types from event titles (case-insensitive):

| Type | Examples in title |
|------|-------------------|
| Training session | `Training session`, `Тренировка`, `[training]` |
| 3×3 game | `3x3 game`, `3×3`, `[3x3]` |
| Open game | `Open game`, `Открытая игра`, `[open]` |

Use tags in brackets for consistent matching, e.g. `[open] Saturday run`.

### 5. GitHub Pages

1. Push this repo to GitHub
2. **Settings → Pages → Source**: GitHub Actions
3. The workflow deploys automatically on push to `main`

Or enable **Deploy from branch** → `/ (root)`.

### Local development

Serve over HTTP (required for ES modules):

```bash
npx serve .
# or: python3 -m http.server 8080
```

Open `http://localhost:3000` (or your port) and add that origin to the API key referrers.

## File structure

```
├── index.html
├── config.js          # calendar ID, hours, WhatsApp, API key or Apps Script URL
├── apps-script/Code.gs
├── styles.css
├── js/
│   ├── main.js        # UI orchestration
│   ├── calendar-api.js
│   ├── schedule.js
│   └── i18n.js
└── .github/workflows/deploy.yml
```

## WhatsApp flow

1. User taps **Book** or a free slot
2. Fills name, contact, date/time, session type
3. Submit opens `wa.me/PHONE?text=...` with a formatted message
4. If `whatsappPhone` is empty, the message is copied to clipboard

## Privacy

- **Public** events: full title and description shown
- **Private/confidential** events: shown as "Private event" with time only (per Google Calendar API rules)
