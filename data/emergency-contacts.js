/* ==========================================================================
   CAMPUS SPACE — data/emergency-contacts.js
   Emergency contacts, drawn from registered students tagged by Admin.
   ========================================================================== */
"use strict";

const EMERGENCY_CATEGORIES = [
  {
    id: "security",
    label: "Security",
    icon: "fa-shield-halved",
    color: "security",
  },
  {
    id: "medical",
    label: "Medical",
    icon: "fa-truck-medical",
    color: "medical",
  },
  { id: "fire", label: "Fire", icon: "fa-fire-extinguisher", color: "fire" },
  {
    id: "other",
    label: "Other Emergency",
    icon: "fa-circle-exclamation",
    color: "other",
  },
];

/* In the demo, contacts reference existing student records by id.
   Admin assigns category + tags a registered student as emergency contact. */
const DEMO_EMERGENCY_CONTACTS = [
  {
    id: "ec001",
    studentId: "STU004",
    categoryId: "security",
    note: "Campus Security Liaison",
  },
  {
    id: "ec002",
    studentId: "STU005",
    categoryId: "medical",
    note: "Student Medical Coordinator",
  },
];
