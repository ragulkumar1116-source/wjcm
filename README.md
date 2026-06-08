# ⛪ Church Youth Collection Manager

A complete Progressive Web App (PWA) for managing monthly contributions from church youth members.

---

## 🚀 Features

- **📊 Dashboard** – Stats, trends, top contributors, recent activity
- **👥 Member Management** – Add, edit, delete, search members with profiles
- **💰 Collection Tracking** – Record monthly payments with status (Completed/Partial/Pending)
- **📋 Reports** – Monthly & yearly collection reports with print support
- **⚙️ Settings** – Church name, logo, PIN, currency, backup/restore
- **🌐 Online/Offline** – Works offline, auto-syncs when back online
- **📱 PWA** – Installable as a mobile app

---

## 📁 Project Structure

```
church-youth-manager/
├── index.html              ← Single-page app (all pages)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service Worker (offline cache)
├── css/
│   └── style.css           ← All styles
├── js/
│   ├── app.js              ← Core logic, storage, sync, routing
│   ├── members.js          ← Member CRUD
│   ├── collections.js      ← Collection CRUD
│   └── reports.js          ← Dashboard & reports rendering
├── firebase/
│   └── firebase-config.js  ← Firebase setup (configure here)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## ⚡ Quick Start (Offline Only)

1. **Open** `index.html` in any modern browser
2. **Default PIN:** `1234`
3. Start adding members and recording collections!

---

## ☁️ Enable Firebase Sync (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Realtime Database**
4. Copy config to `firebase/firebase-config.js`:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Set Database Rules:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
*(For production, use proper authentication rules)*

---

## 📱 Install as Mobile App (PWA)

**Android (Chrome):**
1. Open the app in Chrome
2. Tap the 3-dot menu → "Add to Home screen"
3. Tap "Install"

**iOS (Safari):**
1. Open the app in Safari
2. Tap Share → "Add to Home Screen"
3. Tap "Add"

---

## 🖥️ Hosting (Free Options)

| Service | Steps |
|---------|-------|
| **GitHub Pages** | Push to repo → Settings → Pages → Deploy from main branch |
| **Netlify** | Drag & drop folder to [netlify.com/drop](https://netlify.com/drop) |
| **Vercel** | `npx vercel` in project folder |
| **Firebase Hosting** | `firebase deploy --only hosting` |

---

## 🔐 Default Settings

| Setting | Default |
|---------|---------|
| Admin PIN | `1234` |
| Currency | `₹` |
| Monthly Target | `₹100` |

---

## 💾 Data Storage

- **Primary:** Browser `localStorage` (always available)
- **Backup:** Firebase Realtime Database (when configured)
- **Export:** JSON backup files downloadable from Settings

---

## 📊 Collection Status Logic

| Paid | Status |
|------|--------|
| = Monthly Target | ✅ Completed |
| > 0 but < Target | 🟡 Partial |
| = 0 | ❌ Pending |

---

## 🛠️ Tech Stack

- HTML5 + CSS3 + Vanilla JavaScript
- Firebase Realtime Database (optional)
- Service Worker (offline PWA)
- LocalStorage (offline data)
- No frameworks, no build tools required!

---

Made with ❤️ for church youth groups
