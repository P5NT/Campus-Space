/* ==========================================================================
   CAMPUS SPACE — timetable-admin.js
   Structured editor for Lecture and Exam timetables.

   Admin flow:
     1. Pick target audience (Faculty → Department → Level)
     2. Pick session + semester
     3. Add schedule entries (one row per course occurrence)
     4. Save → merged into overrides, students see it instantly

   Dropdowns use the site-wide custom select component (initCustomSelects
   in main.js). Because the editor modals are injected into the DOM
   dynamically, we rebuild the custom selects every time we inject options.
   ========================================================================== */
"use strict";

const TimetableAdmin = (() => {
  /* ------------------------------------------------------------------
     Storage keys
     ------------------------------------------------------------------ */
  const LECTURE_KEY = "lecture_timetables_overrides";
  const EXAM_KEY = "exam_timetables_overrides";

  /* Color rotation for lecture blocks (matches existing seed palette) */
  const COLORS = ["brand", "marine", "success", "warning"];
  let colorCursor = 0;
  function nextColor() {
    const c = COLORS[colorCursor % COLORS.length];
    colorCursor++;
    return c;
  }

  /* ------------------------------------------------------------------
     CUSTOM SELECT REBUILD
     Because our modals are created dynamically, initCustomSelects() in
     main.js does not see the newly injected <select> elements. This
     helper tears down any existing custom wrapper on a specific native
     <select> and re-runs initCustomSelects so the styled component is
     applied with the fresh options.
     ------------------------------------------------------------------ */
  function buildCustomSelect(nativeSelect) {
    if (!nativeSelect || typeof initCustomSelects !== "function") return;

    /* 1. Remove any adjacent cselect wrapper */
    var next = nativeSelect.nextElementSibling;
    while (next && next.classList && next.classList.contains("cselect")) {
      next.remove();
      next = nativeSelect.nextElementSibling;
    }
    var prev = nativeSelect.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains("cselect")) {
      prev.remove();
    }

    /* 2. Reset flags so initCustomSelects will process it again */
    nativeSelect.classList.remove("cselect-native");
    nativeSelect.removeAttribute("data-customized");

    /* 3. Rebuild — initCustomSelects handles only uncustomized selects */
    initCustomSelects();

    /* 4. Make sure the trigger text matches the current value */
    var wrapper = nativeSelect.nextElementSibling;
    if (wrapper && wrapper.classList.contains("cselect")) {
      var triggerText = wrapper.querySelector(".cselect-text");
      if (triggerText) {
        var opt = nativeSelect.options[nativeSelect.selectedIndex];
        triggerText.textContent = opt ? opt.textContent : "";
      }
    }
  }

  /* Rebuild every custom select inside a container */
  function buildAllCustomSelectsIn(container) {
    if (!container) return;
    container.querySelectorAll("select.select").forEach(function (sel) {
      buildCustomSelect(sel);
    });
  }

  /* ------------------------------------------------------------------
     Merge helpers — used by data/courses.js to overlay overrides
     ------------------------------------------------------------------ */
  function getMergedLectureTimetables() {
    const base = Array.isArray(
      typeof DEMO_LECTURE_TIMETABLES !== "undefined"
        ? DEMO_LECTURE_TIMETABLES
        : null,
    )
      ? (typeof DEMO_LECTURE_TIMETABLES !== "undefined"
          ? DEMO_LECTURE_TIMETABLES
          : null
        ).slice()
      : [];
    const overrides = Store.get(LECTURE_KEY, []) || [];
    const overriddenKeys = new Set(
      overrides.map((o) => key(o.faculty, o.department, o.level)),
    );
    const keptBase = base.filter(
      (b) => !overriddenKeys.has(key(b.faculty, b.department, b.level)),
    );
    return keptBase.concat(overrides);
  }

  function getMergedExamTimetables() {
    const base = Array.isArray(
      typeof DEMO_EXAM_TIMETABLES !== "undefined" ? DEMO_EXAM_TIMETABLES : null,
    )
      ? (typeof DEMO_EXAM_TIMETABLES !== "undefined"
          ? DEMO_EXAM_TIMETABLES
          : null
        ).slice()
      : [];
    const overrides = Store.get(EXAM_KEY, []) || [];
    const overriddenKeys = new Set(
      overrides.map((o) => key(o.faculty, o.department, o.level)),
    );
    const keptBase = base.filter(
      (b) => !overriddenKeys.has(key(b.faculty, b.department, b.level)),
    );
    return keptBase.concat(overrides);
  }

  function key(faculty, department, level) {
    return faculty + "||" + department + "||" + level;
  }

  /* ------------------------------------------------------------------
     Save / delete
     ------------------------------------------------------------------ */
  function saveLecture(record) {
    const all = (Store.get(LECTURE_KEY, []) || []).filter(
      (o) =>
        key(o.faculty, o.department, o.level) !==
        key(record.faculty, record.department, record.level),
    );
    all.push(record);
    Store.set(LECTURE_KEY, all);
  }

  function saveExam(record) {
    const all = (Store.get(EXAM_KEY, []) || []).filter(
      (o) =>
        key(o.faculty, o.department, o.level) !==
        key(record.faculty, record.department, record.level),
    );
    all.push(record);
    Store.set(EXAM_KEY, all);
  }

  function deleteLecture(faculty, department, level) {
    const all = (Store.get(LECTURE_KEY, []) || []).filter(
      (o) =>
        key(o.faculty, o.department, o.level) !==
        key(faculty, department, level),
    );
    Store.set(LECTURE_KEY, all);
  }

  function deleteExam(faculty, department, level) {
    const all = (Store.get(EXAM_KEY, []) || []).filter(
      (o) =>
        key(o.faculty, o.department, o.level) !==
        key(faculty, department, level),
    );
    Store.set(EXAM_KEY, all);
  }

  function findOverride(kind, faculty, department, level) {
    const storeKey = kind === "lecture" ? LECTURE_KEY : EXAM_KEY;
    const all = Store.get(storeKey, []) || [];
    return (
      all.find(
        (o) =>
          o.faculty === faculty &&
          o.department === department &&
          o.level === level,
      ) || null
    );
  }

  /* ------------------------------------------------------------------
     DOM builders
     ------------------------------------------------------------------ */
  function makeModal(id, title, bodyHtml, footHtml) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const wrap = document.createElement("div");
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

  /* Cascade: fill a department <select> from a faculty <select> */
  function populateDepartments(facultyName, deptSelect) {
    deptSelect.innerHTML = '<option value="">Select department</option>';
    const fac = (
      typeof DEMO_FACULTIES !== "undefined" ? DEMO_FACULTIES : []
    ).find((f) => f.name === facultyName);
    if (fac) {
      fac.departments
        .filter((d) => d.active)
        .forEach((d) => {
          const opt = document.createElement("option");
          opt.value = d.name;
          opt.textContent = d.name;
          deptSelect.appendChild(opt);
        });
    }
    /* Rebuild the styled component with the new options */
    buildCustomSelect(deptSelect);
  }

  function fillFacultyOptions(facSelect) {
    facSelect.innerHTML = '<option value="">Select faculty</option>';
    (typeof DEMO_FACULTIES !== "undefined" ? DEMO_FACULTIES : [])
      .filter((f) => f.active)
      .forEach((f) => {
        const opt = document.createElement("option");
        opt.value = f.name;
        opt.textContent = f.name;
        facSelect.appendChild(opt);
      });
    /* Rebuild the styled component with the new options */
    buildCustomSelect(facSelect);
  }

  /* ------------------------------------------------------------------
     LECTURE EDITOR
     ------------------------------------------------------------------ */
  function openLectureEditor(existing) {
    const faculty = (existing && existing.faculty) || "";
    const department = (existing && existing.department) || "";
    const level = (existing && existing.level) || "";
    const session = (existing && existing.session) || "2026/2027";
    const semester = (existing && existing.semester) || "First";

    const existingRows = [];
    if (existing && Array.isArray(existing.slots)) {
      existing.slots.forEach((slot) => {
        Object.keys(slot.periods || {}).forEach((day) => {
          const p = slot.periods[day];
          existingRows.push({
            day: day,
            time: slot.time,
            code: p.code || "",
            title: p.title || "",
            lecturer: p.lecturer || "",
            venue: p.venue || "",
            color: p.color || "brand",
          });
        });
      });
    }

    const bodyHtml =
      '<div class="tt-editor">' +
      '<div class="tt-section">' +
      '<div class="tt-section-title">Target audience</div>' +
      '<div class="tt-grid-3">' +
      '<div class="field">' +
      '<label class="label" for="tt-l-faculty">Faculty <span class="req">*</span></label>' +
      '<select class="select" id="tt-l-faculty"></select>' +
      '<div class="field-error"><i class="fa-solid fa-circle-exclamation"></i><span>Please select a faculty.</span></div>' +
      "</div>" +
      '<div class="field">' +
      '<label class="label" for="tt-l-department">Department <span class="req">*</span></label>' +
      '<select class="select" id="tt-l-department"><option value="">Select department</option></select>' +
      '<div class="field-error"><i class="fa-solid fa-circle-exclamation"></i><span>Please select a department.</span></div>' +
      "</div>" +
      '<div class="field">' +
      '<label class="label" for="tt-l-level">Level <span class="req">*</span></label>' +
      '<select class="select" id="tt-l-level">' +
      '<option value="">Select level</option>' +
      '<option value="100">100 Level</option>' +
      '<option value="200">200 Level</option>' +
      '<option value="300">300 Level</option>' +
      '<option value="400">400 Level</option>' +
      '<option value="500">500 Level</option>' +
      "</select>" +
      '<div class="field-error"><i class="fa-solid fa-circle-exclamation"></i><span>Please select a level.</span></div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="tt-section">' +
      '<div class="tt-section-title">Session</div>' +
      '<div class="tt-grid-2">' +
      '<div class="field">' +
      '<label class="label" for="tt-l-session">Academic session</label>' +
      '<input class="input" id="tt-l-session" value="' +
      esc(session) +
      '" placeholder="2026/2027">' +
      "</div>" +
      '<div class="field">' +
      '<label class="label" for="tt-l-semester">Semester</label>' +
      '<select class="select" id="tt-l-semester">' +
      '<option value="First"' +
      (semester === "First" ? " selected" : "") +
      ">First</option>" +
      '<option value="Second"' +
      (semester === "Second" ? " selected" : "") +
      ">Second</option>" +
      "</select>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="tt-section">' +
      '<div class="tt-section-title">Schedule entries</div>' +
      '<p class="tt-hint">One row per course occurrence. Example: CSC 401 on Monday at 8:00 – 10:00 AM in Hall A.</p>' +
      '<div id="tt-l-rows" class="tt-rows"></div>' +
      '<button type="button" class="btn btn-secondary btn-block tt-add" id="tt-l-add">' +
      '<i class="fa-solid fa-plus"></i> Add another entry' +
      "</button>" +
      "</div>" +
      '<label class="checkbox tt-notify">' +
      '<input type="checkbox" id="tt-l-notify" checked>' +
      "<span>Send an in-app notification to students in this audience when published</span>" +
      "</label>" +
      "</div>";

    const footHtml =
      '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="tt-l-save">' +
      '<i class="fa-solid fa-check"></i> Publish timetable' +
      "</button>";

    const modal = makeModal(
      "lecture-editor-modal",
      "Build Lecture Timetable",
      bodyHtml,
      footHtml,
    );

    /* Populate static + cascading fields */
    const facSel = modal.querySelector("#tt-l-faculty");
    const deptSel = modal.querySelector("#tt-l-department");
    const levelSel = modal.querySelector("#tt-l-level");
    const semSel = modal.querySelector("#tt-l-semester");

    fillFacultyOptions(facSel);

    if (faculty) {
      facSel.value = faculty;
      populateDepartments(faculty, deptSel);
      if (department) {
        deptSel.value = department;
        /* Sync trigger text after programmatic value change */
        const wrap = deptSel.nextElementSibling;
        if (wrap && wrap.classList.contains("cselect")) {
          const text = wrap.querySelector(".cselect-text");
          const opt = deptSel.options[deptSel.selectedIndex];
          if (text && opt) text.textContent = opt.textContent;
        }
      }
    }
    if (level) {
      levelSel.value = level;
      const wrap = levelSel.nextElementSibling;
      if (wrap && wrap.classList.contains("cselect")) {
        const text = wrap.querySelector(".cselect-text");
        const opt = levelSel.options[levelSel.selectedIndex];
        if (text && opt) text.textContent = opt.textContent;
      }
    }
    if (semester) {
      semSel.value = semester;
      const wrap = semSel.nextElementSibling;
      if (wrap && wrap.classList.contains("cselect")) {
        const text = wrap.querySelector(".cselect-text");
        const opt = semSel.options[semSel.selectedIndex];
        if (text && opt) text.textContent = opt.textContent;
      }
    }

    facSel.addEventListener("change", () => {
      populateDepartments(facSel.value, deptSel);
    });

    /* Row builder */
    const rowsWrap = modal.querySelector("#tt-l-rows");

    function addRow(preset) {
      preset = preset || {};
      const row = document.createElement("div");
      row.className = "tt-row";
      row.innerHTML =
        '<div class="tt-row-head">' +
        '<span class="tt-row-num">Entry</span>' +
        '<button type="button" class="tt-row-del" aria-label="Remove entry">' +
        '<i class="fa-solid fa-trash"></i>' +
        "</button>" +
        "</div>" +
        '<div class="tt-row-grid">' +
        '<div class="field">' +
        '<label class="label">Day</label>' +
        '<select class="select" data-role="day">' +
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          .map(
            (d) =>
              '<option value="' +
              d +
              '"' +
              (preset.day === d ? " selected" : "") +
              ">" +
              d +
              "</option>",
          )
          .join("") +
        "</select>" +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Time</label>' +
        '<input class="input" data-role="time" placeholder="8:00 – 10:00 AM" value="' +
        esc(preset.time || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Venue</label>' +
        '<input class="input" data-role="venue" placeholder="Hall A" value="' +
        esc(preset.venue || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Course code</label>' +
        '<input class="input" data-role="code" placeholder="CSC 401" value="' +
        esc(preset.code || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Course title</label>' +
        '<input class="input" data-role="title" placeholder="Software Engineering" value="' +
        esc(preset.title || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Lecturer</label>' +
        '<input class="input" data-role="lecturer" placeholder="Dr. Ogunlade" value="' +
        esc(preset.lecturer || "") +
        '">' +
        "</div>" +
        "</div>";

      row.querySelector(".tt-row-del").addEventListener("click", () => {
        row.remove();
        renumber();
      });
      rowsWrap.appendChild(row);
      renumber();

      /* Build the custom select for the Day dropdown */
      const daySel = row.querySelector('[data-role="day"]');
      buildCustomSelect(daySel);
    }

    function renumber() {
      rowsWrap.querySelectorAll(".tt-row").forEach((r, i) => {
        const n = r.querySelector(".tt-row-num");
        if (n) n.textContent = "Entry " + (i + 1);
      });
    }

    if (existingRows.length) {
      existingRows.forEach((r) => addRow(r));
    } else {
      addRow({ day: "Monday" });
    }

    modal.querySelector("#tt-l-add").addEventListener("click", () => addRow());

    /* Save */
    modal.querySelector("#tt-l-save").addEventListener("click", () => {
      const facultyVal = facSel.value;
      const deptVal = deptSel.value;
      const levelVal = levelSel.value;

      if (!facultyVal || !deptVal || !levelVal) {
        Toast.warning(
          "Please select faculty, department and level.",
          "Audience required",
        );
        return;
      }

      const rows = [];
      let hasError = false;
      rowsWrap.querySelectorAll(".tt-row").forEach((r) => {
        const day = r.querySelector('[data-role="day"]').value;
        const time = r.querySelector('[data-role="time"]').value.trim();
        const venue = r.querySelector('[data-role="venue"]').value.trim();
        const code = r.querySelector('[data-role="code"]').value.trim();
        const title = r.querySelector('[data-role="title"]').value.trim();
        const lecturer = r.querySelector('[data-role="lecturer"]').value.trim();

        if (!time || !code) {
          hasError = true;
          r.style.borderColor = "var(--danger)";
          return;
        }
        r.style.borderColor = "";
        rows.push({ day, time, venue, code, title, lecturer });
      });

      if (hasError || !rows.length) {
        Toast.error(
          "Each entry needs at least a time and course code.",
          "Incomplete entries",
        );
        return;
      }

      /* Group rows with the same time → one slot */
      const slotMap = new Map();
      rows.forEach((r) => {
        if (!slotMap.has(r.time)) {
          slotMap.set(r.time, { time: r.time, periods: {} });
        }
        slotMap.get(r.time).periods[r.day] = {
          code: r.code,
          title: r.title,
          venue: r.venue || "TBA",
          lecturer: r.lecturer || "TBA",
          color: nextColor(),
        };
      });

      const record = {
        faculty: facultyVal,
        department: deptVal,
        level: levelVal,
        session:
          modal.querySelector("#tt-l-session").value.trim() || "2026/2027",
        semester: semSel.value,
        slots: Array.from(slotMap.values()),
      };

      saveLecture(record);

      if (modal.querySelector("#tt-l-notify").checked) {
        queueNotification(
          "New Lecture Timetable Available",
          "A new lecture timetable has been published for " +
            deptVal +
            " · " +
            levelVal +
            " Level.",
        );
      }

      Modal.close("lecture-editor-modal");
      Toast.success("Lecture timetable published.", "Saved");

      if (typeof window.onTimetableSaved === "function") {
        window.onTimetableSaved();
      }
    });

    /* Final safety pass — rebuild any custom selects we missed */
    buildAllCustomSelectsIn(modal);

    Modal.open("lecture-editor-modal");
  }

  /* ------------------------------------------------------------------
     EXAM EDITOR
     ------------------------------------------------------------------ */
  function openExamEditor(existing) {
    const faculty = (existing && existing.faculty) || "";
    const department = (existing && existing.department) || "";
    const level = (existing && existing.level) || "";
    const session = (existing && existing.session) || "2026/2027";
    const semester = (existing && existing.semester) || "First";

    const existingRows =
      existing && Array.isArray(existing.exams)
        ? existing.exams.map((e) => ({
            date: e.date,
            time: e.time,
            code: e.course,
            title: e.title,
            venue: e.venue,
          }))
        : [];

    const bodyHtml =
      '<div class="tt-editor">' +
      '<div class="tt-section">' +
      '<div class="tt-section-title">Target audience</div>' +
      '<div class="tt-grid-3">' +
      '<div class="field">' +
      '<label class="label" for="tt-e-faculty">Faculty <span class="req">*</span></label>' +
      '<select class="select" id="tt-e-faculty"></select>' +
      '<div class="field-error"><i class="fa-solid fa-circle-exclamation"></i><span>Please select a faculty.</span></div>' +
      "</div>" +
      '<div class="field">' +
      '<label class="label" for="tt-e-department">Department <span class="req">*</span></label>' +
      '<select class="select" id="tt-e-department"><option value="">Select department</option></select>' +
      '<div class="field-error"><i class="fa-solid fa-circle-exclamation"></i><span>Please select a department.</span></div>' +
      "</div>" +
      '<div class="field">' +
      '<label class="label" for="tt-e-level">Level <span class="req">*</span></label>' +
      '<select class="select" id="tt-e-level">' +
      '<option value="">Select level</option>' +
      '<option value="100">100 Level</option>' +
      '<option value="200">200 Level</option>' +
      '<option value="300">300 Level</option>' +
      '<option value="400">400 Level</option>' +
      '<option value="500">500 Level</option>' +
      "</select>" +
      '<div class="field-error"><i class="fa-solid fa-circle-exclamation"></i><span>Please select a level.</span></div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="tt-section">' +
      '<div class="tt-section-title">Session</div>' +
      '<div class="tt-grid-2">' +
      '<div class="field">' +
      '<label class="label" for="tt-e-session">Academic session</label>' +
      '<input class="input" id="tt-e-session" value="' +
      esc(session) +
      '" placeholder="2026/2027">' +
      "</div>" +
      '<div class="field">' +
      '<label class="label" for="tt-e-semester">Semester</label>' +
      '<select class="select" id="tt-e-semester">' +
      '<option value="First"' +
      (semester === "First" ? " selected" : "") +
      ">First</option>" +
      '<option value="Second"' +
      (semester === "Second" ? " selected" : "") +
      ">Second</option>" +
      "</select>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="tt-section">' +
      '<div class="tt-section-title">Exam entries</div>' +
      '<p class="tt-hint">One row per exam paper.</p>' +
      '<div id="tt-e-rows" class="tt-rows"></div>' +
      '<button type="button" class="btn btn-secondary btn-block tt-add" id="tt-e-add">' +
      '<i class="fa-solid fa-plus"></i> Add another exam' +
      "</button>" +
      "</div>" +
      '<label class="checkbox tt-notify">' +
      '<input type="checkbox" id="tt-e-notify" checked>' +
      "<span>Send an in-app notification to students in this audience when published</span>" +
      "</label>" +
      "</div>";

    const footHtml =
      '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="tt-e-save">' +
      '<i class="fa-solid fa-check"></i> Publish timetable' +
      "</button>";

    const modal = makeModal(
      "exam-editor-modal",
      "Build Exam Timetable",
      bodyHtml,
      footHtml,
    );

    const facSel = modal.querySelector("#tt-e-faculty");
    const deptSel = modal.querySelector("#tt-e-department");
    const levelSel = modal.querySelector("#tt-e-level");
    const semSel = modal.querySelector("#tt-e-semester");

    fillFacultyOptions(facSel);

    if (faculty) {
      facSel.value = faculty;
      populateDepartments(faculty, deptSel);
      if (department) {
        deptSel.value = department;
        const wrap = deptSel.nextElementSibling;
        if (wrap && wrap.classList.contains("cselect")) {
          const text = wrap.querySelector(".cselect-text");
          const opt = deptSel.options[deptSel.selectedIndex];
          if (text && opt) text.textContent = opt.textContent;
        }
      }
    }
    if (level) {
      levelSel.value = level;
      const wrap = levelSel.nextElementSibling;
      if (wrap && wrap.classList.contains("cselect")) {
        const text = wrap.querySelector(".cselect-text");
        const opt = levelSel.options[levelSel.selectedIndex];
        if (text && opt) text.textContent = opt.textContent;
      }
    }
    if (semester) {
      semSel.value = semester;
      const wrap = semSel.nextElementSibling;
      if (wrap && wrap.classList.contains("cselect")) {
        const text = wrap.querySelector(".cselect-text");
        const opt = semSel.options[semSel.selectedIndex];
        if (text && opt) text.textContent = opt.textContent;
      }
    }

    facSel.addEventListener("change", () => {
      populateDepartments(facSel.value, deptSel);
    });

    const rowsWrap = modal.querySelector("#tt-e-rows");

    function addRow(preset) {
      preset = preset || {};
      const row = document.createElement("div");
      row.className = "tt-row";
      row.innerHTML =
        '<div class="tt-row-head">' +
        '<span class="tt-row-num">Exam</span>' +
        '<button type="button" class="tt-row-del" aria-label="Remove exam">' +
        '<i class="fa-solid fa-trash"></i>' +
        "</button>" +
        "</div>" +
        '<div class="tt-row-grid">' +
        '<div class="field">' +
        '<label class="label">Date</label>' +
        '<input class="input" type="date" data-role="date" value="' +
        esc(preset.date || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Time</label>' +
        '<input class="input" data-role="time" placeholder="9:00 AM – 12:00 PM" value="' +
        esc(preset.time || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Venue</label>' +
        '<input class="input" data-role="venue" placeholder="Main Hall A" value="' +
        esc(preset.venue || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Course code</label>' +
        '<input class="input" data-role="code" placeholder="CSC 401" value="' +
        esc(preset.code || "") +
        '">' +
        "</div>" +
        '<div class="field">' +
        '<label class="label">Course title</label>' +
        '<input class="input" data-role="title" placeholder="Software Engineering" value="' +
        esc(preset.title || "") +
        '">' +
        "</div>" +
        "</div>";

      row.querySelector(".tt-row-del").addEventListener("click", () => {
        row.remove();
        renumber();
      });
      rowsWrap.appendChild(row);
      renumber();
    }

    function renumber() {
      rowsWrap.querySelectorAll(".tt-row").forEach((r, i) => {
        const n = r.querySelector(".tt-row-num");
        if (n) n.textContent = "Exam " + (i + 1);
      });
    }

    if (existingRows.length) {
      existingRows.forEach((r) => addRow(r));
    } else {
      addRow({});
    }

    modal.querySelector("#tt-e-add").addEventListener("click", () => addRow());

    modal.querySelector("#tt-e-save").addEventListener("click", () => {
      const facultyVal = facSel.value;
      const deptVal = deptSel.value;
      const levelVal = levelSel.value;

      if (!facultyVal || !deptVal || !levelVal) {
        Toast.warning(
          "Please select faculty, department and level.",
          "Audience required",
        );
        return;
      }

      const exams = [];
      let hasError = false;
      rowsWrap.querySelectorAll(".tt-row").forEach((r) => {
        const date = r.querySelector('[data-role="date"]').value;
        const time = r.querySelector('[data-role="time"]').value.trim();
        const venue = r.querySelector('[data-role="venue"]').value.trim();
        const code = r.querySelector('[data-role="code"]').value.trim();
        const title = r.querySelector('[data-role="title"]').value.trim();

        if (!date || !time || !code) {
          hasError = true;
          r.style.borderColor = "var(--danger)";
          return;
        }
        r.style.borderColor = "";
        exams.push({
          date: date,
          time: time,
          course: code,
          title: title,
          venue: venue || "TBA",
        });
      });

      if (hasError || !exams.length) {
        Toast.error(
          "Each exam needs a date, time and course code.",
          "Incomplete entries",
        );
        return;
      }

      exams.sort((a, b) => new Date(a.date) - new Date(b.date));

      const record = {
        faculty: facultyVal,
        department: deptVal,
        level: levelVal,
        session:
          modal.querySelector("#tt-e-session").value.trim() || "2026/2027",
        semester: semSel.value,
        exams: exams,
      };

      saveExam(record);

      if (modal.querySelector("#tt-e-notify").checked) {
        queueNotification(
          "New Exam Timetable Available",
          "A new exam timetable has been published for " +
            deptVal +
            " · " +
            levelVal +
            " Level.",
        );
      }

      Modal.close("exam-editor-modal");
      Toast.success("Exam timetable published.", "Saved");

      if (typeof window.onTimetableSaved === "function") {
        window.onTimetableSaved();
      }
    });

    /* Final safety pass */
    buildAllCustomSelectsIn(modal);

    Modal.open("exam-editor-modal");
  }

  /* ------------------------------------------------------------------
     Notification helper — matches the shape used elsewhere
     ------------------------------------------------------------------ */
  function queueNotification(title, body) {
    const notifs = Store.get("notifications", []) || [];
    notifs.unshift({
      id: "n-" + Date.now(),
      type: "academic_resource",
      icon: "fa-calendar-days",
      tone: "marine",
      title: title,
      body: body,
      link: "academics.html",
      time: Date.now(),
      read: false,
    });
    Store.set("notifications", notifs);
  }

  /* Escape helper */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */
  return {
    openLectureEditor: openLectureEditor,
    openExamEditor: openExamEditor,
    getMergedLectureTimetables: getMergedLectureTimetables,
    getMergedExamTimetables: getMergedExamTimetables,
    findOverride: findOverride,
    deleteLecture: deleteLecture,
    deleteExam: deleteExam,
  };
})();
