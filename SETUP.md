# CHURCH YOUTH COLLECTION MANAGER
## Complete Setup Guide

---

## STEP 1 – Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it (e.g. "ChurchYouthManager")
3. Disable Google Analytics (optional) → **Create project**

---

## STEP 2 – Enable Authentication

1. In Firebase Console → **Authentication** → **Get started**
2. Click **Email/Password** → Enable → Save

---

## STEP 3 – Enable Realtime Database

1. Firebase Console → **Realtime Database** → **Create database**
2. Choose your region
3. Start in **test mode** (we'll secure it later)

---

## STEP 4 – Get Your Config Keys

1. Firebase Console → **Project Settings** (gear icon) → **Your apps**
2. Click **"Web"** icon → Register app → Copy the config
3. Open `firebase/firebase-config.js` in this project
4. Replace the placeholder values with your real config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                         // ← your key
  authDomain: "mychurch.firebaseapp.com",       // ← your domain
  databaseURL: "https://mychurch-default-rtdb.firebaseio.com",
  projectId: "mychurch",
  storageBucket: "mychurch.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc..."
};
```

---

## STEP 5 – Create Your First Admin User

1. Firebase Console → **Authentication** → **Users** → **Add user**
2. Enter admin email + password → Add user
3. Copy the **User UID** shown in the table

4. Firebase Console → **Realtime Database** → **Data** tab
5. Click the **+** button and add this structure manually:

```
userIndex/
  YOUR_UID_HERE/
    churchId: "church001"
    role: "admin"

churches/
  church001/
    settings/
      churchName: "My Youth Fellowship"
      currency: "₹"
      financialYearStart: "January"
    users/
      YOUR_UID_HERE/
        name: "Admin"
        email: "admin@mychurch.org"
        role: "admin"
```

---

## STEP 6 – Set Firebase Security Rules

Firebase Console → Realtime Database → **Rules** tab → Paste:

```json
{
  "rules": {
    "userIndex": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": false
      }
    },
    "churches": {
      "$churchId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

Click **Publish**.

---

## STEP 7 – Run the App

Option A – **Live Server** (VS Code extension):
- Right-click `index.html` → Open with Live Server

Option B – **Python**:
```bash
cd church-manager
python3 -m http.server 8080
```
Then open: http://localhost:8080

Option C – **Deploy to Firebase Hosting**:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## HOW OFFLINE SYNC WORKS

| Situation | What happens |
|-----------|-------------|
| Online | All data goes directly to Firebase in real-time |
| Go offline | App keeps working, writes are queued in localStorage |
| Come back online | App auto-detects connection and flushes queue to Firebase |
| Restart while offline | App loads cached data from localStorage, continues working |

### The orange "📴 Offline" banner appears when disconnected.
### The 🔄 Sync button shows a red badge with pending count.

---

## ADD MORE USERS (after initial setup)

1. Create their Firebase account (Authentication → Add user)
2. Copy their UID
3. Log in as Admin → **Settings** → **Add User**
4. Paste UID, enter name/email, choose role

**Roles:**
- **Admin** – Full access (members, collections, reports, settings)
- **Collector** – Can add/edit members and collections
- **Viewer** – Read-only access to dashboard and reports

---

## PROJECT STRUCTURE

```
church-manager/
├── index.html           ← Login page
├── dashboard.html       ← Dashboard with charts
├── members.html         ← Member list & management
├── member-profile.html  ← Individual member details
├── collections.html     ← Collection entry & history
├── reports.html         ← Monthly/yearly reports + CSV export
├── settings.html        ← Church settings & user management
├── css/style.css        ← All styles
├── js/
│   ├── sync.js          ← OFFLINE SYNC ENGINE (key file)
│   ├── app.js           ← Auth guard & shared utilities
│   └── layout.js        ← Sidebar/topbar renderer
├── firebase/
│   └── firebase-config.js  ← YOUR KEYS GO HERE
├── manifest.json        ← PWA manifest
└── service-worker.js    ← Offline app shell cache
```
