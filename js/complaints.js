/* ==========================================================================
   CAMPUS SPACE — complaints.js
   Complaints: submission, visibility (private/public), status flow,
   responses, history.

   Notifications emitted:
     - add()          -> Admins + Super Admins get "New complaint submitted"
     - updateStatus() -> the filer gets "Complaint status changed"
     - respond()      -> the filer gets "New response to your complaint"

   Link convention:
     - Admin recipients   -> resolveAdminLink("complaints.html")
     - Student recipients -> "complaint-details.html?id=..."
   ========================================================================== */
"use strict";

var Complaints = (function () {
  var KEY = "complaints";

  /* ------------------------------------------------------------------
     Notifications helper
     Safe to call even if notifications.js is not loaded on the page.
     ------------------------------------------------------------------ */
  function emitNotification(payload) {
    try {
      if (
        typeof Notifications !== "undefined" &&
        typeof Notifications.emit === "function"
      ) {
        return Notifications.emit(payload);
      }
    } catch (e) {
      /* swallow */
    }
    return null;
  }

  /* ------------------------------------------------------------------
     Admin link resolver
     Returns the correct relative path to a page under /pages/admin/
     from whatever folder the current page lives in.
     ------------------------------------------------------------------ */
  function resolveAdminLink(filename) {
    var path =
      typeof window !== "undefined" && window.location
        ? window.location.pathname
        : "";

    if (path.indexOf("/pages/admin/") !== -1) {
      return filename;
    }

    if (
      path.indexOf("/pages/student/") !== -1 ||
      path.indexOf("/pages/super-admin/") !== -1 ||
      path.indexOf("/pages/system/") !== -1 ||
      path.indexOf("/pages/auth/") !== -1
    ) {
      return "../admin/" + filename;
    }

    if (path.indexOf("/pages/") === -1) {
      return "pages/admin/" + filename;
    }

    return filename;
  }

  /* ------------------------------------------------------------------
     SEED DATA
     ------------------------------------------------------------------ */
  var SEED = [
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
    var list = Store.get(KEY, null);
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
     VISIBILITY
     ------------------------------------------------------------------ */
  function visibleTo(session) {
    if (!session) {
      return [];
    }
    var isAdmin = session.role === "admin" || session.role === "super_admin";
    return all().filter(function (c) {
      if (isAdmin) {
        return true;
      }
      if (c.visibility === "public") {
        return true;
      }
      return c.submittedBy === session.username;
    });
  }

  /* ------------------------------------------------------------------
     CREATE
     ------------------------------------------------------------------ */
  function add(data) {
    if (
      !data.visibility ||
      (data.visibility !== "public" && data.visibility !== "private")
    ) {
      throw new Error("Complaint visibility is required");
    }

    var list = all();
    var seq = list.length + 1;
    var padded = seq < 10 ? "00" + seq : seq < 100 ? "0" + seq : "" + seq;
    var tail = String(Date.now()).slice(-4);

    var c = {
      id: "C" + padded + "-" + tail,
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
        {
          at: Date.now(),
          actor: "You",
          action: "Complaint submitted",
        },
      ],
      responses: [],
    };
    list.unshift(c);
    save(list);

    var bodyText =
      "A new " + c.category + " complaint was submitted: " + c.subject;

    emitNotification({
      type: "complaint_submitted",
      icon: "fa-file-shield",
      tone: "warning",
      title: "New complaint submitted",
      body: bodyText,
      link: resolveAdminLink("complaints.html"),
      audience: { usernames: [], roles: ["admins", "super_admins"] },
      actorUsername: c.submittedBy,
    });

    return c;
  }

  /* ------------------------------------------------------------------
     UPDATE STATUS
     ------------------------------------------------------------------ */
  function updateStatus(id, status, actor) {
    var list = all();
    var c = null;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        c = list[i];
        break;
      }
    }
    if (!c) {
      return;
    }

    c.status = status;
    c.updated = Date.now();
    c.history.push({
      at: Date.now(),
      actor: actor,
      action: "Status changed to " + status,
    });
    save(list);

    var bodyText = 'Your complaint "' + c.subject + '" is now ' + status + ".";

    emitNotification({
      type: "complaint_status",
      icon: "fa-file-shield",
      tone: status === "Resolved" ? "success" : "warning",
      title: "Complaint status changed",
      body: bodyText,
      link: "complaint-details.html?id=" + c.id,
      audience: { usernames: [c.submittedBy], roles: [] },
      actorUsername: null,
    });
  }

  /* ------------------------------------------------------------------
     RESPOND
     ------------------------------------------------------------------ */
  function respond(id, text, author) {
    var list = all();
    var c = null;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        c = list[i];
        break;
      }
    }
    if (!c) {
      return;
    }

    var name = "";
    var tag = "";
    if (typeof author === "string") {
      name = author;
    } else if (author && typeof author === "object") {
      name = author.name || "";
      tag = author.tag || "";
    }

    c.responses.push({
      from: "admin",
      name: name,
      tag: tag,
      at: Date.now(),
      text: text,
    });
    c.updated = Date.now();
    save(list);

    var preview = text.length > 90 ? text.slice(0, 87) + "..." : text;
    var bodyText = (name || "Admin") + ": " + preview;

    emitNotification({
      type: "complaint_response",
      icon: "fa-comment-dots",
      tone: "brand",
      title: "New response to your complaint",
      body: bodyText,
      link: "complaint-details.html?id=" + c.id,
      audience: { usernames: [c.submittedBy], roles: [] },
      actorUsername: null,
    });
  }

  /* ------------------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------------------ */
  return {
    all: all,
    visibleTo: visibleTo,
    add: add,
    updateStatus: updateStatus,
    respond: respond,
    save: save,
  };
})();

/* -------------------------------------------------------------------------
   Backward-compatible helpers
   ------------------------------------------------------------------------- */
var COMPLAINT_STATUS_CLASS = {
  Submitted: "status-submitted",
  "Under Review": "status-review",
  "In Progress": "status-progress",
  Resolved: "status-resolved",
};

function complaintStatusPill(status) {
  var cls = COMPLAINT_STATUS_CLASS[status] || "status-submitted";
  var text = typeof Util !== "undefined" ? Util.escape(status) : String(status);
  return '<span class="status-pill ' + cls + '">' + text + "</span>";
}
