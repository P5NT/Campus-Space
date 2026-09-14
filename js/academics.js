/* ==========================================================================
   CAMPUS SPACE — academics.js
   Shared academic helpers: course catalog rendering and resource listings.

   Note: GPA and CGPA calculators live inside their own page scripts
   (gpa-calculator.html and cgpa-calculator.html) and are NOT defined here.
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   Course catalog renderer
   Renders a filtered list of DEMO_COURSES into a container.
   ------------------------------------------------------------------------- */
function renderCourseCatalog(container, options) {
  if (!container) return;
  options = options || {};
  const department = options.department || "";
  const level = options.level || "";
  const search = options.search || "";

  let list = DEMO_COURSES.slice();

  if (department)
    list = list.filter(function (c) {
      return c.department === department;
    });
  if (level)
    list = list.filter(function (c) {
      return c.level === level;
    });

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(function (c) {
      return (
        c.code.toLowerCase().indexOf(q) !== -1 ||
        c.title.toLowerCase().indexOf(q) !== -1 ||
        c.lecturer.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-icon"><i class="fa-solid fa-book"></i></div>' +
      "<h3>No courses match those filters</h3>" +
      "<p>Try a different department, level, or search term.</p>" +
      "</div>";
    return;
  }

  list.forEach(function (c) {
    const el = document.createElement("a");
    el.className = "course-item";
    el.href = "course-details.html?id=" + encodeURIComponent(c.id);
    el.innerHTML =
      '<span class="course-code">' +
      Util.escape(c.code) +
      "</span>" +
      '<div class="course-info">' +
      '<div class="course-title">' +
      Util.escape(c.title) +
      "</div>" +
      '<div class="course-meta">' +
      Util.escape(c.lecturer) +
      " · " +
      c.units +
      " units · " +
      Util.escape(c.semester) +
      " Semester</div>" +
      "</div>" +
      '<i class="fa-solid fa-chevron-right" style="color:var(--text-tertiary); font-size:12px;"></i>';
    container.appendChild(el);
  });
}

/* -------------------------------------------------------------------------
   Academic resource renderer
   Renders a list of resources (timetables, materials, past questions, etc.)
   into a container. Each row has a download button.
   ------------------------------------------------------------------------- */
function renderResources(container, list) {
  if (!container) return;
  container.innerHTML = "";

  if (!list || !list.length) {
    container.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-icon"><i class="fa-solid fa-file-lines"></i></div>' +
      "<h3>No resources yet</h3>" +
      "<p>Academic resources uploaded by Admin will appear here.</p>" +
      "</div>";
    return;
  }

  const ICONS = {
    pdf: "fa-file-pdf",
    doc: "fa-file-word",
    docx: "fa-file-word",
    xls: "fa-file-excel",
    xlsx: "fa-file-excel",
  };

  list.forEach(function (r) {
    const el = document.createElement("div");
    el.className = "resource-row";
    el.innerHTML =
      '<div class="resource-icon ' +
      (r.type || "pdf") +
      '">' +
      '<i class="fa-solid ' +
      (ICONS[r.type] || "fa-file") +
      '"></i>' +
      "</div>" +
      '<div class="resource-info">' +
      '<div class="resource-name" title="' +
      Util.escape(r.name) +
      '">' +
      Util.escape(r.name) +
      "</div>" +
      '<div class="resource-meta">' +
      '<span><i class="fa-solid fa-tag"></i> ' +
      Util.escape(r.category) +
      "</span>" +
      '<span><i class="fa-regular fa-clock"></i> ' +
      Util.relativeTime(r.uploaded) +
      "</span>" +
      "<span>" +
      Util.escape(r.size) +
      "</span>" +
      "</div>" +
      "</div>" +
      '<button class="btn btn-secondary btn-sm" data-download aria-label="Download ' +
      Util.escape(r.name) +
      '">' +
      '<i class="fa-solid fa-download"></i>' +
      '<span class="download-label">Download</span>' +
      "</button>";

    const btn = el.querySelector("[data-download]");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (typeof Toast !== "undefined") {
          Toast.success(
            'Downloading "' + r.name + '" (simulated).',
            "Download started",
          );
        }
      });
    }

    container.appendChild(el);
  });
}

/* -------------------------------------------------------------------------
   Page initialisation — nothing needed here since calculators are handled
   by their own page scripts. Kept as a placeholder for future shared setup.
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  // Intentionally empty. This file provides shared rendering helpers only.
});
