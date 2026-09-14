/* ==========================================================================
   CAMPUS SPACE — data/opportunities.js
   Demo scholarship, internship, job, competition and grant listings.
   ========================================================================== */
"use strict";

const DEMO_OPPORTUNITIES = [
  {
    id: "opp001",
    title: "NNPC/SNEPCo National University Scholarship 2026",
    category: "Scholarships",
    organization: "NNPC / Shell Nigeria Exploration",
    location: "Nigeria (Nationwide)",
    deadline: "2026-02-28",
    summary:
      "Full tuition and stipend award for high-performing 200L and 300L STEM undergraduates in Nigerian universities.",
    description:
      "The NNPC/SNEPCo National University Scholarship supports academically gifted Nigerian undergraduates studying Science, Technology, Engineering and Mathematics. Awardees receive tuition support, book allowance, and a monthly stipend for the duration of their programme.",
    requirements: [
      "Must be in 200L or 300L",
      "Minimum CGPA of 3.5",
      "Studying a STEM discipline",
      "Nigerian citizen",
    ],
    applyUrl: "https://scholarships.nnpcgroup.com",
  },
  {
    id: "opp002",
    title: "Frontend Engineering Internship — Lagos",
    category: "Internships",
    organization: "Paystack",
    location: "Lagos, Nigeria (Hybrid)",
    deadline: "2026-02-10",
    summary:
      "Six-month paid internship for students with strong fundamentals in JavaScript, CSS and web accessibility.",
    description:
      "Join the Paystack frontend engineering team for a structured 6-month internship. You will work on real product surfaces alongside senior engineers and gain hands-on experience in a fast-moving fintech environment.",
    requirements: [
      "Strong JavaScript and CSS fundamentals",
      "Portfolio or GitHub with web projects",
      "Available for a 6-month placement",
    ],
    applyUrl: "https://paystack.com/careers",
  },
  {
    id: "opp003",
    title: "SIWES Placement — Ondo State Ministry of Works",
    category: "SIWES",
    organization: "Ondo State Ministry of Works",
    location: "Akure, Ondo State",
    deadline: "2026-03-15",
    summary:
      "Industrial training placement for 300L and 400L engineering students in civil, mechanical and electrical units.",
    description:
      "The Ondo State Ministry of Works offers supervised SIWES placements to engineering students in its civil, mechanical and electrical divisions. Students gain practical exposure to state infrastructure projects.",
    requirements: [
      "300L or 400L engineering student",
      "Valid SIWES letter from the university",
      "Strong work ethic",
    ],
    applyUrl: "https://ondostate.gov.ng/siwes",
  },
  {
    id: "opp004",
    title: "Hult Prize Campus Competition 2026",
    category: "Competitions",
    organization: "Hult Prize Foundation",
    location: "OAUSTECH Campus",
    deadline: "2026-02-05",
    summary:
      "Team-based social entrepreneurship competition. Winning team advances to the regional summit.",
    description:
      "The Hult Prize challenges student teams to solve a pressing global problem with a sustainable business model. Register a team of 3–4, present your idea on campus, and if you win, proceed to the regional summit.",
    requirements: [
      "Team of 3–4 registered OAUSTECH students",
      "Original idea aligned with the current challenge theme",
      "Commitment to the full competition cycle",
    ],
    applyUrl: "https://hultprize.org",
  },
  {
    id: "opp005",
    title: "Data Science Fellowship — Lagos",
    category: "Fellowships",
    organization: "Data Science Nigeria",
    location: "Lagos, Nigeria",
    deadline: "2026-02-20",
    summary:
      "12-week intensive fellowship covering Python, machine learning, and real-world data projects.",
    description:
      "Data Science Nigeria invites applications for its 2026 fellowship. The programme combines structured learning with mentorship and a capstone project. Fellows who complete the programme receive a certificate and are connected to hiring partners.",
    requirements: [
      "Basic programming knowledge",
      "Available for the full 12-week programme",
      "Strong analytical thinking",
    ],
    applyUrl: "https://datasciencenigeria.org",
  },
  {
    id: "opp006",
    title: "OAUSTECH Entrepreneurship Grant 2026",
    category: "Grants",
    organization: "OAUSTECH Innovation Hub",
    location: "OAUSTECH Campus",
    deadline: "2026-04-01",
    summary:
      "Grants of up to ₦500,000 for student-led ventures with a working prototype.",
    description:
      "The OAUSTECH Innovation Hub awards seed grants to student teams with early-stage ventures. Preference is given to solutions addressing local problems in agriculture, health, education or the environment.",
    requirements: [
      "Student-led venture with a prototype",
      "At least two registered OAUSTECH students in the team",
      "Feasibility plan",
    ],
    applyUrl: "#",
  },
  {
    id: "opp007",
    title: "Google Africa Developer Scholarship 2026",
    category: "Training",
    organization: "Google / Andela",
    location: "Remote",
    deadline: "2026-02-14",
    summary:
      "Free online learning path across Android, Web, and Cloud with a Google certification exam opportunity.",
    description:
      "The Google Africa Developer Scholarship provides free learning paths and mentoring for African developers. Top-performing learners receive a sponsored Google certification exam.",
    requirements: [
      "Available for a 6-month learning commitment",
      "Basic programming interest",
      "Access to a computer and internet",
    ],
    applyUrl: "https://gads.andela.com",
  },
  {
    id: "opp008",
    title: "NYSC Internship — Lagos-based Fintech",
    category: "Jobs",
    organization: "Flutterwave",
    location: "Lagos, Nigeria",
    deadline: "2026-03-30",
    summary:
      "Full-time NYSC placement for graduating students in engineering, finance, and product roles.",
    description:
      "Flutterwave offers paid NYSC placements across multiple teams. Successful applicants work on high-impact projects and receive structured mentorship.",
    requirements: [
      "Eligible for NYSC",
      "Strong communication skills",
      "Relevant academic background",
    ],
    applyUrl: "https://flutterwave.com/careers",
  },
];
