/* ==========================================================================
   CAMPUS SPACE — academics.js
   GPA/CGPA calculators and academic page helpers.
   ========================================================================== */
"use strict";

/* Grade → point mapping (5-point scale used at OAUSTECH) */
const GRADE_POINTS = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

function classifyGPA(gpa) {
  if (gpa >= 4.5) return "First Class";
  if (gpa >= 3.5) return "Second Class Upper";
  if (gpa >= 2.4) return "Second Class Lower";
  if (gpa >= 1.5) return "Third Class";
  return "Fail";
}

/* -------------------------------------------------------------------------
   GPA Calculator — dynamic rows
   ------------------------------------------------------------------------- */
function initGpaCalculator() {
  const form = document.getElementById("gpa-form");
  if (!form) return;

  const rowsWrap = document.getElementById("gpa-rows");
  const addBtn = document.getElementById("gpa-add");
  const resultBox = document.getElementById("gpa-result");

  let counter = 0;

  function addRow(preset = {}) {
    counter++;
    const row = document.createElement("div");
    row.className = "gpa-row";
    row.dataset.row = String(counter);
    row.innerHTML = `
      <input class="input" type="text" placeholder="Course code e.g. CSC 401" value="${preset.code || ""}" data-role="code" aria-label="Course code">
      <input class="input" type="number" min="0" max="6" step="1" placeholder="Units" value="${preset.units || ""}" data-role="units" aria-label="Credit units">
      <select class="select" data-role="grade" aria-label="Grade">
        <option value="">Grade</option>
        <option value="A">A (5)</option>
        <option value="B">B (4)</option>
        <option value="C">C (3)</option>
        <option value="D">D (2)</option>
        <option value="E">E (1)</option>
        <option value="F">F (0)</option>
      </select>
      <button type="button" class="btn-icon" aria-label="Remove row">
        <i class="fa-solid fa-trash"></i>
      </button>`;
    row.querySelector("button").addEventListener("click", () => {
      row.remove();
      compute();
    });
    row
      .querySelectorAll("input, select")
      .forEach((el) => el.addEventListener("input", compute));
    rowsWrap.appendChild(row);
    compute();
  }

  function compute() {
    const rows = rowsWrap.querySelectorAll(".gpa-row");
    let totalUnits = 0,
      totalPoints = 0;
    rows.forEach((r) => {
      const units = parseFloat(r.querySelector('[data-role="units"]').value);
      const grade = r.querySelector('[data-role="grade"]').value;
      if (!isNaN(units) && grade) {
        totalUnits += units;
        totalPoints += units * GRADE_POINTS[grade];
      }
    });
    if (totalUnits === 0) {
      resultBox.querySelector(".value").textContent = "0.00";
      resultBox.querySelector(".class").textContent = "—";
    } else {
      const gpa = totalPoints / totalUnits;
      resultBox.querySelector(".value").textContent = gpa.toFixed(2);
      resultBox.querySelector(".class").textContent = classifyGPA(gpa);
    }
  }

  addBtn.addEventListener("click", () => addRow());

  // Seed demo rows
  addRow({ code: "CSC 401", units: "3", grade: "" });
  addRow({ code: "CSC 403", units: "3" });
  addRow({ code: "CSC 405", units: "2" });

  // Restore preset grade values
  const presets = ["A", "B", "A"];
  rowsWrap.querySelectorAll('[data-role="grade"]').forEach((sel, i) => {
    if (presets[i]) sel.value = presets[i];
  });
  compute();

  form.addEventListener("submit", (e) => e.preventDefault());
}

/* -------------------------------------------------------------------------
   CGPA Calculator
   ------------------------------------------------------------------------- */
function initCgpaCalculator() {
  const form = document.getElementById("cgpa-form");
  if (!form) return;

  const rowsWrap = document.getElementById("cgpa-rows");
  const addBtn = document.getElementById("cgpa-add");
  const resultBox = document.getElementById("cgpa-result");

  let counter = 0;

  function addRow(preset = {}) {
    counter++;
    const row = document.createElement("div");
    row.className = "gpa-row";
    row.dataset.row = String(counter);
    row.innerHTML = `
      <input class="input" type="text" placeholder="Semester e.g. 100L First" value="${preset.label || ""}" data-role="label" aria-label="Semester">
      <input class="input" type="number" min="0" max="6" step="0.01" placeholder="GPA" value="${preset.gpa || ""}" data-role="gpa" aria-label="GPA">
      <input class="input" type="number" min="0" step="1" placeholder="Total units" value="${preset.units || ""}" data-role="units" aria-label="Total units">
      <button type="button" class="btn-icon" aria-label="Remove row">
        <i class="fa-solid fa-trash"></i>
      </button>`;
    row.querySelector("button").addEventListener("click", () => {
      row.remove();
      compute();
    });
    row
      .querySelectorAll("input")
      .forEach((el) => el.addEventListener("input", compute));
    rowsWrap.appendChild(row);
    compute();
  }

  function compute() {
    const rows = rowsWrap.querySelectorAll(".gpa-row");
    let totalUnits = 0,
      weighted = 0;
    rows.forEach((r) => {
      const gpa = parseFloat(r.querySelector('[data-role="gpa"]').value);
      const units = parseFloat(r.querySelector('[data-role="units"]').value);
      if (!isNaN(gpa) && !isNaN(units) && units > 0) {
        totalUnits += units;
        weighted += gpa * units;
      }
    });
    if (totalUnits === 0) {
      resultBox.querySelector(".value").textContent = "0.00";
      resultBox.querySelector(".class").textContent = "—";
    } else {
      const cgpa = weighted / totalUnits;
      resultBox.querySelector(".value").textContent = cgpa.toFixed(2);
      resultBox.querySelector(".class").textContent = classifyGPA(cgpa);
    }
  }

  addBtn.addEventListener("click", () => addRow());

  addRow({ label: "100L First", gpa: "4.20", units: "18" });
  addRow({ label: "100L Second", gpa: "4.50", units: "20" });
  addRow({ label: "200L First", gpa: "4.10", units: "22" });

  form.addEventListener("submit", (e) => e.preventDefault());
}

/* -------------------------------------------------------------------------
   Render course catalog
   ------------------------------------------------------------------------- */
function renderCourseCatalog(
  container,
  { department = "", level = "", search = "" } = {},
) {
  if (!container) return;
  let list = DEMO_COURSES.slice();
  if (department) list = list.filter((c) => c.department === department);
  if (level) list = list.filter((c) => c.level === level);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.lecturer.toLowerCase().includes(q),
    );
  }
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-book"></i></div>
        <h3>No courses match those filters</h3>
        <p>Try a different department, level, or search term.</p>
      </div>`;
    return;
  }
  list.forEach((c) => {
    const el = document.createElement("a");
    el.className = "course-item";
    el.href = "course-details.html?id=" + encodeURIComponent(c.id);
    el.innerHTML = `
      <span class="course-code">${Util.escape(c.code)}</span>
      <div class="course-info">
        <div class="course-title">${Util.escape(c.title)}</div>
        <div class="course-meta">${Util.escape(c.lecturer)} · ${c.units} units · ${Util.escape(c.semester)} Semester</div>
      </div>
      <i class="fa-solid fa-chevron-right" style="color:var(--text-tertiary); font-size:12px;"></i>`;
    container.appendChild(el);
  });
}

/* -------------------------------------------------------------------------
   Render resources
   ------------------------------------------------------------------------- */
function renderResources(container, list) {
  if (!container) return;
  container.innerHTML = "";
  if (!list || !list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-file-lines"></i></div>
        <h3>No resources yet</h3>
        <p>Academic resources uploaded by Admin will appear here.</p>
      </div>`;
    return;
  }
  list.forEach((r) => {
    const iconMap = {
      pdf: "fa-file-pdf",
      doc: "fa-file-word",
      xls: "fa-file-excel",
    };
    const el = document.createElement("div");
    el.className = "resource-row";
    el.innerHTML = `
      <div class="resource-icon ${r.type}"><i class="fa-solid ${iconMap[r.type] || "fa-file"}"></i></div>
      <div class="resource-info">
        <div class="resource-name" title="${Util.escape(r.name)}">${Util.escape(r.name)}</div>
        <div class="resource-meta">
          <span><i class="fa-solid fa-tag"></i> ${Util.escape(r.category)}</span>
          <span><i class="fa-regular fa-clock"></i> ${Util.relativeTime(r.uploaded)}</span>
          <span>${Util.escape(r.size)}</span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" data-download aria-label="Download ${Util.escape(r.name)}">
        <i class="fa-solid fa-download"></i>
        <span class="download-label">Download</span>
      </button>`;
    el.querySelector("[data-download]").addEventListener("click", (e) => {
      e.stopPropagation();
      Toast.success(
        'Downloading "' + r.name + '" (simulated).',
        "Download started",
      );
    });
    container.appendChild(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initGpaCalculator();
  initCgpaCalculator();
});
