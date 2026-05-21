# 🛠️ উত্তরবঙ্গ স্বাস্থ্য সেতু — Admin Panel Architecture Blueprint
**Version:** 1.0 | **Architect:** Lead Full-Stack Architect (Claude)
**Constraint:** Vanilla JS + HTML + Tailwind CDN + Supabase CDN | Zero Build System

---

## 📋 TABLE OF CONTENTS

```
SECTION 1 — Tech Stack & Philosophy (Dead Simple Stack)
SECTION 2 — Folder Structure (Minimal Repository Layout)
SECTION 3 — Admin Authentication Flow (Simple Lock)
SECTION 4 — Dashboard Layout & Sidebar Navigation (UI Blueprint)
SECTION 5 — Global State & Smart Caching Architecture
SECTION 6 — Atomic Data Entry: 1 Form → Multiple Tables
SECTION 7 — Image Pipeline: Compress → Convert → Upload → Store
SECTION 8 — Draft Auto-Save with localStorage
SECTION 9 — Module-by-Module CRUD Flow Map (All 15 Modules)
SECTION 10 — Implementation Sequence (Build Order)
```

---

## SECTION 1 — TECH STACK & PHILOSOPHY

### The "Dead Simple" Principle

এই Admin Panel-এর একটিমাত্র চালিকানীতি: **কোনো build step নেই, কোনো terminal নেই, কোনো npm install নেই।** একটি ফোল্ডার, কিছু `.html` ও `.js` ফাইল — ব্রাউজারে ডাবল-ক্লিক করলেই চলবে। GitHub-এ push করলে Netlify বা GitHub Pages-এ আপনা থেকেই deploy হবে।

### Stack Decision Table

```
LAYER              CHOICE                    WHY (NOT the alternative)
─────────────────────────────────────────────────────────────────────────────
Markup             HTML5                     Zero learning curve
Styling            Tailwind CSS (CDN)        No config, no build, utility-first
Logic              Vanilla JavaScript (ES6+) No framework overhead, maintainable
Database Client    Supabase JS SDK (CDN)     One <script> tag — done
Image Compression  Browser Canvas API        Built-in, no library needed
Auth               Supabase Auth             Email+Password, 5 lines of code
Hosting            Netlify (Free Tier)       Drag-and-drop deploy, HTTPS auto
─────────────────────────────────────────────────────────────────────────────
```

### CDN Links (প্রতিটি HTML ফাইলের `<head>`-এ থাকবে)

```html
<!-- Tailwind CSS — Styling -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Supabase JS SDK — Database & Auth & Storage -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Alpine.js (Optional, Light) — Tiny reactive dropdowns/toggles -->
<!-- মাত্র 15KB, কোনো build নেই, Vanilla JS-এর মতোই সহজ -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
```

> **Alpine.js কেন?** শুধুমাত্র ছোট UI interactions-এর জন্য (dropdown খোলা/বন্ধ, modal toggle) — পুরো React শেখার দরকার নেই। এটি HTML attribute-এ `x-show`, `x-on:click` লিখলেই কাজ করে।

---

## SECTION 2 — FOLDER STRUCTURE (Minimal Repository)

```
uss-admin-panel/               ← GitHub Repository Root
│
├── index.html                 ← Login Page (entry point)
├── dashboard.html             ← Main Dashboard Shell
│
├── config/
│   └── supabase.js            ← Supabase client init (API keys)
│
├── core/
│   ├── auth.js                ← Login / Logout / Session check
│   ├── state.js               ← Global in-memory cache (AppState object)
│   ├── router.js              ← Simple hash-based navigation (#doctors, #hospitals)
│   └── imageUpload.js         ← Canvas compress → WebP → Supabase upload
│
├── modules/
│   ├── doctors.js             ← Doctors CRUD + Chambers CRUD
│   ├── hospitals.js           ← Hospitals CRUD + Images
│   ├── ads.js                 ← Ads/Banners CRUD
│   ├── symptoms.js            ← Symptoms + Mapping CRUD
│   ├── reviews.js             ← Review Moderation
│   ├── emergency.js           ← Emergency Contacts
│   ├── notifications.js       ← App Notices
│   ├── seo.js                 ← SEO Pages
│   ├── settings.js            ← App Settings
│   ├── categories.js          ← Category Management
│   ├── cities.js              ← City Management
│   ├── submissions.js         ← User Submission Approval
│   ├── analytics.js           ← Analytics Dashboard View
│   └── adminUsers.js          ← Admin User Management
│
├── components/
│   ├── sidebar.js             ← Sidebar HTML generator
│   ├── table.js               ← Reusable data table renderer
│   ├── modal.js               ← Add/Edit modal controller
│   ├── toast.js               ← Success/Error toast notifications
│   └── chamberWidget.js       ← Dynamic chamber add/remove widget
│
└── assets/
    └── logo.svg               ← Admin panel logo
```

**মোট ফাইল সংখ্যা: ~২৫টি।** প্রতিটি ফাইল একটি নির্দিষ্ট কাজের জন্য — কোনো জটিলতা নেই।

---

## SECTION 3 — ADMIN AUTHENTICATION FLOW

### Login Screen (`index.html`) — Visual Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│         🏥 উত্তরবঙ্গ স্বাস্থ্য সেতু         │
│              Admin Panel                    │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  📧  admin@example.com              │   │
│   └─────────────────────────────────────┘   │
│   ┌─────────────────────────────────────┐   │
│   │  🔒  ••••••••••••                   │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   [ 🔐  Admin Login করুন ]                  │
│                                             │
│   ⚠️ শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য    │
│                                             │
└─────────────────────────────────────────────┘
```

### Auth Logic Flow

```
User opens index.html
       │
       ▼
auth.js: checkSession()
       │
       ├── Session আছে? ──YES──▶ dashboard.html-এ redirect
       │
       └── NO ──▶ Login form দেখাও
                       │
                 Email + Password submit
                       │
                       ▼
            supabase.auth.signInWithPassword()
                       │
                 ┌─────┴─────┐
               SUCCESS      ERROR
                 │             │
                 ▼             ▼
          dashboard.html  "ভুল পাসওয়ার্ড" toast
          redirect করো   (3 বার ভুল = 30 min lock)
```

### Session Guard (প্রতিটি Module Page-এ)

`dashboard.html` লোড হওয়ার সাথে সাথে `auth.js`-এর `guardRoute()` ফাংশন চলবে। এটি Supabase-এর active session চেক করবে। Session না থাকলে `index.html`-এ redirect করবে — কোনো protected data দেখা যাবে না।

### Password Reset Flow

Supabase-এর built-in `resetPasswordForEmail()` ব্যবহার হবে। Login page-এ একটি ছোট "পাসওয়ার্ড ভুলে গেছেন?" লিংক থাকবে — ক্লিক করলে ইমেইলে reset link আসবে।

---

## SECTION 4 — DASHBOARD LAYOUT & SIDEBAR NAVIGATION

### Full Screen Layout Blueprint

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOP BAR (56px, fixed)                                               │
│  [☰ Menu]  🏥 USS Admin Panel          [👤 Admin Name]  [🚪 Logout] │
├─────────────────┬────────────────────────────────────────────────────┤
│                 │                                                    │
│  SIDEBAR        │  MAIN CONTENT AREA                                 │
│  (240px, fixed) │  (fluid, scrollable)                               │
│                 │                                                    │
│  📊 Dashboard   │  ┌──────────────────────────────────────────────┐  │
│                 │  │  PAGE HEADER                                 │  │
│  ── CORE DATA ──│  │  "ডাক্তার ম্যানেজমেন্ট"  [ + নতুন যোগ করুন]│  │
│  👨‍⚕️ ডাক্তার   │  └──────────────────────────────────────────────┘  │
│  🏥 হাসপাতাল   │                                                    │
│  🩺 উপসর্গ     │  ┌──────────────────────────────────────────────┐  │
│  🏷️ ক্যাটাগরি  │  │  SEARCH + FILTER BAR                        │  │
│  🌆 শহর        │  │  [🔍 নাম দিয়ে খুঁজুন...]  [Specialty ▾]    │  │
│                 │  └──────────────────────────────────────────────┘  │
│  ── CONTENT ────│                                                    │
│  📢 ব্যানার/অ্যাড│  ┌──────────────────────────────────────────────┐  │
│  ⭐ রিভিউ       │  │  DATA TABLE                                  │  │
│  🔔 নোটিস      │  │  ┌──────┬──────────┬──────────┬────────────┐ │  │
│  🚨 জরুরি       │  │  │ ছবি  │ নাম      │ স্পেশালটি│ অ্যাকশন   │ │  │
│                 │  │  ├──────┼──────────┼──────────┼────────────┤ │  │
│  ── ADMIN ─────│  │  │ 👤   │ Dr. Abc  │ Medicine │ ✏️ 🗑️ 👁️  │ │  │
│  📝 সাবমিশন    │  │  │ 👤   │ Dr. Xyz  │ Cardio   │ ✏️ 🗑️ 👁️  │ │  │
│  📊 অ্যানালিটিক্স│  │  └──────┴──────────┴──────────┴────────────┘ │  │
│  🔍 SEO         │  └──────────────────────────────────────────────┘  │
│  ⚙️ সেটিংস     │                                                    │
│  👤 অ্যাডমিন   │  ┌──────────────────────────────────────────────┐  │
│                 │  │  PAGINATION: ◀ 1  2  3  4  5 ▶              │  │
│  ─────────────  │  └──────────────────────────────────────────────┘  │
│  🔄 Refresh     │                                                    │
│                 │                                                    │
└─────────────────┴────────────────────────────────────────────────────┘
```

### Sidebar Menu Structure (15 Modules → 5 Groups)

```
GROUP 1: OVERVIEW
  📊  ড্যাশবোর্ড          → stats cards, recent activity

GROUP 2: CORE DATA
  👨‍⚕️  ডাক্তার ও চেম্বার  → doctors.js (T03 + T04 + T07)
  🏥  হাসপাতাল            → hospitals.js (T05 + T06 + T07)
  🩺  উপসর্গ ম্যাপিং      → symptoms.js (T08 + T09)
  🏷️  ক্যাটাগরি           → categories.js (T02)
  🌆  শহর                 → cities.js (T01)

GROUP 3: CONTENT & MONETIZATION
  📢  ব্যানার ও বিজ্ঞাপন  → ads.js (T11)
  ⭐  রিভিউ মডারেশন      → reviews.js (T10)
  🔔  নোটিস / ঘোষণা      → notifications.js (T13)
  🚨  জরুরি যোগাযোগ      → emergency.js (T12)

GROUP 4: ADMIN TOOLS
  📝  ইউজার সাবমিশন      → submissions.js (T18)
  📊  অ্যানালিটিক্স       → analytics.js (T19)
  🔍  SEO কন্ট্রোল       → seo.js (T14)

GROUP 5: SYSTEM
  ⚙️  অ্যাপ সেটিংস       → settings.js (T15)
  👤  অ্যাডমিন ব্যবহারকারী → adminUsers.js (T16 + T17)
  ─────────────────────────
  🔄  ক্যাশ রিফ্রেশ       → AppState.forceRefresh()
```

### Dashboard Home — Stats Cards

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  👨‍⚕️ ডাক্তার  │ │  🏥 হাসপাতাল  │ │  ⭐ পেন্ডিং    │ │  📢 সক্রিয় অ্যাড│
│     142        │ │      38        │ │  রিভিউ: 7      │ │       5        │
│  [+3 এই সপ্তাহ]│ │  [+1 এই সপ্তাহ]│ │  [অনুমোদন করুন]│ │  [মেয়াদ: 3 দিন]│
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

---

## SECTION 5 — GLOBAL STATE & SMART CACHING ARCHITECTURE

### The Core Problem এবং Solution

প্রতিবার একটি ডাক্তার add/edit/delete করলে পুরো `doctors` তালিকা আবার Supabase থেকে fetch করা মানে — অপ্রয়োজনীয় API call, ধীরগতি, এবং Supabase-এর bandwidth খরচ। এর বদলে আমরা **In-Memory Cache + Delta Update** pattern ব্যবহার করব।

### AppState Object (Global Cache — `state.js`)

```
AppState (Global JavaScript Object)
│
├── doctors[]         ← সব ডাক্তারের array (প্রথম লোডে একবার fetch)
├── chambers[]        ← সব চেম্বারের array
├── hospitals[]       ← সব হাসপাতালের array
├── hospital_images[] ← হাসপাতালের ছবির array
├── categories[]      ← ক্যাটাগরি (খুব কম পরিবর্তন হয়)
├── cities[]          ← শহরের তালিকা
├── symptoms[]        ← উপসর্গের তালিকা
├── ads[]             ← বিজ্ঞাপনের তালিকা
├── reviews[]         ← pending reviews
├── notifications[]   ← নোটিস
├── emergency_contacts[]
├── isLoaded: false   ← প্রথমবার লোড হয়েছে কিনা
└── lastFetched: null ← কখন শেষবার fresh data এসেছে
```

### Cache Lifecycle — Flow Diagram

```
App First Load (dashboard.html)
         │
         ▼
   AppState.isLoaded === false?
         │
        YES
         │
         ▼
  Supabase থেকে সব টেবিল একসাথে Fetch
  (Promise.all — parallel calls, দ্রুততম পদ্ধতি)
         │
         ▼
  AppState-এ সব data সেভ হলো
  AppState.isLoaded = true
  AppState.lastFetched = Date.now()
         │
         ▼
  UI render হলো (table, cards)

─────────────────────────────────────────────────

Admin নতুন ডাক্তার ADD করল
         │
         ▼
  Supabase-এ INSERT → সফল হলো
  নতুন record (Supabase থেকে returned) পাওয়া গেল
         │
         ▼
  AppState.doctors.push(newDoctor)   ← ← ← Delta Update
         │                              (পুরো list re-fetch নয়)
         ▼
  UI: table-এ নতুন row prepend হলো
  Toast: "✅ ডাক্তার সফলভাবে যোগ করা হয়েছে"

─────────────────────────────────────────────────

Admin একটি ডাক্তার EDIT করল
         │
         ▼
  Supabase-এ UPDATE → সফল হলো
         │
         ▼
  AppState.doctors = AppState.doctors.map(d =>
    d.id === editedId ? updatedDoctor : d       ← Delta Replace
  )
         │
         ▼
  UI: শুধু সেই row-টি re-render হলো

─────────────────────────────────────────────────

Admin একটি ডাক্তার DELETE করল
         │
         ▼
  Supabase-এ DELETE → সফল হলো
  (CASCADE: chambers, reviews সব মুছে গেছে DB-তে)
         │
         ▼
  AppState.doctors  = AppState.doctors.filter(d => d.id !== deletedId)
  AppState.chambers = AppState.chambers.filter(c => c.doctor_id !== deletedId)
  AppState.reviews  = AppState.reviews.filter(r => r.doctor_id !== deletedId)
         │                                         ← Local cache-ও sync হলো
         ▼
  UI: সেই row টি সরে গেল (animation সহ)

─────────────────────────────────────────────────

Manual 🔄 Refresh Button চাপলে
         │
         ▼
  AppState.isLoaded = false
  AppState = {} (reset)
         │
         ▼
  পুনরায় Supabase থেকে সব fresh data fetch
```

### Refresh Button — কোথায় থাকবে

Sidebar-এর একদম নিচে একটি ছোট `🔄 ক্যাশ রিফ্রেশ করুন` বাটন। চাপলে confirm dialog: _"সব ডেটা নতুন করে লোড হবে। অপেক্ষা করুন।"_

---

## SECTION 6 — ATOMIC DATA ENTRY: 1 FORM → MULTIPLE TABLES

### Doctor Add Form — Full UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  নতুন ডাক্তার যোগ করুন                                    [✕ Close] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ── বেসিক তথ্য ──────────────────────────────────────────────────  │
│                                                                     │
│  নাম (ইংরেজি)*  [Dr. Priyanka Das              ]                   │
│  নাম (বাংলা)    [ডা. প্রিয়ঙ্কা দাস             ]                   │
│  URL Slug*      [dr-priyanka-das-coochbehar    ] ← auto-generate  │
│  বিশেষজ্ঞতা*   [▾ Cardiology — হৃদরোগ         ]  ← Enum Dropdown  │
│  ডিগ্রি         [MBBS, MD] [+ আরো যোগ করুন]                       │
│  অভিজ্ঞতা       [15    ] বছর                                       │
│  BMDC নম্বর     [A-12345                       ]                   │
│  ফোন            [98765-43210                   ]                   │
│  WhatsApp       [98765-43210                   ]                   │
│  ফি (সর্বনিম্ন) [300   ]  ফি (সর্বোচ্চ) [500   ]                   │
│                                                                     │
│  ── ছবি আপলোড ────────────────────────────────────────────────── │
│  [ 📷 ছবি বেছে নিন ]                                               │
│  ✅ Preview: [👤 thumbnail]  → Auto: WebP | 95KB ← compression    │
│                                                                     │
│  ── সার্চ সেটিংস ─────────────────────────────────────────────── │
│  Search Aliases [P.K. Das, পি কে দাস, PKDas    ] (comma separated)│
│  Tags           [diabetes, thyroid              ] (comma separated)│
│                                                                     │
│  ── স্ট্যাটাস ─────────────────────────────────────────────────── │
│  ভেরিফিকেশন  [▾ Verified      ]   Featured  [☑ হ্যাঁ]             │
│  উপলব্ধ      [▾ হ্যাঁ          ]   Priority  [10     ]             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ── চেম্বার তথ্য ─────────────────────────────────────────────────  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  চেম্বার #1                                        [🗑️ Delete]│ │
│  │  চেম্বারের নাম*  [City Clinic Chamber             ]          │ │
│  │  ঠিকানা*         [Station Road, Cooch Behar       ]          │ │
│  │  এলাকা           [Station Road                    ]          │ │
│  │  শহর*            [▾ Cooch Behar                   ]  ← Enum  │ │
│  │  ফোন             [0358-222333                     ]          │ │
│  │  Google Maps     [https://maps.google.com/...     ]          │ │
│  │  ফি (টাকা)       [400                             ]          │ │
│  │  প্রাথমিক চেম্বার [☑ হ্যাঁ]                                   │ │
│  │                                                               │ │
│  │  সময়সূচি:                                                     │ │
│  │  [☑ শনি] [☑ রবি] [☐ সোম] [☐ মঙ্গল] [☑ বুধ] [☐ বৃহ] [☐ শুক্র]│ │
│  │  খোলার সময়: [10:00 AM]  বন্ধের সময়: [02:00 PM]             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  চেম্বার #2                                        [🗑️ Delete]│ │
│  │  ... (same fields) ...                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [ ➕ আরেকটি চেম্বার যোগ করুন ]                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  [💾 Draft সেভ করুন]              [ ✅ সম্পূর্ণ সেভ করুন ]         │
└─────────────────────────────────────────────────────────────────────┘
```

### Atomic Save Logic — Sequential Async Flow

একটি form থেকে দুটি আলাদা টেবিলে ডেটা সেভের জন্য **Sequential Async/Await** pattern ব্যবহার হবে। এটি crash-safe কারণ প্রতিটি step নিশ্চিত হওয়ার পরেই পরের step চলে।

```
User "সম্পূর্ণ সেভ করুন" চাপল
         │
         ▼
STEP 1: Form Validation
  ─ সব required field পূরণ হয়েছে?
  ─ কমপক্ষে ১টি চেম্বার আছে?
  ─ NO → Error highlight করো, stop
  ─ YES → পরের step
         │
         ▼
STEP 2: Image Upload (যদি ছবি দেওয়া হয়)
  imageUpload.js → compress → WebP → Supabase storage
  ← পাওয়া গেল: "doctors/doc_abc123_1748765432.webp"
  (পুরো URL নয়, শুধু relative path)
         │
         ▼
STEP 3: doctors টেবিলে INSERT
  supabase.from('doctors').insert({
    name_en: "Dr. Priyanka Das",
    specialty: "cardiology",
    photo_url: "doctors/doc_abc123_1748765432.webp",  ← relative path
    ...
  }).select()  ← নতুন doctor-এর ID ফেরত নিতে হবে
         │
    ┌────┴────┐
  ERROR     SUCCESS
    │           │
    ▼           ▼
  Toast       doctor.id পাওয়া গেল
  "❌ সেভ       → STEP 4-এ যাও
  ব্যর্থ"
         │
         ▼
STEP 4: chambers টেবিলে INSERT (একাধিক)
  প্রতিটি চেম্বারে doctor_id = উপরে পাওয়া ID

  supabase.from('chambers').insert([
    { doctor_id: newDoctorId, chamber_name: "City Clinic", city: "cooch_behar", ... },
    { doctor_id: newDoctorId, chamber_name: "Tufanganj Chamber", city: "tufanganj", ... }
  ])
         │
    ┌────┴────┐
  ERROR     SUCCESS
    │           │
    ▼           ▼
  ⚠️ Warning  STEP 5: Cache Update
  "ডাক্তার সেভ
  হয়েছে, কিন্তু
  চেম্বার সেভ
  হয়নি। আবার
  চেষ্টা করুন।"
         │
         ▼
STEP 5: Local Cache Delta Update
  AppState.doctors.unshift(newDoctor)     ← list-এর সামনে যোগ
  AppState.chambers.push(...newChambers)  ← সব নতুন চেম্বার যোগ

STEP 6: localStorage Draft মুছে ফেলো
  localStorage.removeItem('draft_doctor')

STEP 7: UI Update
  Modal বন্ধ করো
  Table-এ নতুন row যোগ করো (re-fetch ছাড়াই)
  Toast: "✅ ডাক্তার ও চেম্বার সফলভাবে সেভ হয়েছে!"
```

### Edit Mode — Doctor + Chambers

Edit button চাপলে:
1. AppState থেকে doctor data modal-এ populate হয়
2. সেই doctor-এর chambers: `AppState.chambers.filter(c => c.doctor_id === id)` → চেম্বার widget-এ দেখায়
3. Save করলে: `doctors` UPDATE + chambers-এর জন্য **upsert** (পুরনোগুলো update, নতুনগুলো insert, মুছে ফেলাগুলো delete)

---

## SECTION 7 — IMAGE PIPELINE: COMPRESS → CONVERT → UPLOAD → STORE

### কেন এটি প্রয়োজন

মোবাইলে তোলা ছবি সাধারণত 2-5MB হয়। সুপাবেসে সরাসরি আপলোড করলে storage খরচ বাড়ে, এবং user-side web app-এ লোড স্লো হয়। Canvas API ব্যবহার করে browser-এই compress ও WebP convert করা হবে — কোনো server বা library ছাড়াই।

### Image Processing Flowchart

```
Admin ছবি সিলেক্ট করল (File Input)
         │
         ▼
STEP A: File Validation
  ─ Type: image/jpeg বা image/png বা image/webp?
  ─ Size: 10MB-এর বেশি? → "ফাইলটি অনেক বড়" error
  ─ ✅ OK → পরের step

STEP B: FileReader দিয়ে ছবি পড়া
  FileReader.readAsDataURL(file)
  → Base64 encoded image data পাওয়া গেল
         │
         ▼
STEP C: Canvas-এ ছবি আঁকা
  একটি invisible HTML Canvas element তৈরি করো
  Canvas size: সর্বোচ্চ 800×800px (proportional resize)
  Image-কে Canvas-এ draw করো
         │
         ▼
STEP D: WebP-তে Export + Compress
  canvas.toBlob(
    callback,
    'image/webp',    ← format
    0.80             ← quality (80% = ভালো quality, ছোট size)
  )
  → WebP Blob পাওয়া গেল (~80-150KB)
         │
         ▼
STEP E: Unique File Name তৈরি
  entity: "doc" (doctor), "hosp" (hospital), "ad" (ads)
  entityId: form-এর temporary UUID বা DB-returned ID
  timestamp: Date.now()

  fileName = `doc_${entityId}_${timestamp}.webp`
  → উদাহরণ: "doc_a1b2c3d4_1748765432891.webp"

  storagePath = `doctors/${fileName}`
  → "doctors/doc_a1b2c3d4_1748765432891.webp"
         │
         ▼
STEP F: Supabase Storage-এ Upload
  supabase.storage
    .from('doctor-photos')         ← bucket name
    .upload(storagePath, webpBlob, {
      contentType: 'image/webp',
      upsert: false                 ← ওভাররাইট করবে না
    })
         │
    ┌────┴────┐
  ERROR     SUCCESS
    │           │
    ▼           ▼
  "ছবি আপলোড  storagePath পাওয়া গেল:
  ব্যর্থ হয়েছে" "doctors/doc_a1b2c3d4_1748765432891.webp"
                 ↓
STEP G: Database-এ Relative Path সেভ
  doctors টেবিলের photo_url কলামে:
  "doctors/doc_a1b2c3d4_1748765432891.webp"

  ← পুরো URL সেভ নয়!
  ← শুধু relative path!

STEP H: Web App-এ ছবি দেখানো
  SUPABASE_STORAGE_BASE_URL + "/" + photo_url
  = "https://xyz.supabase.co/storage/v1/object/public/doctor-photos/"
  + "doctors/doc_a1b2c3d4_1748765432891.webp"

  সুপাবেসের URL পরিবর্তন হলে → শুধু .env-এর BASE_URL আপডেট করলেই হবে
  Database-এর একটি record-ও change করতে হবে না ✅
         │
         ▼
STEP I: Admin Panel-এ Preview দেখানো
  Preview box-এ thumbnail দেখাও
  "✅ ছবি compress হয়েছে: 2.3MB → 94KB (WebP)"
```

### Preview Box — UI Spec

```
┌──────────────────────────────────────────────────────────┐
│  [ 📷 ছবি বেছে নিন ]                                     │
│                                                          │
│  ┌──────────┐                                            │
│  │          │  ✅ আপলোড সম্পন্ন                          │
│  │  [ছবি]  │  মূল সাইজ:    2.3 MB (JPEG)               │
│  │          │  Compressed:  94 KB (WebP)                 │
│  └──────────┘  সাশ্রয়:      96% ↓                        │
│               ফাইল নাম:    doc_abc_17487654.webp         │
└──────────────────────────────────────────────────────────┘
```

---

## SECTION 8 — DRAFT AUTO-SAVE WITH LOCALSTORAGE

### কোন পরিস্থিতিতে Draft কাজে আসবে

Admin একটি ডাক্তারের ফর্মে ১৫ মিনিট ধরে তথ্য ভরছেন। হঠাৎ ট্যাব বন্ধ হয়ে গেল বা ব্রাউজার crash করল। Draft Auto-Save থাকলে পরের বার ফর্ম খুললেই সব তথ্য ফিরে পাবেন।

### Auto-Save Logic

```
Form-এ যেকোনো field-এ typing শুরু হলো
         │
         ▼
Debounce Timer: ৩ সেকেন্ড idle
         │
         ▼
localStorage.setItem(
  'draft_doctor',
  JSON.stringify({ formData, timestamp })
)
  → মূল: field values, chamber data (ছবি নয়)
  → প্রতি ৩ সেকেন্ডে auto-update
         │
         ▼
Form Header-এ দেখায়: "📝 Draft সেভ হয়েছে — 03:42 PM"
```

### Draft Recovery

```
Admin "নতুন ডাক্তার যোগ করুন" বাটন চাপল
         │
         ▼
localStorage-এ 'draft_doctor' আছে?
         │
    ┌────┴────┐
   YES        NO
    │           │
    ▼           ▼
  Banner:     খালি form দেখাও
  "📋 আগের অসম্পূর্ণ draft পাওয়া গেছে।
   [✅ Resume করুন] [🗑️ বাদ দিন]"
    │
    ▼
Resume: form-এ সব field populate হবে
```

### Draft Scope

```
localStorage Key           কখন তৈরি হয়       কখন মুছে যায়
─────────────────────────────────────────────────────────────
draft_doctor               Add form খুলতে     Successful save
draft_hospital             Add form খুলতে     Successful save
draft_doctor_edit_{id}     Edit form খুলতে    Successful save
draft_hospital_edit_{id}   Edit form খুলতে    Successful save
```

---

## SECTION 9 — MODULE-BY-MODULE CRUD FLOW MAP

### সব ১৫টি Module — কোন Module কোন Table touch করে

```
MODULE                    READ                   WRITE                  SPECIAL LOGIC
────────────────────────────────────────────────────────────────────────────────────────────
1. ডাক্তার ম্যানেজমেন্ট  doctors + chambers     INSERT→doctors         Atomic: doctor first,
                          + categories           then INSERT→chambers   chambers second
                          + cities               + imageUpload.js

2. হাসপাতাল              hospitals              INSERT→hospitals        Multi-image upload
   ম্যানেজমেন্ট           + hospital_images      INSERT→hospital_images  loop
                          + cities               + doctor_hospital_links

3. ব্যানার ও অ্যাড       ads                    INSERT/UPDATE ads       Date validation
                                                 + imageUpload.js       (end > start)

4. উপসর্গ ম্যানেজমেন্ট  symptoms               INSERT→symptoms         Mapping widget:
                          + symptom_specialty    INSERT→symptom_         specialty Enum
                          + categories           specialty_mapping       multi-select

5. রিভিউ মডারেশন        reviews (pending)      UPDATE status           Approve → rating
                                                 (approved/rejected)     recalculate in
                                                                         doctors table

6. Featured কন্ট্রোল     doctors                UPDATE is_featured,     Drag-to-reorder
                          + hospitals            featured_priority       saves priority

7. ইমেজ সিস্টেম         (কোনো আলাদা table নেই) imageUpload.js          Canvas API
                                                 সব module-এ embedded    (Section 7)

8. ক্যাটাগরি             categories             INSERT/UPDATE/DELETE    Icon upload
   ম্যানেজমেন্ট                                                          display_order drag

9. ইউজার সাবমিশন       user_submissions        UPDATE status           Review → approve
                                                 (approved/rejected)     = create doctor/
                                                                         hospital entry

10. অ্যানালিটিক্স        analytics_events       READ ONLY               Charts: recharts
    ড্যাশবোর্ড           (aggregated)                                   (CDN) বা simple
                                                                         HTML tables

11. নোটিস               notifications          INSERT/UPDATE/DELETE    Expiry date check
    ম্যানেজমেন্ট                                                         auto-deactivate

12. জরুরি যোগাযোগ       emergency_contacts     INSERT/UPDATE/DELETE    City filter

13. SEO কন্ট্রোল        seo_pages              INSERT/UPDATE           JSON-LD preview

14. সেটিংস              app_settings           UPDATE (single row)     Logo upload
    প্যানেল                                     (always upsert)

15. অ্যাডমিন Auth       admin_users            Supabase Auth           Activity log
                         + admin_activity_logs  auto-managed            auto-write
```

### Review Approval — Rating Recalculation Logic

```
Admin একটি review "Approve" করল
         │
         ▼
reviews টেবিল UPDATE: status = 'approved'
         │
         ▼
সেই doctor-এর সব approved reviews fetch করো:
AppState.reviews.filter(r =>
  r.doctor_id === doctorId && r.status === 'approved'
)
         │
         ▼
নতুন rating_avg = sum(ratings) / count
নতুন rating_count = count
         │
         ▼
doctors টেবিল UPDATE:
{ rating_avg: newAvg, rating_count: newCount }
         │
         ▼
AppState-এ সেই doctor update (Delta)
UI-তে rating badge আপডেট
```

---

## SECTION 10 — IMPLEMENTATION SEQUENCE (Build Order)

### Phase 1 — Foundation (প্রথম বসুন)

```
Day 1:
  □ GitHub repo তৈরি করুন: uss-admin-panel
  □ index.html (login page) তৈরি করুন
  □ dashboard.html shell তৈরি করুন
  □ config/supabase.js: Supabase client initialize করুন
  □ core/auth.js: login + logout + session guard
  □ Netlify-তে drag-and-drop deploy করুন (HTTPS পাবেন)

Day 2:
  □ components/sidebar.js: সাইডবার HTML
  □ core/router.js: hash-based routing (#doctors, #hospitals)
  □ core/state.js: AppState object তৈরি করুন
  □ Dashboard home: stats cards (hardcoded প্রথমে)
```

### Phase 2 — Core Module (সবচেয়ে গুরুত্বপূর্ণ)

```
Day 3-4:
  □ core/imageUpload.js: Canvas compress + WebP + Supabase upload
  □ components/chamberWidget.js: Dynamic chamber add/remove
  □ modules/doctors.js:
      - List view (table)
      - Add form (with chambers)
      - Edit modal
      - Delete with confirm
  □ Draft auto-save (localStorage)

Day 5:
  □ modules/hospitals.js:
      - List + Add + Edit + Delete
      - Multi-image upload
  □ modules/categories.js: Simple CRUD
  □ modules/cities.js: Simple CRUD
```

### Phase 3 — Content Modules

```
Day 6:
  □ modules/symptoms.js: CRUD + mapping widget
  □ modules/ads.js: CRUD + date validation

Day 7:
  □ modules/reviews.js: Moderation UI + approve/reject
  □ modules/emergency.js: Simple CRUD
  □ modules/notifications.js: CRUD + expiry

Day 8:
  □ modules/seo.js
  □ modules/settings.js
  □ modules/submissions.js
  □ modules/analytics.js (read-only dashboard)
  □ modules/adminUsers.js
```

### Phase 4 — Polish

```
Day 9:
  □ components/toast.js: Success/Error notifications
  □ components/table.js: Reusable table with search/filter
  □ Smart cache: সব module-এ Delta Update implement
  □ Manual Refresh 🔄 button

Day 10:
  □ Full testing (সব module end-to-end test)
  □ Mobile responsiveness check (tablet-friendly sidebar)
  □ Final Netlify deploy + custom domain (optional)
```

---

## FINAL SUMMARY — Admin Panel Blueprint

```
CONSTRAINT                  SOLUTION
───────────────────────────────────────────────────────────────────────
No Complex Framework        Vanilla JS + Tailwind CDN + Supabase CDN
                            → ব্রাউজারে ডাবল-ক্লিকে চলে

Atomic Multi-Table Save     Sequential async/await: doctors INSERT
                            → get ID → chambers INSERT
                            → cascade-safe, crash-safe

Unique Image Naming         doc_{entityId}_{timestamp}.webp
                            → collision impossible

Relative Path Storage       photo_url = "doctors/doc_abc_123.webp"
                            → URL change হলেও DB intact

Auto Image Compression      Canvas API → WebP → 80-150KB
                            → No library, no server, browser-native

Dashboard Layout            Fixed sidebar (5 groups, 15 modules)
                            + fluid content area + stats cards

Admin Security              Supabase Auth (email+password)
                            + session guard on every page

Smart Caching               AppState global object + Delta Updates
                            (push/map/filter) + Manual Refresh 🔄
                            + localStorage Draft Auto-Save
───────────────────────────────────────────────────────────────────────
Total Files: ~25 | Zero npm | Zero build | Zero framework overhead
```

---

*Admin Panel Blueprint Version: 1.0*
*Covers: All 8 Constraints | All 15 Modules | All 19 Database Tables*
*Next Step: Code Implementation — Green Signal required ✅*
