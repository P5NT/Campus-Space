/* ==========================================================================
   CAMPUS SPACE — data/news.js
   Campus news and official announcements.
   ========================================================================== */
"use strict";

const DEMO_NEWS = [
  {
    id: "news001",
    title: "OAUSTECH Emerges Top 5 in National Engineering Competition",
    category: "Campus",
    author: "Space Admin",
    date: "2026-01-12",
    image: "../../assets/images/news/engineering-win-01.jpg",
    excerpt:
      "A team of four 400-level engineering students placed in the top five at the national engineering design competition in Abuja.",
    body: `A team of four 400-level students from the Faculty of Engineering and Engineering Technology has placed in the top five at the National Engineering Design Competition held in Abuja.

The team designed a low-cost solar-powered water purification unit intended for rural communities. Judges praised the design for its practical relevance and the clarity of the team's field testing.

The Vice-Chancellor congratulated the team and reaffirmed the university's commitment to applied research that solves real problems.`,
  },
  {
    id: "news002",
    title: "New Digital Library Portal Now Live for All Students",
    category: "Academics",
    author: "Space Admin",
    date: "2026-01-09",
    image: "../../assets/images/news/library-portal-01.jpg",
    excerpt:
      "Students can now access over 12,000 academic journals, textbooks, and reference materials through the new digital library portal.",
    body: `The university library has launched a new digital portal giving all registered students access to over 12,000 academic journals, textbooks and reference materials.

Access is available from any device using a student's matric number. The portal includes curated reading lists aligned to each faculty and department.

Orientation sessions will be held across faculties in the coming weeks.`,
  },
  {
    id: "news003",
    title: "Faculty of Computing Launches Cybersecurity Innovation Lab",
    category: "Campus",
    author: "Space Admin",
    date: "2026-01-05",
    image: "../../assets/images/news/cyber-lab-01.jpg",
    excerpt:
      "The new lab will support hands-on learning in ethical hacking, digital forensics, and threat analysis.",
    body: `The Faculty of Computing has opened a dedicated Cybersecurity Innovation Lab equipped for hands-on work in ethical hacking, digital forensics and threat analysis.

The lab will host weekly clinics open to all Cyber Security and Computer Science students, and will support student teams entering national cybersecurity challenges.`,
  },
  {
    id: "news004",
    title: "2026/2027 Academic Session Officially Begins",
    category: "Academics",
    author: "Space Admin",
    date: "2026-01-02",
    image: "../../assets/images/news/session-begins-01.jpg",
    excerpt:
      "The new academic session has formally commenced. All students are expected to complete course registration within the first three weeks.",
    body: `The 2026/2027 academic session has formally commenced. Returning students are expected to complete online course registration within the first three weeks of the session.

The full academic calendar has been published and is available under Academics. Students should review the calendar carefully and note all deadlines.`,
  },
];

const DEMO_ANNOUNCEMENTS = [
  {
    id: "ann001",
    title: "Course Registration Deadline Extended to 26 January 2026",
    author: "Space Admin",
    date: "2026-01-13",
    important: true,
    body: `The deadline for 2026/2027 first semester course registration has been extended to 26 January 2026.

Students who have not yet completed their registration should do so via the student portal before the new deadline. Late registration will not be accepted beyond this date.`,
    affected: "All students",
  },
  {
    id: "ann002",
    title: "Examination Timetable Published — First Semester 2026/2027",
    author: "Space Admin",
    date: "2026-01-12",
    important: true,
    body: `The first semester examination timetable for the 2026/2027 academic session has been published.

Students should download the timetable from the Academic Resources section and confirm their examination venues. Any clash must be reported to the Examinations Office within five working days.`,
    affected: "All students",
  },
  {
    id: "ann003",
    title: "Fee Payment Deadline — Second Instalment",
    author: "Space Admin",
    date: "2026-01-10",
    important: false,
    body: `The second instalment of the 2026/2027 tuition fee is due by 31 January 2026.

Students who have not completed payment by the deadline will not be able to access examination services.`,
    affected: "All students",
  },
  {
    id: "ann004",
    title: "Library Orientation for New Students",
    author: "Space Admin",
    date: "2026-01-08",
    important: false,
    body: `Library orientation sessions for students new to the university will hold across the next two weeks. Sessions cover physical library use, the digital portal, and citation guidance.

Check the noticeboard at your faculty for your group's assigned time.`,
    affected: "New students",
  },
];
