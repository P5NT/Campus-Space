/* ==========================================================================
   CAMPUS SPACE — admin.js
   Admin workspace: registrations, faculties, departments, resources,
   associations, positions, leaders, complaints, moderation, content,
   opportunities, calendar, emergency contacts.
   ========================================================================== */
"use strict";

const Admin = {
  /* ---------------------------------------------------------------
     Registered Students
     --------------------------------------------------------------- */
  students() {
    return DEMO_STUDENTS;
  },
  studentById(id) {
    return DEMO_STUDENTS.find((s) => s.id === id);
  },
  searchStudents(q) {
    if (!q) return DEMO_STUDENTS;
    const s = q.toLowerCase();
    return DEMO_STUDENTS.filter(
      (x) =>
        x.firstName.toLowerCase().includes(s) ||
        x.lastName.toLowerCase().includes(s) ||
        (x.otherName || "").toLowerCase().includes(s) ||
        x.username.toLowerCase().includes(s) ||
        x.matric.toLowerCase().includes(s) ||
        x.faculty.toLowerCase().includes(s) ||
        x.department.toLowerCase().includes(s),
    );
  },

  /* ---------------------------------------------------------------
     Faculties & Departments
     --------------------------------------------------------------- */
  faculties() {
    return DEMO_FACULTIES;
  },

  /* ---------------------------------------------------------------
     Academic Resources
     --------------------------------------------------------------- */
  resources() {
    return DEMO_RESOURCES;
  },

  /* ---------------------------------------------------------------
     Associations & Positions
     --------------------------------------------------------------- */
  associations() {
    return DEMO_ASSOCIATIONS;
  },
  positions() {
    return DEMO_POSITIONS;
  },

  /* ---------------------------------------------------------------
     Leaders
     --------------------------------------------------------------- */
  leaders() {
    return getLeaderList();
  },

  /* ---------------------------------------------------------------
     Complaints
     --------------------------------------------------------------- */
  complaints() {
    return Complaints.all();
  },

  /* ---------------------------------------------------------------
     Emergency Contacts
     --------------------------------------------------------------- */
  emergencyContacts() {
    return DEMO_EMERGENCY_CONTACTS.map((c) => {
      const student = DEMO_STUDENTS.find((s) => s.id === c.studentId);
      const cat = EMERGENCY_CATEGORIES.find((x) => x.id === c.categoryId);
      return { ...c, student, category: cat };
    }).filter((c) => c.student);
  },
};

/* -------------------------------------------------------------------------
   Renders a table row that behaves like a card on mobile
   ------------------------------------------------------------------------- */
function renderAdminRow(cells, actions, opts = {}) {
  const tr = document.createElement("tr");
  tr.innerHTML = cells
    .map(
      (cell, i) =>
        `<td data-label="${opts.labels ? opts.labels[i] : ""}">${cell}</td>`,
    )
    .join("");

  if (actions) {
    const td = document.createElement("td");
    td.setAttribute("data-label", "Actions");
    td.className = "table-actions";
    td.innerHTML = actions;
    tr.appendChild(td);
  }
  return tr;
}
