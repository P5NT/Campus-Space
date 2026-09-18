/* ==========================================================================
   CAMPUS SPACE — data/courses.js
   Demo course catalog, materials, and academic resources.
   ========================================================================== */
"use strict";

const DEMO_COURSES = [
  {
    id: "csc401",
    code: "CSC 401",
    title: "Software Engineering",
    units: 3,
    level: "400",
    semester: "First",
    department: "Computer Science",
    faculty: "Computing",
    lecturer: "Dr. B. A. Ogunlade",
    rep: "Akinola Adeyemi",
    description:
      "Principles and practices of software engineering: requirements, design, testing, maintenance, and project management.",
    materials: [
      {
        name: "CSC 401 — Complete Lecture Notes",
        type: "pdf",
        size: "2.4 MB",
        uploaded: "2026-01-08",
      },
      {
        name: "CSC 401 — Past Questions 2024/2025",
        type: "pdf",
        size: "640 KB",
        uploaded: "2025-11-22",
      },
    ],
  },
  {
    id: "csc403",
    code: "CSC 403",
    title: "Compiler Construction",
    units: 3,
    level: "400",
    semester: "First",
    department: "Computer Science",
    faculty: "Computing",
    lecturer: "Prof. K. O. Adeleke",
    rep: "Akinola Adeyemi",
    description:
      "Lexical analysis, parsing, semantic analysis, intermediate code generation, and code optimisation.",
    materials: [
      {
        name: "CSC 403 — Lecture Notes (Weeks 1–6)",
        type: "pdf",
        size: "1.8 MB",
        uploaded: "2026-01-10",
      },
    ],
  },
  {
    id: "cyb301",
    code: "CYB 301",
    title: "Network Security",
    units: 3,
    level: "300",
    semester: "First",
    department: "Cyber Security",
    faculty: "Computing",
    lecturer: "Dr. A. A. Bakare",
    rep: "Oluwaseun Ogundipe",
    description:
      "Cryptography, authentication, firewalls, intrusion detection, and secure network design.",
    materials: [
      {
        name: "CYB 301 — Slide Deck Compilation",
        type: "pdf",
        size: "4.1 MB",
        uploaded: "2026-01-05",
      },
    ],
  },
  {
    id: "eee305",
    code: "EEE 305",
    title: "Signals and Systems",
    units: 3,
    level: "300",
    semester: "First",
    department: "Electrical and Electronics Engineering",
    faculty: "Engineering and Engineering Technology",
    lecturer: "Dr. F. O. Ajayi",
    rep: "Chiamaka Okafor",
    description:
      "Continuous and discrete time signals, LTI systems, Fourier analysis, and Laplace transforms.",
    materials: [
      {
        name: "EEE 305 — Courseware",
        type: "pdf",
        size: "3.2 MB",
        uploaded: "2026-01-07",
      },
      {
        name: "EEE 305 — Tutorial Sheet 1",
        type: "doc",
        size: "220 KB",
        uploaded: "2026-01-12",
      },
    ],
  },
  {
    id: "bch201",
    code: "BCH 201",
    title: "General Biochemistry I",
    units: 2,
    level: "200",
    semester: "First",
    department: "Biochemistry",
    faculty: "Sciences",
    lecturer: "Dr. M. O. Akintola",
    rep: "Ibrahim Suleiman",
    description:
      "Biomolecules, enzymes, bioenergetics, and metabolic pathways.",
    materials: [
      {
        name: "BCH 201 — Past Questions Bundle",
        type: "pdf",
        size: "980 KB",
        uploaded: "2025-12-02",
      },
    ],
  },
  {
    id: "acc401",
    code: "ACC 401",
    title: "Advanced Financial Accounting",
    units: 3,
    level: "400",
    semester: "First",
    department: "Accounting",
    faculty: "Management Sciences",
    lecturer: "Dr. O. I. Adegoke",
    rep: "Temilade Balogun",
    description:
      "Consolidation, group accounts, and advanced reporting standards.",
    materials: [
      {
        name: "ACC 401 — Revision Notes",
        type: "pdf",
        size: "1.5 MB",
        uploaded: "2026-01-03",
      },
    ],
  },
];

const DEMO_RESOURCES = [
  {
    id: "res001",
    name: "200L – 500L 2026/2027 First Semester Lecture Timetable",
    category: "Lecture Timetable",
    faculty: "Computing",
    department: "Computer Science",
    level: "400",
    course: "",
    semester: "First",
    session: "2026/2027",
    type: "pdf",
    size: "820 KB",
    uploaded: "2026-01-10",
    uploadedBy: "Folake Akinyemi",
  },
  {
    id: "res002",
    name: "2026/2027 First Semester Examination Timetable",
    category: "Exam Timetable",
    faculty: "Computing",
    department: "All",
    level: "All",
    course: "",
    semester: "First",
    session: "2026/2027",
    type: "pdf",
    size: "1.2 MB",
    uploaded: "2026-01-12",
    uploadedBy: "Segun Oyelaran",
  },
  {
    id: "res003",
    name: "CSC 401 — Past Questions (2022–2025)",
    category: "Past Questions",
    faculty: "Computing",
    department: "Computer Science",
    level: "400",
    course: "CSC 401",
    semester: "First",
    session: "2025/2026",
    type: "pdf",
    size: "640 KB",
    uploaded: "2025-11-22",
    uploadedBy: "Folake Akinyemi",
  },
  {
    id: "res004",
    name: "OAUSTECH Academic Calendar 2026/2027",
    category: "Academic Calendar",
    faculty: "All",
    department: "All",
    level: "All",
    course: "",
    semester: "Full Session",
    session: "2026/2027",
    type: "pdf",
    size: "460 KB",
    uploaded: "2026-01-02",
    uploadedBy: "Segun Oyelaran",
  },
  {
    id: "res005",
    name: "EEE 305 Signals and Systems Courseware",
    category: "Course Materials",
    faculty: "Engineering and Engineering Technology",
    department: "Electrical and Electronics Engineering",
    level: "300",
    course: "EEE 305",
    semester: "First",
    session: "2025/2026",
    type: "pdf",
    size: "3.2 MB",
    uploaded: "2026-01-07",
    uploadedBy: "Folake Akinyemi",
  },
  {
    id: "res006",
    name: "SIWES Logbook Template 2026",
    category: "Academic Resource",
    faculty: "All",
    department: "All",
    level: "All",
    course: "",
    semester: "Second",
    session: "2025/2026",
    type: "doc",
    size: "180 KB",
    uploaded: "2025-12-15",
    uploadedBy: "Segun Oyelaran",
  },
];

/* ==========================================================================
   LECTURE & EXAM TIMETABLES — by Faculty, Department, Level
   Each entry is scoped to a specific department and level.
   A student only sees entries matching their own faculty, department, level.
   ========================================================================== */

const DEMO_LECTURE_TIMETABLES = [
  /* Computing — Computer Science */
  {
    faculty: "Computing",
    department: "Computer Science",
    level: "400",
    slots: [
      {
        time: "8:00 – 10:00 AM",
        periods: {
          Monday: {
            code: "CSC 401",
            venue: "Hall A",
            lecturer: "Dr. Ogunlade",
            color: "brand",
          },
          Wednesday: {
            code: "CSC 403",
            venue: "Hall B",
            lecturer: "Prof. Adeleke",
            color: "marine",
          },
        },
      },
      {
        time: "10:00 – 12:00 PM",
        periods: {
          Tuesday: {
            code: "CYB 301",
            venue: "ICT Lab 1",
            lecturer: "Dr. Bakare",
            color: "success",
          },
          Thursday: {
            code: "CSC 405",
            venue: "Hall A",
            lecturer: "Dr. Salako",
            color: "warning",
          },
        },
      },
      {
        time: "12:00 – 2:00 PM",
        periods: {
          Wednesday: {
            code: "CSC 401",
            venue: "Hall A",
            lecturer: "Dr. Ogunlade",
            color: "brand",
          },
          Friday: {
            code: "EEE 305",
            venue: "Eng Hall",
            lecturer: "Dr. Ajayi",
            color: "marine",
          },
        },
      },
      {
        time: "2:00 – 4:00 PM",
        periods: {
          Monday: {
            code: "CSC 407",
            venue: "Lab 2",
            lecturer: "Dr. Aliyu",
            color: "warning",
          },
          Thursday: {
            code: "CSC 403",
            venue: "Hall B",
            lecturer: "Prof. Adeleke",
            color: "marine",
          },
        },
      },
    ],
  },
  /* Computing — Cyber Security */
  {
    faculty: "Computing",
    department: "Cyber Security",
    level: "200",
    slots: [
      {
        time: "8:00 – 10:00 AM",
        periods: {
          Tuesday: {
            code: "CYB 201",
            venue: "ICT Lab 2",
            lecturer: "Dr. Bakare",
            color: "success",
          },
          Thursday: {
            code: "CYB 203",
            venue: "ICT Lab 1",
            lecturer: "Dr. Adeyemi",
            color: "marine",
          },
        },
      },
      {
        time: "10:00 – 12:00 PM",
        periods: {
          Monday: {
            code: "CSC 201",
            venue: "Hall C",
            lecturer: "Dr. Ogunlade",
            color: "brand",
          },
          Wednesday: {
            code: "CYB 205",
            venue: "ICT Lab 3",
            lecturer: "Dr. Yakubu",
            color: "warning",
          },
        },
      },
    ],
  },
  /* Engineering — EEE */
  {
    faculty: "Engineering and Engineering Technology",
    department: "Electrical and Electronics Engineering",
    level: "300",
    slots: [
      {
        time: "8:00 – 10:00 AM",
        periods: {
          Monday: {
            code: "EEE 301",
            venue: "Eng Hall A",
            lecturer: "Dr. Ajayi",
            color: "marine",
          },
        },
      },
      {
        time: "10:00 – 12:00 PM",
        periods: {
          Tuesday: {
            code: "EEE 305",
            venue: "Eng Hall B",
            lecturer: "Dr. Ajayi",
            color: "marine",
          },
          Thursday: {
            code: "EEE 307",
            venue: "Lab 1",
            lecturer: "Dr. Ogunbiyi",
            color: "success",
          },
        },
      },
      {
        time: "2:00 – 4:00 PM",
        periods: {
          Wednesday: {
            code: "EEE 303",
            venue: "Eng Hall A",
            lecturer: "Prof. Salami",
            color: "brand",
          },
        },
      },
    ],
  },
  /* Sciences — Biochemistry */
  {
    faculty: "Sciences",
    department: "Biochemistry",
    level: "200",
    slots: [
      {
        time: "8:00 – 10:00 AM",
        periods: {
          Tuesday: {
            code: "BCH 201",
            venue: "Sci Hall A",
            lecturer: "Dr. Akintola",
            color: "brand",
          },
        },
      },
      {
        time: "10:00 – 12:00 PM",
        periods: {
          Monday: {
            code: "BCH 203",
            venue: "Sci Lab 2",
            lecturer: "Dr. Oladipo",
            color: "success",
          },
          Wednesday: {
            code: "CHM 201",
            venue: "Sci Hall B",
            lecturer: "Dr. Eze",
            color: "warning",
          },
        },
      },
    ],
  },
  /* Management — Accounting */
  {
    faculty: "Management Sciences",
    department: "Accounting",
    level: "400",
    slots: [
      {
        time: "8:00 – 10:00 AM",
        periods: {
          Monday: {
            code: "ACC 401",
            venue: "Mgmt Hall 1",
            lecturer: "Dr. Adegoke",
            color: "brand",
          },
        },
      },
      {
        time: "10:00 – 12:00 PM",
        periods: {
          Wednesday: {
            code: "ACC 405",
            venue: "Mgmt Hall 2",
            lecturer: "Dr. Oyedeji",
            color: "marine",
          },
        },
      },
    ],
  },
  /* Nursing — Nursing Science */
  {
    faculty: "Nursing and Allied Sciences",
    department: "Nursing Science",
    level: "500",
    slots: [
      {
        time: "8:00 – 10:00 AM",
        periods: {
          Monday: {
            code: "NSC 501",
            venue: "Nursing Hall",
            lecturer: "Dr. Okafor",
            color: "brand",
          },
          Wednesday: {
            code: "NSC 503",
            venue: "Clinical Lab",
            lecturer: "Dr. Adeleke",
            color: "success",
          },
        },
      },
      {
        time: "12:00 – 2:00 PM",
        periods: {
          Friday: {
            code: "NSC 507",
            venue: "Nursing Hall",
            lecturer: "Dr. Nwosu",
            color: "marine",
          },
        },
      },
    ],
  },
];

const DEMO_EXAM_TIMETABLES = [
  /* Computing — Computer Science Level 400 */
  {
    faculty: "Computing",
    department: "Computer Science",
    level: "400",
    exams: [
      {
        date: "2026-04-20",
        time: "9:00 AM – 12:00 PM",
        course: "CSC 401",
        title: "Software Engineering",
        venue: "Main Hall A",
      },
      {
        date: "2026-04-21",
        time: "9:00 AM – 12:00 PM",
        course: "CSC 403",
        title: "Compiler Construction",
        venue: "Main Hall B",
      },
      {
        date: "2026-04-23",
        time: "1:00 PM – 4:00 PM",
        course: "CYB 301",
        title: "Network Security",
        venue: "ICT Centre Lab 1",
      },
      {
        date: "2026-04-25",
        time: "9:00 AM – 12:00 PM",
        course: "EEE 305",
        title: "Signals and Systems",
        venue: "Engineering Hall",
      },
    ],
  },
  /* Computing — Cyber Security Level 200 */
  {
    faculty: "Computing",
    department: "Cyber Security",
    level: "200",
    exams: [
      {
        date: "2026-04-20",
        time: "1:00 PM – 4:00 PM",
        course: "CYB 201",
        title: "Introduction to Cyber Security",
        venue: "ICT Centre Lab 1",
      },
      {
        date: "2026-04-22",
        time: "9:00 AM – 12:00 PM",
        course: "CSC 201",
        title: "Data Structures",
        venue: "Main Hall C",
      },
      {
        date: "2026-04-24",
        time: "1:00 PM – 4:00 PM",
        course: "CYB 205",
        title: "Cryptography Foundations",
        venue: "ICT Centre Lab 3",
      },
    ],
  },
  /* Engineering — EEE Level 300 */
  {
    faculty: "Engineering and Engineering Technology",
    department: "Electrical and Electronics Engineering",
    level: "300",
    exams: [
      {
        date: "2026-04-22",
        time: "9:00 AM – 12:00 PM",
        course: "EEE 301",
        title: "Circuit Theory II",
        venue: "Engineering Hall A",
      },
      {
        date: "2026-04-24",
        time: "1:00 PM – 4:00 PM",
        course: "EEE 305",
        title: "Signals and Systems",
        venue: "Engineering Hall B",
      },
      {
        date: "2026-04-27",
        time: "9:00 AM – 12:00 PM",
        course: "EEE 303",
        title: "Electromagnetic Fields",
        venue: "Engineering Hall A",
      },
    ],
  },
  /* Sciences — Biochemistry Level 200 */
  {
    faculty: "Sciences",
    department: "Biochemistry",
    level: "200",
    exams: [
      {
        date: "2026-04-21",
        time: "9:00 AM – 12:00 PM",
        course: "BCH 201",
        title: "General Biochemistry I",
        venue: "Science Hall A",
      },
      {
        date: "2026-04-24",
        time: "1:00 PM – 4:00 PM",
        course: "CHM 201",
        title: "Organic Chemistry",
        venue: "Science Hall B",
      },
    ],
  },
  /* Management — Accounting Level 400 */
  {
    faculty: "Management Sciences",
    department: "Accounting",
    level: "400",
    exams: [
      {
        date: "2026-04-30",
        time: "9:00 AM – 12:00 PM",
        course: "ACC 401",
        title: "Advanced Financial Accounting",
        venue: "Management Hall",
      },
      {
        date: "2026-05-04",
        time: "1:00 PM – 4:00 PM",
        course: "ACC 405",
        title: "Auditing and Assurance",
        venue: "Management Hall",
      },
    ],
  },
  /* Nursing — Nursing Science Level 500 */
  {
    faculty: "Nursing and Allied Sciences",
    department: "Nursing Science",
    level: "500",
    exams: [
      {
        date: "2026-04-23",
        time: "9:00 AM – 12:00 PM",
        course: "NSC 501",
        title: "Advanced Clinical Practice",
        venue: "Nursing Hall",
      },
      {
        date: "2026-04-26",
        time: "1:00 PM – 4:00 PM",
        course: "NSC 503",
        title: "Community Health Nursing",
        venue: "Nursing Hall",
      },
    ],
  },
];

/* Helper — find the current student's lecture timetable */
function getStudentLectureTimetable(student) {
  if (!student) return null;
  return DEMO_LECTURE_TIMETABLES.find(function (t) {
    return (
      t.faculty === student.faculty &&
      t.department === student.department &&
      t.level === student.level
    );
  });
}

/* Helper — find the current student's exam timetable */
function getStudentExamTimetable(student) {
  if (!student) return null;
  return DEMO_EXAM_TIMETABLES.find(function (t) {
    return (
      t.faculty === student.faculty &&
      t.department === student.department &&
      t.level === student.level
    );
  });
}
