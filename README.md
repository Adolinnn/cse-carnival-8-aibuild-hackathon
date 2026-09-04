# 🎓 CampusOS — Intelligent University Command Center

> **CSE Carnival 8.0 · AI Build Hackathon Solution**  
> An enterprise-grade, multi-tenant university management platform and AI copilot (**austchan**) that understands, coordinates, and acts on real-time campus data.

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![OpenAI / OpenRouter](https://img.shields.io/badge/LLM-Function--Calling-FF8000?logo=openai&logoColor=white)](https://openrouter.ai/)

---

## 📌 1. Project Overview

**CampusOS** solves the chronic fragmentation of university campus life. Class schedules, room availability, upcoming club events, departmental notices, and assignment deadlines are typically scattered across social media group chats, notice boards, and spreadsheets.

CampusOS unifies all five core campus systems into an isolated, multi-tenant web application backed by MongoDB and pairs it with **austchan**, an autonomous AI copilot with strict function-calling capabilities. When an administrator updates a room, reschedules a class, or posts an urgent notice, the change is instantly persisted in the database and immediately becomes the ground truth for both the visual dashboard and the AI copilot.

### Key Highlights
- **Full CRUD Across 5 Core Systems**: Complete administrative management for Schedules, Rooms, Events, Announcements, and Assignments.
- **Strict Booking Business Logic**: 
  - Operating hours enforced strictly between **6:00 AM – 6:00 PM**.
  - **No Double-Booking**: Automatically detects and rejects overlapping pre-booked times (`409 Conflict`).
  - **Class Routine Conflict Detection**: Cross-references scheduled university timetable classes on that weekday to prevent reserving occupied lecture rooms.
- **Dynamic Live Ticking Clock**: Real-time second-by-second ticker (`HH:MM:SS`) preserving the simulated September 2026 dataset baseline while allowing temporal testing.
- **Event URL Integration**: Admins can configure official event website and registration links; students can view and open event URLs directly.
- **Real-Time Backend Stats**: Dynamically retrieves live MongoDB collection metrics for the sidebar and dashboard overview.
- **Zero-Friction Student Access**: 1-click departmental and section login for students with zero credential friction.
- **Multi-Tenant Section Isolation & Super Admin**: Coursework, notices, and routines are scoped by Department, Semester, and Section (`CSE 3.2 A`, `CSE 4.1 B`), while physical campus rooms remain shared infrastructure. Super Admins can manage Section Admin credentials dynamically.

---

## 🛠️ 2. Tech Stack

- **Frontend**:
  - **Framework**: React 18 with Vite 6 (SPA with client-side routing & URL synchronization via `react-router-dom`)
  - **Styling**: Tailwind CSS with custom glassmorphism design system & dark/light mode
  - **Icons**: Lucide React
- **Backend**:
  - **Runtime**: Node.js (ES Modules)
  - **Server**: Express 4
  - **Database**: MongoDB via Mongoose (with automated fallback to in-memory `mongodb-memory-server` for zero-setup execution)
  - **Authentication**: JWT & salted scrypt password hashing
- **AI Agent**:
  - **LLM Engine**: OpenAI / OpenRouter API (`gpt-4o-mini`, `gpt-4o`, `gemini-2.0-flash`, or custom models)
  - **Architecture**: Autonomous agent loop with native Function Calling / Tool Use
  - **Security**: Strict two-tier role-based tool registry preventing unauthorized data mutation by students

---

## ⚙️ 3. Environment Variables

Create `.env` files in both the `server/` and `frontend/` directories (or at the repository root).

### Backend (`server/.env`)
```env
# MongoDB Connection String (Leave empty to use automatic embedded in-memory MongoDB)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusos?retryWrites=true&w=majority

# Server Port
PORT=4000

# OpenRouter / OpenAI API Key (Required for AI Copilot chat)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini

# Default Seed Identity
CAMPUS_STUDENT_ID=20-40532
CAMPUS_STUDENT_NAME=Sakibul Hassan
CAMPUS_STUDENT_SECTION=B
```

> **Note on Database**: If `MONGO_URI` is omitted or unable to connect, the server automatically starts an embedded in-memory MongoDB instance and auto-seeds the full initial university dataset.

### Frontend (`frontend/.env`)
```env
# API Base URL (Leave as /api to leverage Vite proxy)
VITE_API_BASE_URL=/api
```

---

## 🚀 4. Setup & Running Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [npm](https://www.npmjs.com/) (v9+)

### Installation
From the root directory of the project, install all dependencies:

```bash
# 1. Install root dependencies
npm install

# 2. Install backend dependencies
cd server && npm install && cd ..

# 3. Install frontend dependencies
cd frontend && npm install && cd ..
```

### Seeding the Database
To populate the database with initial semester schedules, rooms, announcements, assignments, and events:
```bash
npm run seed
```

### Running Locally (Full Stack)
You can start both the frontend and backend concurrently with a single command from the project root:

```bash
npm run dev
```

Alternatively, you can run them in separate terminal windows:
```bash
# Terminal 1: Backend Server (runs on http://localhost:4000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:3000)
cd frontend
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🔐 5. Demo Credentials

### Student Login
- **Authentication**: No password required!
- **Steps**: Select your Department (`CSE`), Semester (`3.2` or `4.1`), and Section (`A` or `B`), then click **"Enter CampusOS as Student"**.

### Administrator Login
- **Department**: `CSE`
- **Semester**: `3.2` (or `4.1`)
- **Section**: `A` (or `B`)
- **Admin Password**: `admin123`

---

## 🤖 6. How to Use the AI Agent (austchan)

Click the **austchan** button in the top right header to open the AI Copilot side drawer.

The agent has access to real-time tools connected to the live database and will strictly ground all answers in current campus records.

### Sample Questions to Try:

1. **Next Class & Schedule**:
   - *"When is my next class?"*
   - *"What classes do I have on Wednesday?"*
   - *"Where is my CSE 4113 class on Sunday?"*

2. **Deadlines & Coursework**:
   - *"What assignments do I have due this week?"*
   - *"Do I have any pending assignments for CSE 4113?"*

3. **Room Availability & Booking**:
   - *"Is Room 7A07 free right now?"*
   - *"Find me a room with capacity at least 30 that is free from 14:00 to 16:00 today."*
   - *"Can you book Room 7B01 on 2026-09-10 from 14:00 to 16:00 for project work?"* (The agent will check for conflicts and explain if a clash exists).

4. **Multi-Step Cross-System Reasoning**:
   - *"I have a break between 11:00 and 13:00 on Sunday. Are there any events or free rooms I can check out?"*
   - *"Did the instructor post any high priority notices about our class?"*

5. **Safety & Permission Checks**:
   - *"Cancel my registration for the Cloud Architecture workshop."* (Permitted)
   - *"Delete the CSE 4113 class from the schedule."* (Agent will reject: students cannot delete classes).

---

## 🧪 7. Running Tests

Run the backend multi-tenant security and functionality test suites:

```bash
cd server
node test-multitenant.mjs
node test-smoke.mjs
```

Validate frontend production build:
```bash
cd frontend
npm run build
```

---

## 📂 8. Repository Structure

```
cse-carnival-8-aibuild-hackathon/
├── frontend/                   # React 18 + Vite SPA
│   ├── src/
│   │   ├── api/                # HTTP client & endpoint routes
│   │   ├── components/         # Modular UI views (Dashboard, Rooms, Events, etc.)
│   │   ├── hooks/              # Custom hooks (Clock, Auth, Campus Data, Theme)
│   │   ├── pages/              # Routed pages with URL sync
│   │   └── services/           # Data layer & local caching
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express + Mongoose Backend
│   ├── src/
│   │   ├── agent/              # austchan Copilot engine, tools & prompt
│   │   ├── controllers/        # CRUD & special API endpoints
│   │   ├── models/             # Mongoose Schemas (Schedule, Room, Booking, etc.)
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Campus business logic & conflict detection
│   │   ├── db.js               # Database connection & memory fallback
│   │   ├── index.js            # Express server entry point
│   │   └── seed.js             # Initial dataset seeder
│   ├── package.json
│   ├── test-multitenant.mjs    # Security & isolation integration tests
│   └── test-smoke.mjs          # API smoke tests
├── schema/                     # Data schemas & field specs
├── data/                       # Initial raw JSON seed files
├── package.json                # Monorepo runner scripts
├── render.yaml                 # Render cloud deployment blueprint
└── README.md                   # Project documentation
```

---

## ⚖️ License

Distributed under the MIT License. Built for **AUST CSE Carnival 8.0 AI Build Hackathon**.
