/* ==========================================================================
   CAMPUS SPACE — data/associations.js
   Student associations, leadership positions and demo leaders.
   Admin-managed at runtime.
   ========================================================================== */
"use strict";

const DEMO_ASSOCIATIONS = [
  {
    id: "as-nass",
    name: "Nigerian Association of Science Students",
    acronym: "NASS",
    active: true,
  },
  {
    id: "as-nesa",
    name: "Nigerian Engineering Students Association",
    acronym: "NESA",
    active: true,
  },
  {
    id: "as-nacos",
    name: "Nigerian Association of Computing Students",
    acronym: "NACOS",
    active: true,
  },
  {
    id: "as-nasms",
    name: "National Association of Students of Management Sciences",
    acronym: "NASMS",
    active: true,
  },
  {
    id: "as-nansn",
    name: "National Association of Nigerian Student Nurses",
    acronym: "NANSN",
    active: true,
  },
  {
    id: "as-sugs",
    name: "Student Union Government of OAUSTECH",
    acronym: "SUG",
    active: true,
  },
];

const DEMO_POSITIONS = [
  { id: "pos-1", name: "President", active: true },
  { id: "pos-2", name: "Vice President", active: true },
  { id: "pos-3", name: "General Secretary", active: true },
  { id: "pos-4", name: "Academic Director", active: true },
  { id: "pos-5", name: "Welfare Director", active: true },
  { id: "pos-6", name: "Public Relations Officer", active: true },
  { id: "pos-7", name: "Financial Secretary", active: true },
  { id: "pos-8", name: "Social Director", active: true },
];

/* Leaders are students whose account has been assigned a position by Admin.
   The leader entry references the student record — identity data lives there. */
const DEMO_LEADERS = [
  { studentId: "STU002", associationId: "as-nesa", positionId: "pos-4" },
  { studentId: "STU004", associationId: "as-nasms", positionId: "pos-3" },
  { studentId: "STU005", associationId: "as-nansn", positionId: "pos-5" },
  { studentId: "STU007", associationId: "as-nacos", positionId: "pos-6" },
  { studentId: "STU005", associationId: "as-nansn", positionId: "pos-5" },
  { studentId: "STU001", associationId: "as-nass", positionId: "pos-1" },
];
