/* ==========================================================================
   CAMPUS SPACE — complaints.js
   Complaints: submission, visibility (private/public), status flow,
   responses, history.

   Visibility rules:
     - "private"  → only the filer and admins see it
     - "public"   → everyone sees it, but only as @username (not full name)
     - Locked at submission — cannot be changed later (per spec)

   All responses inherit their parent's visibility.

   Data shape (per complaint):
     {
       id, visibility, submittedBy, submittedByName,
       category, subject, description, attachment,
       status, priority, date, updated,
       history:   [{ at, actor, action }],
       responses: [{ from, name, tag, at, text }]
     }
   ========================================================================== */
"use strict";

const Complaints = (() => {
  const KEY = "complaints";

  /* ------------------------------------------------------------------
     SEED — demo complaints. All private by default.
     ------------------------------------------------------------------ */
  const SEED = [
    {
      id: "C001",
      visibility: "private",
      submittedBy: "akinola",
      submittedByName: "Akinola Adeyemi",
      category: "Facilities",
      subject: "Broken reading lamp in Library Group Room B",
      description:
        "One of the reading lamps in Group Room B has not been working for two weeks. It makes the room difficult to use in the evenings.",
      status: "In Progress",
      priority: "Normal",
      date: Date.now() - 6 * 86400000,
      updated: Date.now() - 2 * 86400000,
      history: [
        {
          at: Date.now() - 6 * 86400000,
          actor: "You",
          action: "Complaint submitted",
        },
        {
          at: Date.now() - 4 * 86400000,
          actor: "Folake Akinyemi (Admin)",
          action: "Status changed to Under Review",
        },
        {
          at: Date.now() - 2 * 86400000,
          actor: "Facilities Department",
          action: "Assigned to maintenance team",
        },
      ],
      responses: [
        {
          from: "admin",
          name: "Folake Akinyemi",
          tag: "",
          at: Date.now() - 4 * 86400000,
          text: "Thank you for reporting this. We have escalated it to the Facilities Department and will update you once we hear back.",
        },
      ],
    },
    {
      id: "C002",
      visibility: "private",
      submittedBy: "akinola",
      submittedByName: "Akinola Adeyemi",
      category: "Academic",
      subject: "Delay in publishing CSC 403 results",
      description:
        "CSC 403 results have not been published more than 8 weeks after the exam. Could we get an update?",
      status: "Resolved",
      priority: "Normal",
      date: Date.now() - 14 * 86400000,
      updated: Date.now() - 5 * 86400000,
      history: [
        {
          at: Date.now() - 14 * 86400000,
          actor: "You",
          action: "Complaint submitted",
        },
        {
          at: Date.now() - 12 * 86400000,
          actor: "Folake Akinyemi (Admin)",
          action: "Status changed to Under Review",
        },
        {
          at: Date.now() - 5 * 86400000,
          actor: "Examinations Office",
          action: "Results published, complaint resolved",
        },
      ],
      responses: [
        {
          from: "admin",
          name: "Folake Akinyemi",
          tag: "",
          at: Date.now() - 5 * 86400000,
          text: "The results have now been published. Thank you for your patience.",
        },
      ],
    },
    {
      id: "C003",
      visibility: "public",
      submittedBy: "ibrahim",
      submittedByName: "Ibrahim Suleiman",
      category: "Welfare",
      subject: "Water supply in Female Hostel B",
      description:
        "Water supply to the upper floor of Female Hostel B has been intermittent this week.",
      status: "Submitted",
      priority: "High",
      date: Date.now() - 86400000,
      updated: Date.now() - 86400000,
      history: [
        {
          at: Date.now() - 86400000,
          actor: "You",
          action: "Complaint submitted",
        },
      ],
      responses: [],
    },
  ];

  /* ------------------------------------------------------------------
     READ / WRITE
     ------------------------------------------------------------------ */
  function all() {
    let list = Store.get(KEY, null);
    if (!list) {
      list = SEED.slice();
      Store.set(KEY, list);
    }
    return list;
  }

  function save(list) {
    Store.set(KEY, list);
  }

  /* ------------------------------------------------------------------
     VISIBILITY — returns the complaints the given session can see
     ------------------------------------------------------------------
       Public complaints     → visible to everyone
       Private complaints    → visible only to the filer + admins
     ------------------------------------------------------------------ */
  function visibleTo(session) {
    if (!session) return [];
    const isAdmin = session.role === "admin" || session.role === "super_admin";
    return all().filter((c) => {
      if (isAdmin) return true; /* admins see everything */
      if (c.visibility === "public") return true; /* public → everyone */
      return c.submittedBy === session.username; /* private → filer only */
    });
  }

  /* ------------------------------------------------------------------
     CREATE
     ------------------------------------------------------------------
       visibility is REQUIRED — the form enforces this.
     ------------------------------------------------------------------ */
  function add(data) {
    if (
      !data.visibility ||
      (data.visibility !== "public" && data.visibility !== "private")
    ) {
      throw new Error("Complaint visibility is required");
    }

    const list = all();
    const c = {
      id:
        "C" +
        String(list.length + 1).padStart(3, "0") +
        "-" +
        Date.now().toString().slice(-4),
      visibility: data.visibility,
      submittedBy: data.submittedBy || "unknown",
      submittedByName: data.submittedByName || "Unknown student",
      category: data.category,
      subject: data.subject,
      description: data.description,
      attachment: data.attachment || "",
      status: "Submitted",
      priority: "Normal",
      date: Date.now(),
      updated: Date.now(),
      history: [
        { at: Date.now(), actor: "You", action: "Complaint submitted" },
      ],
      responses: [],
    };
    list.unshift(c);
    save(list);
    return c;
  }

  /* ------------------------------------------------------------------
     UPDATE STATUS
     ------------------------------------------------------------------ */
  function updateStatus(id, status, actor) {
    const list = all();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    c.status = status;
    c.updated = Date.now();
    c.history.push({
      at: Date.now(),
      actor,
      action: "Status changed to " + status,
    });
    save(list);
  }

  /* ------------------------------------------------------------------
     RESPOND — accepts either a plain string (legacy) or an object
     { name, tag }
     ------------------------------------------------------------------ */
  function respond(id, text, author) {
    const list = all();
    const c = list.find((x) => x.id === id);
    if (!c) return;

    let name = "";
    let tag = "";
    if (typeof author === "string") {
      name = author;
    } else if (author && typeof author === "object") {
      name = author.name || "";
      tag = author.tag || "";
    }

    c.responses.push({ from: "admin", name, tag, at: Date.now(), text });
    c.updated = Date.now();
    save(list);
  }

  /* ------------------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------------------ */
  return {
    all,
    visibleTo,
    add,
    updateStatus,
    respond,
    save,
  };
})();

/* -------------------------------------------------------------------------
   Helpers — kept for backward compatibility with existing pages
   ------------------------------------------------------------------------- */
const COMPLAINT_STATUS_CLASS = {
  Submitted: "status-submitted",
  "Under Review": "status-review",
  "In Progress": "status-progress",
  Resolved: "status-resolved",
};

function complaintStatusPill(status) {
  const cls = COMPLAINT_STATUS_CLASS[status] || "status-submitted";
  return `<span class="status-pill ${cls}">${typeof Util !== "undefined" ? Util.escape(status) : status}</span>`;
}
