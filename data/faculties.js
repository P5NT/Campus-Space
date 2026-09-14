/* ==========================================================================
   CAMPUS SPACE — data/faculties.js
   OAUSTECH faculties and departments. Admin-managed at runtime.
   ========================================================================== */
"use strict";

const DEMO_FACULTIES = [
  {
    id: "fac-afnr",
    name: "Agriculture, Food & Natural Resources",
    shortName: "AFNR",
    active: true,
    departments: [
      {
        id: "dep-ae",
        name: "Agricultural Economics and Extension",
        active: true,
      },
      { id: "dep-aph", name: "Animal Production and Health", active: true },
      { id: "dep-cspm", name: "Crop, Soil and Pest Management", active: true },
      {
        id: "dep-fat",
        name: "Fisheries and Aquaculture Technology",
        active: true,
      },
      { id: "dep-fst", name: "Food Science and Technology", active: true },
      {
        id: "dep-fwem",
        name: "Forestry, Wildlife and Environmental Management",
        active: true,
      },
    ],
  },
  {
    id: "fac-earth",
    name: "Earth Sciences",
    shortName: "EARTH",
    active: true,
    departments: [
      { id: "dep-geo", name: "Geology", active: true },
      { id: "dep-gep", name: "Geophysics", active: true },
      { id: "dep-ms", name: "Marine Science", active: true },
      { id: "dep-meteo", name: "Meteorology", active: true },
    ],
  },
  {
    id: "fac-eng",
    name: "Engineering and Engineering Technology",
    shortName: "ENG",
    active: true,
    departments: [
      { id: "dep-civ", name: "Civil Engineering", active: true },
      { id: "dep-chm", name: "Chemical Engineering", active: true },
      {
        id: "dep-eee",
        name: "Electrical and Electronics Engineering",
        active: true,
      },
      { id: "dep-mec", name: "Mechanical Engineering", active: true },
      { id: "dep-pge", name: "Petroleum and Gas Engineering", active: true },
    ],
  },
  {
    id: "fac-mgmt",
    name: "Management Sciences",
    shortName: "MGMT",
    active: true,
    departments: [
      { id: "dep-acc", name: "Accounting", active: true },
      { id: "dep-bm", name: "Business Management", active: true },
      { id: "dep-eco", name: "Economics", active: true },
      { id: "dep-ent", name: "Entrepreneurship Management", active: true },
      { id: "dep-pm", name: "Project Management", active: true },
      { id: "dep-pub", name: "Public Administration", active: true },
    ],
  },
  {
    id: "fac-nurse",
    name: "Nursing and Allied Sciences",
    shortName: "NAS",
    active: true,
    departments: [
      { id: "dep-nsc", name: "Nursing Science", active: true },
      { id: "dep-mls", name: "Medical Laboratory Science", active: true },
      { id: "dep-ph", name: "Public Health", active: true },
    ],
  },
  {
    id: "fac-sci",
    name: "Sciences",
    shortName: "SCI",
    active: true,
    departments: [
      { id: "dep-bch", name: "Biochemistry", active: true },
      { id: "dep-bio", name: "Biological Sciences", active: true },
      { id: "dep-chs", name: "Chemical Sciences", active: true },
      { id: "dep-mts", name: "Mathematical Sciences", active: true },
      { id: "dep-phs", name: "Physical Sciences", active: true },
    ],
  },
  {
    id: "fac-comp",
    name: "Computing",
    shortName: "COMP",
    active: true,
    departments: [
      { id: "dep-csc", name: "Computer Science", active: true },
      { id: "dep-cyb", name: "Cyber Security", active: true },
    ],
  },
];
