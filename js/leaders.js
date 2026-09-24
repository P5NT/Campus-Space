/* ==========================================================================
   CAMPUS SPACE — leaders.js
   Student leaders rendering + data layer + admin assignment helpers.

   Merges DEMO_LEADERS with admin overrides from localStorage:
     - added   → new leader assignments
     - edits   → changes to existing leaders (association, position, active)
     - deleted → removed leaders
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   LOAD — merge demo seed with admin overrides
   ------------------------------------------------------------------------- */
function loadMergedLeaders() {
  var base = (typeof DEMO_LEADERS !== "undefined" ? DEMO_LEADERS : []).map(
    function (l) {
      return {
        studentId: l.studentId,
        associationId: l.associationId,
        positionId: l.positionId,
        active: l.active !== false,
        assignedAt: l.assignedAt || "2026-01-01",
        assignedBy: l.assignedBy || "Admin",
      };
    },
  );

  var saved = null;
  try {
    if (typeof Store !== "undefined" && Store.get) {
      saved = Store.get("leaders_overrides", null);
    }
  } catch (e) {
    saved = null;
  }
  if (!saved) return base;

  if (Array.isArray(saved.added)) {
    saved.added.forEach(function (l) {
      var idx = base.findIndex(function (x) {
        return x.studentId === l.studentId;
      });
      var normalised = {
        studentId: l.studentId,
        associationId: l.associationId,
        positionId: l.positionId,
        active: l.active !== false,
        assignedAt: l.assignedAt || new Date().toISOString().slice(0, 10),
        assignedBy: l.assignedBy || "Admin",
      };
      if (idx >= 0) base[idx] = normalised;
      else base.push(normalised);
    });
  }

  if (saved.edits) {
    base.forEach(function (l) {
      var edit = saved.edits[l.studentId];
      if (!edit) return;
      if (edit.associationId !== undefined)
        l.associationId = edit.associationId;
      if (edit.positionId !== undefined) l.positionId = edit.positionId;
      if (edit.active !== undefined) l.active = edit.active;
    });
  }

  if (Array.isArray(saved.deleted)) {
    base = base.filter(function (l) {
      return saved.deleted.indexOf(l.studentId) === -1;
    });
  }

  return base;
}

/* -------------------------------------------------------------------------
   Get all leader records with optional active-only filter
   ------------------------------------------------------------------------- */
function getAllLeaderRecords(options) {
  var all = loadMergedLeaders();
  if (!options || options.active === undefined) return all;
  return all.filter(function (l) {
    return options.active ? l.active === true : l.active === false;
  });
}

/* -------------------------------------------------------------------------
   Enrich a raw leader record into { student, assoc, pos, active }
   ------------------------------------------------------------------------- */
function enrichLeader(record) {
  if (!record) return null;
  var student = (
    typeof DEMO_STUDENTS !== "undefined" ? DEMO_STUDENTS : []
  ).find(function (s) {
    return s.id === record.studentId;
  });
  var assoc = (
    typeof DEMO_ASSOCIATIONS !== "undefined" ? DEMO_ASSOCIATIONS : []
  ).find(function (a) {
    return a.id === record.associationId;
  });
  var pos = (typeof DEMO_POSITIONS !== "undefined" ? DEMO_POSITIONS : []).find(
    function (p) {
      return p.id === record.positionId;
    },
  );
  if (!student || !assoc || !pos) return null;
  return {
    student: student,
    assoc: assoc,
    pos: pos,
    active: record.active !== false,
    assignedAt: record.assignedAt,
    assignedBy: record.assignedBy,
  };
}

/* -------------------------------------------------------------------------
   PUBLIC — getLeaderList() [backward-compatible with existing callers]
   ------------------------------------------------------------------------- */
function getLeaderList() {
  return getAllLeaderRecords({ active: true })
    .map(enrichLeader)
    .filter(Boolean);
}

/* -------------------------------------------------------------------------
   PUBLIC — getAllLeaders(options)
   ------------------------------------------------------------------------- */
function getAllLeaders(options) {
  var records = getAllLeaderRecords(options);
  var enriched = records.map(enrichLeader).filter(Boolean);
  enriched.sort(function (a, b) {
    var an = (a.student.firstName || "").toLowerCase();
    var bn = (b.student.firstName || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    var al = (a.student.lastName || "").toLowerCase();
    var bl = (b.student.lastName || "").toLowerCase();
    return al.localeCompare(bl);
  });
  return enriched;
}

/* -------------------------------------------------------------------------
   PUBLIC — getLeaderById(studentId, opts)
   ------------------------------------------------------------------------- */
function getLeaderById(studentId, opts) {
  if (!studentId) return null;
  var includeInactive = opts && opts.includeInactive === true;
  var record = loadMergedLeaders().find(function (l) {
    return l.studentId === studentId;
  });
  if (!record) return null;
  if (!includeInactive && record.active === false) return null;
  return enrichLeader(record);
}

/* -------------------------------------------------------------------------
   PUBLIC — getLeaderMap()
   ------------------------------------------------------------------------- */
function getLeaderMap() {
  var map = {};
  getAllLeaderRecords({ active: true }).forEach(function (record) {
    var enriched = enrichLeader(record);
    if (enriched) map[record.studentId] = enriched;
  });
  return map;
}

/* -------------------------------------------------------------------------
   PUBLIC — renderLeaderCard(leader)
   ------------------------------------------------------------------------- */
function renderLeaderCard(l) {
  var student = l.student;
  var assoc = l.assoc;
  var pos = l.pos;
  var isActive = l.active !== false;

  var card = document.createElement("a");
  card.href = "leader-profile.html?id=" + student.id;
  card.className = "leader-card";
  if (!isActive) card.classList.add("is-inactive");

  var fullName = student.firstName + " " + student.lastName;
  var initials = Util.initials(fullName);

  card.innerHTML =
    (student.avatar
      ? '<img src="' +
        student.avatar +
        '" alt="" class="avatar avatar-72" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'avatar avatar-72 avatar-fallback\',textContent:\'' +
        initials +
        "'}))\">"
      : '<span class="avatar avatar-72 avatar-fallback">' +
        initials +
        "</span>") +
    "<h3>" +
    Util.escape(fullName) +
    ' <i class="fa-solid fa-circle-check tag-verified"></i>' +
    "</h3>" +
    '<div class="handle">@' +
    Util.escape(student.username) +
    "</div>" +
    '<div class="position">' +
    Util.escape(pos.name) +
    "</div>" +
    '<div class="assoc">' +
    Util.escape(assoc.name) +
    " · " +
    Util.escape(assoc.acronym) +
    "</div>" +
    (!isActive
      ? '<div class="leader-inactive-badge"><i class="fa-solid fa-circle-pause"></i> Inactive</div>'
      : "") +
    '<button class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-right"></i> View profile</button>';

  return card;
}

/* ==========================================================================
   ADMIN HELPERS — assign / remove leaders
   Called from pages/admin/student-details.html and student-leaders.html
   ========================================================================== */
const Leaders = (() => {
  const KEY = "leaders_overrides";

  function loadOverrides() {
    return Store.get(KEY, {}) || {};
  }

  function saveOverrides(o) {
    Store.set(KEY, o);
  }

  /* Assign (or re-assign) a leader to a student.
     Writes to the "added" list and removes any pending "deleted" entry
     for that student. */
  function assign(studentId, associationId, positionId, assignedBy) {
    if (!studentId || !associationId || !positionId) return false;
    var o = loadOverrides();
    o.added = o.added || [];
    o.deleted = (o.deleted || []).filter(function (id) {
      return id !== studentId;
    });
    o.edits = o.edits || {};

    var existingIdx = o.added.findIndex(function (l) {
      return l.studentId === studentId;
    });
    var record = {
      studentId: studentId,
      associationId: associationId,
      positionId: positionId,
      active: true,
      assignedAt: new Date().toISOString().slice(0, 10),
      assignedBy: assignedBy || "Admin",
    };

    if (existingIdx >= 0) o.added[existingIdx] = record;
    else o.added.push(record);

    /* Drop any conflicting edit for the same student */
    delete o.edits[studentId];

    saveOverrides(o);
    return true;
  }

  /* Remove a leader entirely (soft removal — added to "deleted" list). */
  function remove(studentId) {
    if (!studentId) return false;
    var o = loadOverrides();
    o.deleted = o.deleted || [];
    if (o.deleted.indexOf(studentId) === -1) o.deleted.push(studentId);
    if (Array.isArray(o.added)) {
      o.added = o.added.filter(function (l) {
        return l.studentId !== studentId;
      });
    }
    if (o.edits && o.edits[studentId]) {
      delete o.edits[studentId];
    }
    saveOverrides(o);
    return true;
  }

  return { assign: assign, remove: remove };
})();
