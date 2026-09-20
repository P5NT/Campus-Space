/* ==========================================================================
   CAMPUS SPACE — leaders.js
   Student leaders rendering + data layer.

   Merges DEMO_LEADERS with admin overrides from localStorage:
     - added   → new leader assignments
     - edits   → changes to existing leaders (association, position, active)
     - deleted → removed leaders

   Public API (kept backward-compatible with existing callers):
     getLeaderList()                    → active leaders with {student, assoc, pos}
     getAllLeaders(options)             → all leaders (active + inactive)
     getLeaderById(studentId, opts)     → single leader lookup
     getLeaderMap()                     → { studentId: leaderRecord } for fast lookups
     renderLeaderCard(leader)           → DOM element for a leader card
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   LOAD — merge demo seed with admin overrides
   Returns an array of leader records shaped:
     { studentId, associationId, positionId, active, assignedAt, assignedBy }
   ------------------------------------------------------------------------- */
function loadMergedLeaders() {
  /* Start from the seed data — normalise each record so active is boolean */
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

  /* Read overrides — safe if Store isn't loaded (defensive) */
  var saved = null;
  try {
    if (typeof Store !== "undefined" && Store.get) {
      saved = Store.get("leaders_overrides", null);
    }
  } catch (e) {
    saved = null;
  }
  if (!saved) return base;

  /* Apply additions */
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

  /* Apply edits (association, position, active state) */
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

  /* Apply deletions last */
  if (Array.isArray(saved.deleted)) {
    base = base.filter(function (l) {
      return saved.deleted.indexOf(l.studentId) === -1;
    });
  }

  return base;
}

/* -------------------------------------------------------------------------
   Get all leaders (raw records), with optional filters
   options = { active: true|false|undefined }  — undefined returns all
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
   Returns null if any referenced record is missing.
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
   Public — getLeaderList()
   Backward-compatible. Returns ACTIVE leaders only, enriched.
   This is what student-facing pages should use.
   ------------------------------------------------------------------------- */
function getLeaderList() {
  return getAllLeaderRecords({ active: true })
    .map(enrichLeader)
    .filter(Boolean);
}

/* -------------------------------------------------------------------------
   Public — getAllLeaders(options)
   Admin-facing. Can include inactive.
   Returns enriched leaders sorted by student name.
   ------------------------------------------------------------------------- */
function getAllLeaders(options) {
  var records = getAllLeaderRecords(options);
  var enriched = records.map(enrichLeader).filter(Boolean);

  /* Stable sort: by first name then last name */
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
   Public — getLeaderById(studentId, opts)
   opts = { includeInactive: true }  → returns even if deactivated
   Returns enriched leader or null.
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
   Public — getLeaderMap()
   { studentId: { student, assoc, pos, active } } for fast lookups.
   Used by community post rendering to tag leaders in comments.
   Includes ONLY active leaders (that's the point — inactive leaders
   lose their public tag).
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
   Public — renderLeaderCard(leader)
   Same markup and behavior as before. Also works with enriched objects
   that include an `active` field (shows an "Inactive" badge when false).
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
      ? '<div class="leader-inactive-badge">' +
        '<i class="fa-solid fa-circle-pause"></i> Inactive' +
        "</div>"
      : "") +
    '<button class="btn btn-secondary btn-sm">' +
    '<i class="fa-solid fa-arrow-right"></i> View profile' +
    "</button>";

  return card;
}

/* -------------------------------------------------------------------------
   Backward-compatibility exports
   Some pages reference DEMO_LEADERS directly. To keep them working, we
   expose a "live" DEMO_LEADERS via a getter-like approach. Since we can't
   mutate the const, we instead expose a helper that mirrors its shape.
   Pages that read DEMO_LEADERS directly will still see stale data — if you
   find such a page, replace `DEMO_LEADERS` with `getAllLeaderRecords()`.
   ------------------------------------------------------------------------- */
