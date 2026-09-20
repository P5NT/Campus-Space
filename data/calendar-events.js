/* ==========================================================================
   CAMPUS SPACE — data/calendar-events.js
   Structured academic calendar events for the 2026/2027 session.
   Used by:
     - pages/student/academic-calendar.html (timeline view)
     - pages/admin/academic-calendar.html (admin editor)
     - pdf-generator.js (printed PDF, split by semester)

   Each event has:
     id         — stable identifier for override matching
     isoDate    — YYYY-MM-DD for sorting and Date() parsing
     displayDate — pre-formatted string for display
     title      — event title
     desc       — one-line description
     session    — academic session
     semester   — "First" | "Second"
   ========================================================================== */
"use strict";

const DEMO_CALENDAR_EVENTS = [
  /* ============ FIRST SEMESTER ============ */
  {
    id: "cal-2026-27-1-01",
    isoDate: "2026-01-02",
    displayDate: "2 January 2026",
    title: "Resumption & Registration Begins",
    desc: "Returning students report to campus. Course registration opens.",
    session: "2026/2027",
    semester: "First",
  },
  {
    id: "cal-2026-27-1-02",
    isoDate: "2026-01-13",
    displayDate: "13 January 2026",
    title: "Late Registration Begins",
    desc: "A late registration fee applies from this date.",
    session: "2026/2027",
    semester: "First",
  },
  {
    id: "cal-2026-27-1-03",
    isoDate: "2026-01-20",
    displayDate: "20 January 2026",
    title: "Lectures Commence",
    desc: "First semester lectures begin across all faculties.",
    session: "2026/2027",
    semester: "First",
  },
  {
    id: "cal-2026-27-1-04",
    isoDate: "2026-01-26",
    displayDate: "26 January 2026",
    title: "Course Registration Deadline",
    desc: "No registration accepted beyond this date.",
    session: "2026/2027",
    semester: "First",
  },
  {
    id: "cal-2026-27-1-05",
    isoDate: "2026-03-16",
    displayDate: "16–20 March 2026",
    title: "Mid-Semester Assessments",
    desc: "Continuous assessment tests across all faculties.",
    session: "2026/2027",
    semester: "First",
  },
  {
    id: "cal-2026-27-1-06",
    isoDate: "2026-04-14",
    displayDate: "14–18 April 2026",
    title: "Revision Week",
    desc: "Lectures end. Students prepare for examinations.",
    session: "2026/2027",
    semester: "First",
  },
  {
    id: "cal-2026-27-1-07",
    isoDate: "2026-04-20",
    displayDate: "20 April 2026",
    title: "First Semester Examinations Begin",
    desc: "Examination timetable published in advance.",
    session: "2026/2027",
    semester: "First",
  },
  {
    id: "cal-2026-27-1-08",
    isoDate: "2026-05-08",
    displayDate: "8 May 2026",
    title: "First Semester Ends",
    desc: "End of first semester.",
    session: "2026/2027",
    semester: "First",
  },

  /* ============ SECOND SEMESTER ============ */
  {
    id: "cal-2026-27-2-01",
    isoDate: "2026-05-18",
    displayDate: "18 May 2026",
    title: "Second Semester Begins",
    desc: "Second semester lectures commence.",
    session: "2026/2027",
    semester: "Second",
  },
  {
    id: "cal-2026-27-2-02",
    isoDate: "2026-05-25",
    displayDate: "25 May 2026",
    title: "Course Registration Closes",
    desc: "Late registration opens for second semester.",
    session: "2026/2027",
    semester: "Second",
  },
  {
    id: "cal-2026-27-2-03",
    isoDate: "2026-06-29",
    displayDate: "29 June – 3 July 2026",
    title: "Mid-Semester Break",
    desc: "One-week mid-semester break across all faculties.",
    session: "2026/2027",
    semester: "Second",
  },
  {
    id: "cal-2026-27-2-04",
    isoDate: "2026-07-13",
    displayDate: "13–17 July 2026",
    title: "Second Semester Assessments",
    desc: "Continuous assessment tests across all faculties.",
    session: "2026/2027",
    semester: "Second",
  },
  {
    id: "cal-2026-27-2-05",
    isoDate: "2026-08-03",
    displayDate: "3–7 August 2026",
    title: "Revision Week",
    desc: "Lectures end. Students prepare for second semester examinations.",
    session: "2026/2027",
    semester: "Second",
  },
  {
    id: "cal-2026-27-2-06",
    isoDate: "2026-08-10",
    displayDate: "10 August 2026",
    title: "Second Semester Examinations Begin",
    desc: "End of session examinations commence.",
    session: "2026/2027",
    semester: "Second",
  },
  {
    id: "cal-2026-27-2-07",
    isoDate: "2026-08-28",
    displayDate: "28 August 2026",
    title: "End of 2026/2027 Academic Session",
    desc: "Long vacation begins. Resumption for the next session to be announced.",
    session: "2026/2027",
    semester: "Second",
  },
];
