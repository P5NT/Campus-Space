/* ==========================================================================
   CAMPUS SPACE — calendar-admin.js
   Structured editor for the Academic Calendar.

   Admin flow:
     1. Open the editor (Add or Edit)
     2. Fill events under the "First Semester" section
     3. Fill events under the "Second Semester" section
     4. Save → merged into overrides, students see it instantly,
        and the printed PDF groups events by semester

   The editor treats each semester as its own list of events.
   The whole calendar (both semesters) is saved as ONE override record.

   Data shape (per semester override):
     {
       id,             // "2026/2027" (session acts as the record key)
       session,        // "2026/2027"
       events: [       // combined array of all events across semesters
         { id, isoDate, displayDate, title, desc, semester: "First"|"Second" }
       ]
     }

   Overrides are stored under:
     Store key: calendar_overrides
     Shape:     [ override, override, ... ]  // one per session

   Merge rule:
     - If an override exists for a session, it REPLACES the demo events
       for that session entirely (the admin's version wins).
     - Otherwise, the demo events for that session are used as-is.
   ========================================================================== */
"use strict";

const CalendarAdmin = (() => {
  /* ------------------------------------------------------------------
     Storage key + merge helpers
     ------------------------------------------------------------------ */
  const STORAGE_KEY = "calendar_overrides";

  function getAllOverrides() {
    return Store.get(STORAGE_KEY, []) || [];
  }

  function saveAllOverrides(list) {
    Store.set(STORAGE_KEY, list);
  }

  /* Return the merged event list for a session (demo + overrides).
     Each event carries a `semester` field: "First" | "Second". */
  function getMergedEvents(session) {
    session = session || "2026/2027";

    var demo =
      typeof DEMO_CALENDAR_EVENTS !== "undefined" ? DEMO_CALENDAR_EVENTS : [];

    /* Overrides for this session — replaces demo events */
    var overrides = getAllOverrides().find(function (o) {
      return o.session === session;
    });

    var source = overrides ? overrides.events : demo;

    /* Normalize: make sure every event has a semester field */
    return source
      .map(function (e) {
        return Object.assign({}, e, {
          semester: e.semester || inferSemester(e),
        });
      })
      .sort(function (a, b) {
        /* Sort by semester (First then Second), then by isoDate */
        if (a.semester !== b.semester) {
          return a.semester === "First" ? -1 : 1;
        }
        return new Date(a.isoDate) - new Date(b.isoDate);
      });
  }

  /* Infer semester from the isoDate for backward compatibility with
     the current seed events — those with isoDate before May 2026 are
     treated as First Semester, else Second Semester. */
  function inferSemester(e) {
    if (!e || !e.isoDate) return "First";
    var month = new Date(e.isoDate).getMonth(); // 0 = Jan
    return month <= 3 ? "First" : "Second";
  }

  /* Split merged events into per-semester groups */
  function getSplitEvents(session) {
    var all = getMergedEvents(session);
    return {
      first: all.filter(function (e) {
        return e.semester === "First";
      }),
      second: all.filter(function (e) {
        return e.semester === "Second";
      }),
    };
  }

  /* ------------------------------------------------------------------
     Persist — write the full override for a session
     ------------------------------------------------------------------ */
  function saveEventsForSession(session, events) {
    var overrides = getAllOverrides().filter(function (o) {
      return o.session !== session;
    });
    overrides.push({ session: session, events: events });
    saveAllOverrides(overrides);
  }

  /* Delete the override for a session entirely — reverts to demo seed */
  function resetSession(session) {
    var overrides = getAllOverrides().filter(function (o) {
      return o.session !== session;
    });
    saveAllOverrides(overrides);
  }

  /* ------------------------------------------------------------------
     DOM helpers
     ------------------------------------------------------------------ */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Format YYYY-MM-DD into a readable display string.
     Called whenever the admin changes the date input. */
  function formatDisplayDate(isoDate) {
    if (!isoDate) return "";
    var d = new Date(isoDate);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function makeId() {
    return "cal-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  }

  /* ------------------------------------------------------------------
     Modal builder
     ------------------------------------------------------------------ */
  function makeModal(id, title, bodyHtml, footHtml) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();

    var wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.id = id;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.innerHTML =
      '<div class="modal modal-lg">' +
      '<div class="modal-head">' +
      "<h3>" +
      title +
      "</h3>" +
      '<button class="btn-icon" data-modal-close aria-label="Close">' +
      '<i class="fa-solid fa-xmark"></i>' +
      "</button>" +
      "</div>" +
      '<div class="modal-body">' +
      bodyHtml +
      "</div>" +
      '<div class="modal-foot">' +
      footHtml +
      "</div>" +
      "</div>";
    document.body.appendChild(wrap);
    return wrap;
  }

  /* ------------------------------------------------------------------
     Editor — main entry point
     existingSession: optional. If provided, editor loads that session's
     current events (merged). If not provided, editor starts empty.
     ------------------------------------------------------------------ */
  function openEditor(session) {
    session = session || "2026/2027";

    var current = getSplitEvents(session);

    var bodyHtml =
      '<div class="cal-editor">' +
      /* Session field */
      '<div class="cal-section">' +
      '<div class="field">' +
      '<label class="label" for="cal-session">Academic session</label>' +
      '<input class="input" id="cal-session" value="' +
      esc(session) +
      '" placeholder="2026/2027">' +
      "</div>" +
      "</div>" +
      /* First Semester */
      '<div class="cal-section">' +
      '<div class="cal-section-head">' +
      '<span class="cal-section-dot" style="background: var(--brand-primary);"></span>' +
      '<h4 class="cal-section-title">First Semester</h4>' +
      "</div>" +
      '<div id="cal-first-rows" class="cal-rows"></div>' +
      '<button type="button" class="btn btn-secondary btn-block cal-add-btn" id="cal-add-first">' +
      '<i class="fa-solid fa-plus"></i> Add first semester event' +
      "</button>" +
      "</div>" +
      /* Second Semester */
      '<div class="cal-section">' +
      '<div class="cal-section-head">' +
      '<span class="cal-section-dot" style="background: var(--brand-secondary);"></span>' +
      '<h4 class="cal-section-title">Second Semester</h4>' +
      "</div>" +
      '<div id="cal-second-rows" class="cal-rows"></div>' +
      '<button type="button" class="btn btn-secondary btn-block cal-add-btn" id="cal-add-second">' +
      '<i class="fa-solid fa-plus"></i> Add second semester event' +
      "</button>" +
      "</div>" +
      "</div>";

    var footHtml =
      '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="cal-save">' +
      '<i class="fa-solid fa-check"></i> Publish calendar' +
      "</button>";

    var modal = makeModal(
      "calendar-editor-modal",
      "Edit Academic Calendar",
      bodyHtml,
      footHtml,
    );

    /* --- Row builders ------------------------------------------------ */
    var firstWrap = modal.querySelector("#cal-first-rows");
    var secondWrap = modal.querySelector("#cal-second-rows");

    function makeRow(semester, preset) {
      preset = preset || {};
      var row = document.createElement("div");
      row.className = "cal-row-editor";
      row.innerHTML =
        '<div class="cal-row-editor-head">' +
        '<span class="cal-row-editor-num">Event</span>' +
        '<button type="button" class="cal-row-editor-del" aria-label="Remove event">' +
        '<i class="fa-solid fa-trash"></i>' +
        "</button>" +
        "</div>" +
        '<div class="cal-row-editor-grid">' +
        '<div class="field">' +
        '<label class="label">Date</label>' +
        '<input class="input" type="date" data-role="date" value="' +
        esc(preset.isoDate || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Event title</label>' +
        '<input class="input" data-role="title" placeholder="e.g. Lectures Commence" value="' +
        esc(preset.title || "") +
        '">' +
        "</div>" +
        '<div class="field cal-row-editor-full">' +
        '<label class="label">Description <span class="label-hint">Optional</span></label>' +
        '<textarea class="textarea" data-role="desc" rows="2" placeholder="One-line description">' +
        esc(preset.desc || "") +
        "</textarea>" +
        "</div>" +
        "</div>";

      row
        .querySelector(".cal-row-editor-del")
        .addEventListener("click", function () {
          row.remove();
          renumber(semester === "First" ? firstWrap : secondWrap);
        });

      /* Auto-derive displayDate on date input change (nothing visual here,
         but ensures the field is touched so validation works) */
      var dateInput = row.querySelector('[data-role="date"]');
      dateInput.addEventListener("change", function () {
        /* Nothing to do — we compute displayDate on save */
      });

      /* Store the semester on the row so save logic can read it */
      row.dataset.semester = semester;
      /* Store the stable id if we're editing an existing event */
      if (preset.id) row.dataset.id = preset.id;

      return row;
    }

    function addRowTo(semester, preset) {
      var wrap = semester === "First" ? firstWrap : secondWrap;
      wrap.appendChild(makeRow(semester, preset));
      renumber(wrap);
    }

    function renumber(wrap) {
      wrap.querySelectorAll(".cal-row-editor").forEach(function (r, i) {
        var n = r.querySelector(".cal-row-editor-num");
        if (n) n.textContent = "Event " + (i + 1);
      });
    }

    /* Seed with current events (edit mode) or one blank row per section */
    if (current.first.length) {
      current.first.forEach(function (e) {
        addRowTo("First", e);
      });
    } else {
      addRowTo("First", {});
    }

    if (current.second.length) {
      current.second.forEach(function (e) {
        addRowTo("Second", e);
      });
    } else {
      addRowTo("Second", {});
    }

    /* Add-row buttons */
    modal
      .querySelector("#cal-add-first")
      .addEventListener("click", function () {
        addRowTo("First", {});
      });
    modal
      .querySelector("#cal-add-second")
      .addEventListener("click", function () {
        addRowTo("Second", {});
      });

    /* --- Save ------------------------------------------------------- */
    modal.querySelector("#cal-save").addEventListener("click", function () {
      var sessionVal =
        modal.querySelector("#cal-session").value.trim() || "2026/2027";

      var events = [];
      var hasError = false;

      /* Collect events from both sections */
      [firstWrap, secondWrap].forEach(function (wrap) {
        wrap.querySelectorAll(".cal-row-editor").forEach(function (r) {
          var semester = r.dataset.semester;
          var isoDate = r.querySelector('[data-role="date"]').value;
          var title = r.querySelector('[data-role="title"]').value.trim();
          var desc = r.querySelector('[data-role="desc"]').value.trim();

          /* Skip entirely blank rows */
          if (!isoDate && !title) return;

          if (!isoDate || !title) {
            hasError = true;
            r.style.borderColor = "var(--danger)";
            return;
          }
          r.style.borderColor = "";

          events.push({
            id: r.dataset.id || makeId(),
            isoDate: isoDate,
            displayDate: formatDisplayDate(isoDate),
            title: title,
            desc: desc,
            session: sessionVal,
            semester: semester,
          });
        });
      });

      if (hasError) {
        Toast.error(
          "Each event needs at least a date and a title.",
          "Incomplete entries",
        );
        return;
      }

      if (!events.length) {
        Toast.warning(
          "Add at least one event before publishing.",
          "Nothing to save",
        );
        return;
      }

      /* Sort within semesters by isoDate */
      events.sort(function (a, b) {
        if (a.semester !== b.semester) {
          return a.semester === "First" ? -1 : 1;
        }
        return new Date(a.isoDate) - new Date(b.isoDate);
      });

      saveEventsForSession(sessionVal, events);

      /* Queue a notification for students */
      queueNotification(
        "Academic Calendar Updated",
        "The 2026/2027 academic calendar has been updated. Tap to view the latest dates.",
      );

      Modal.close("calendar-editor-modal");
      Toast.success("Academic calendar published.", "Saved");

      if (typeof window.onCalendarSaved === "function") {
        window.onCalendarSaved();
      }
    });

    Modal.open("calendar-editor-modal");
  }

  /* ------------------------------------------------------------------
     Delete — remove a single event
     Because the whole calendar is one override per session, deleting
     an event means: load the current merged list, remove the target,
     save the remaining back as the override.
     ------------------------------------------------------------------ */
  function deleteEvent(session, eventId, callback) {
    var all = getMergedEvents(session);
    var filtered = all.filter(function (e) {
      return e.id !== eventId;
    });

    if (!filtered.length) {
      /* Deleting the last event — reset to demo (empty override would
         leave the calendar with no events at all) */
      resetSession(session);
    } else {
      saveEventsForSession(session, filtered);
    }

    if (typeof callback === "function") callback();
  }

  /* ------------------------------------------------------------------
     Notification helper — matches the shape used elsewhere
     ------------------------------------------------------------------ */
  function queueNotification(title, body) {
    var notifs = Store.get("notifications", []) || [];
    notifs.unshift({
      id: "n-" + Date.now(),
      type: "calendar_update",
      icon: "fa-calendar-days",
      tone: "brand",
      title: title,
      body: body,
      link: "academic-calendar.html",
      time: Date.now(),
      read: false,
    });
    Store.set("notifications", notifs);
  }

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */
  return {
    openEditor: openEditor,
    deleteEvent: deleteEvent,
    getMergedEvents: getMergedEvents,
    getSplitEvents: getSplitEvents,
    saveEventsForSession: saveEventsForSession,
    resetSession: resetSession,
  };
})();
