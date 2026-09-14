/* ==========================================================================
   CAMPUS SPACE — complaints.js
   Complaint store, list rendering and status flow.
   ========================================================================== */
"use strict";

const Complaints = (() => {
  const KEY = "complaints";

  const SEED = [
    {
      id: "C001",
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
          at: Date.now() - 4 * 86400000,
          text: "Thank you for reporting this. We have escalated it to the Facilities Department and will update you once we hear back.",
        },
      ],
    },
    {
      id: "C002",
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
          at: Date.now() - 5 * 86400000,
          text: "The results have now been published. Thank you for your patience.",
        },
      ],
    },
    {
      id: "C003",
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

  function add(data) {
    const list = all();
    const c = {
      id:
        "C" +
        String(list.length + 1).padStart(3, "0") +
        "-" +
        Date.now().toString().slice(-4),
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

  function respond(id, text, name) {
    const list = all();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    c.responses.push({ from: "admin", name, at: Date.now(), text });
    c.updated = Date.now();
    save(list);
  }

  return { all, add, updateStatus, respond, save };
})();

/* -------------------------------------------------------------------------
   Status label helpers
   ------------------------------------------------------------------------- */
const COMPLAINT_STATUS_CLASS = {
  Submitted: "status-submitted",
  "Under Review": "status-review",
  "In Progress": "status-progress",
  Resolved: "status-resolved",
};

function complaintStatusPill(status) {
  const cls = COMPLAINT_STATUS_CLASS[status] || "status-submitted";
  return `<span class="status-pill ${cls}">${Util.escape(status)}</span>`;
}
