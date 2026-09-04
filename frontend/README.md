# CampusOS — Frontend Application

Modern university command center for **CampusOS** (CSE Carnival 8 / AI Build Hackathon).

## Features

- **Executive Campus Hub (Dashboard)**: Next class countdown, urgent announcements ticker, quick room availability metrics, and free time finder.
- **5 Platform Systems (Full CRUD + Zero Refresh)**:
  1. **Class Schedules**: Timetable matrix view (Sun–Thu) & list view, day/course/instructor filters, conflict-free Add/Edit/Delete.
  2. **Rooms & Facilities**: 7A Classrooms, 7B Labs, 7C Seminar Halls, capacity slider, equipment filters, direct Room Booking modal with conflict prevention, and booking cancellation.
  3. **Campus Events & RSVP**: Visual registration capacity progress, 1-click RSVP with duplicate/full prevention, attendee roster, and cancellation.
  4. **Notice Board (Announcements)**: Color-coded priority badges (High/Medium/Low), expiry filtering, and immediate truth synchronization.
  5. **Assignments & Deadlines**: Kanban pipeline (Pending, Submitted, Graded, Late) with 1-click drag/move status transitions and mark values.
- **Simulated Campus Clock**:
  - The seed dataset is set in **September 2026** (e.g. hackathon on Sep 10, guest lecture on Sep 8).
  - The top bar includes a simulated clock (defaults to `Wednesday, Sep 9, 2026 10:00 AM`) with a 1-click toggle to adjust time.
  - Ensures time-sensitive queries like *"When is my next class?"* and *"What's due this week?"* resolve accurately during judging.
- **AI Copilot Drawer**:
  - Pre-populated test chips for all judging queries from `sample_queries.md`.
  - Live Tool Execution Receipts: visual cards showing exact tool invocations (`get_schedules`, `get_rooms`, `book_room`, etc.) with expandable JSON inputs/outputs.
  - Ambiguity clarification dialog for vague queries (e.g. *"Just book me any room tomorrow afternoon"*).
  - Two-way live store updates: when the agent takes an action, the UI reflects it instantly.
- **Theme Modes (Dark & Light Mode)**:
  - Supports both dark mode and a customized light mode with the palette:
    - Base Background: `#FBFBFB`
    - Surfaces / Cards: `#E8F9FF`
    - Accents & Borders: `#C4D9FF`
    - Primary Highlight: `#C5BAFF`
  - Integrated Sun/Moon toggle in the top-right header with instant transition and `localStorage` persistence (`campusos_theme`).
- **Data Persistence**:
  - Automatically loads seed data from root `data/*.json`.
  - Persists all additions, edits, deletions, bookings, and registrations in browser `localStorage`.
  - Features a **"Reset to Seed Data"** button in the sidebar for easy demo resets.

---

## Getting Started

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Run the development server
```bash
npm run dev
```
The application will start on **`http://localhost:3000`**.

### 3. Build for production
```bash
npm run build
```

---

## Connecting to the Backend

The frontend includes an API service adapter at `src/services/api.ts`:
- By default, it operates with full local reactive persistence (`src/services/dataService.ts`).
- When your backend server is running, simply set the environment variable in `frontend/.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:5000/api
  ```
- The frontend will automatically forward REST requests (schedules, rooms, events, announcements, assignments, bookings, RSVPs) to your teammate's backend server!

