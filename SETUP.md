# Health App — Setup

## Prerequisites

```bash
brew install node postgresql@16
brew services start postgresql@16
```

## 1. Database

```bash
createdb healthapp
psql -d healthapp -f schema.sql
```

## 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set your postgres password (or leave blank if none)
npm install
npm run dev
```

Server runs on http://localhost:3000

## 3. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on http://localhost:5173 (opens in your Mac browser)

---

## Access from your Android phone

Make sure your phone is on the **same WiFi** as your Mac.

Find your Mac's local IP:
```bash
ipconfig getifaddr en0
```

Then open `http://<your-mac-ip>:5173` in Samsung Internet or Chrome on your phone.

To install as a PWA: tap the browser menu → "Add to Home screen"

---

## File structure

```
health-app/
├── schema.sql          # Run once to set up DB
├── server/
│   ├── index.js        # Express entry point
│   ├── db.js           # Postgres connection
│   ├── routes/logs.js  # CRUD API
│   └── .env.example    # Copy to .env and fill in
└── client/
    ├── vite.config.js  # Proxies /api → server:3000
    └── src/
        ├── App.jsx
        └── components/
            ├── LogForm.jsx    # Log tab (mobile)
            └── Dashboard.jsx  # Charts + stats
```

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/logs | Last 30 logs |
| GET | /api/logs/:date | Single day (YYYY-MM-DD) |
| POST | /api/logs | Create or update a log |
