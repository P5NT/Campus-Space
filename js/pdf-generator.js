/* ==========================================================================
   CAMPUS SPACE — pdf-generator.js
   Universal printable PDF generator. Each document type has a layout
   suited to its content, but shares the same header, meta strip and
   footer to keep the design system consistent.

   Usage:
     PdfGenerator.open({
       type: 'calendar' | 'exams' | 'lectures' | 'files',
       title: 'Academic Calendar',
       subtitle: 'First Semester - 2026/2027 Academic Session',
       data: [...]   // document-specific
     });
   ========================================================================== */
"use strict";

var PdfGenerator = (function () {
  /* ------------------------------------------------------------------
     Shared CSS — used by every document
     ------------------------------------------------------------------ */
  function sharedCss() {
    return (
      "" +
      "* { box-sizing: border-box; margin: 0; padding: 0; }" +
      ":root {" +
      "--brand-primary: #B33A3A;" +
      "--brand-primary-soft: #F7E9E9;" +
      "--brand-secondary: #003B5C;" +
      "--brand-secondary-soft: #E6EEF3;" +
      "--success: #1F8A5B;" +
      "--success-soft: #E4F4EC;" +
      "--warning: #C77414;" +
      "--warning-soft: #FBF0E0;" +
      "--text-primary: #1A1A1A;" +
      "--text-secondary: #4A5261;" +
      "--text-tertiary: #6B7585;" +
      "--border: #E2E6ED;" +
      "--border-strong: #CBD2DC;" +
      "--bg-subtle: #F5F7FA;" +
      "}" +
      "html, body {" +
      'font-family: "Inter", system-ui, sans-serif;' +
      "color: var(--text-primary);" +
      "background: #FFFFFF;" +
      "line-height: 1.55;" +
      "font-size: 14px;" +
      "}" +
      ".page {" +
      "max-width: 210mm;" +
      "margin: 0 auto;" +
      "padding: 22mm 18mm 28mm 18mm;" +
      "position: relative;" +
      "min-height: 297mm;" +
      "}" +
      /* Header */
      ".header {" +
      "display: flex;" +
      "align-items: center;" +
      "gap: 14px;" +
      "padding-bottom: 16px;" +
      "border-bottom: 3px solid var(--brand-primary);" +
      "margin-bottom: 24px;" +
      "}" +
      ".header img { width: 42px; height: 42px; }" +
      ".header-brand {" +
      'font-family: "Manrope", sans-serif;' +
      "font-size: 18px;" +
      "font-weight: 800;" +
      "letter-spacing: -0.02em;" +
      "line-height: 1.1;" +
      "}" +
      ".header-brand .sub {" +
      'font-family: "Inter", sans-serif;' +
      "font-size: 11px;" +
      "font-weight: 500;" +
      "color: var(--text-tertiary);" +
      "letter-spacing: 0;" +
      "margin-top: 3px;" +
      "}" +
      /* Title */
      ".doc-title {" +
      'font-family: "Manrope", sans-serif;' +
      "font-size: 26px;" +
      "font-weight: 800;" +
      "letter-spacing: -0.02em;" +
      "line-height: 1.2;" +
      "margin-bottom: 6px;" +
      "}" +
      ".doc-subtitle {" +
      "font-size: 13px;" +
      "color: var(--text-secondary);" +
      "margin-bottom: 20px;" +
      "}" +
      /* Meta strip */
      ".meta-strip {" +
      "display: flex;" +
      "justify-content: space-between;" +
      "align-items: center;" +
      "gap: 12px;" +
      "padding: 10px 14px;" +
      "background: var(--brand-secondary-soft);" +
      "border-left: 4px solid var(--brand-secondary);" +
      "border-radius: 6px;" +
      "margin-bottom: 24px;" +
      "font-size: 12px;" +
      "}" +
      ".meta-strip .label {" +
      "font-weight: 700;" +
      "color: var(--brand-secondary);" +
      "letter-spacing: 0.05em;" +
      "text-transform: uppercase;" +
      "font-size: 10.5px;" +
      "margin-right: 6px;" +
      "}" +
      ".meta-strip .value { color: var(--text-primary); }" +
      /* Section heading */
      ".section-title {" +
      'font-family: "Manrope", sans-serif;' +
      "font-size: 15px;" +
      "font-weight: 700;" +
      "text-transform: uppercase;" +
      "letter-spacing: 0.06em;" +
      "color: var(--brand-primary);" +
      "margin-bottom: 14px;" +
      "padding-bottom: 6px;" +
      "border-bottom: 1px solid var(--border);" +
      "}" +
      /* Footer */
      ".footer {" +
      "position: absolute;" +
      "left: 18mm;" +
      "right: 18mm;" +
      "bottom: 16mm;" +
      "padding-top: 14px;" +
      "border-top: 1px solid var(--border);" +
      "display: flex;" +
      "align-items: center;" +
      "justify-content: space-between;" +
      "gap: 16px;" +
      "font-size: 11px;" +
      "color: var(--text-tertiary);" +
      "}" +
      ".footer-brand {" +
      "display: flex;" +
      "align-items: center;" +
      "gap: 8px;" +
      'font-family: "Manrope", sans-serif;' +
      "font-weight: 700;" +
      "color: var(--text-primary);" +
      "font-size: 12px;" +
      "}" +
      ".footer-brand img { width: 22px; height: 22px; }" +
      ".footer-note {" +
      "text-align: right;" +
      "line-height: 1.45;" +
      "}" +
      ".footer-note .school {" +
      "color: var(--text-secondary);" +
      "font-weight: 600;" +
      "display: block;" +
      "margin-bottom: 2px;" +
      "}" +
      /* Print rules */
      "@page { size: A4; margin: 0; }" +
      "@media print {" +
      "html, body { background: #FFFFFF; }" +
      ".page { padding: 20mm 18mm 26mm 18mm; }" +
      ".no-print { display: none !important; }" +
      "}" +
      /* On-screen controls */
      ".actions {" +
      "max-width: 210mm;" +
      "margin: 16px auto 0 auto;" +
      "padding: 0 18mm;" +
      "display: flex;" +
      "gap: 12px;" +
      "justify-content: flex-end;" +
      "}" +
      ".actions button {" +
      'font-family: "Inter", sans-serif;' +
      "font-size: 13px;" +
      "font-weight: 600;" +
      "padding: 10px 18px;" +
      "border-radius: 8px;" +
      "border: 1px solid #E2E6ED;" +
      "background: #FFFFFF;" +
      "color: var(--text-primary);" +
      "cursor: pointer;" +
      "display: inline-flex;" +
      "align-items: center;" +
      "gap: 8px;" +
      "}" +
      ".actions button.primary {" +
      "background: var(--brand-primary);" +
      "color: #FFFFFF;" +
      "border-color: var(--brand-primary);" +
      "}"
    );
  }

  /* ------------------------------------------------------------------
     Layout: CALENDAR (timeline rows)
     ------------------------------------------------------------------ */
  function layoutCalendar(data) {
    var rows = data
      .map(function (e) {
        return (
          '<div class="cal-row">' +
          '<div class="cal-date">' +
          e.date +
          "</div>" +
          '<div class="cal-body">' +
          '<div class="cal-title">' +
          e.title +
          "</div>" +
          '<div class="cal-desc">' +
          e.desc +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="section-title">Key Dates</div>' +
      "<style>" +
      ".cal-row {" +
      "display: grid;" +
      "grid-template-columns: 130px 1fr;" +
      "gap: 18px;" +
      "padding: 12px 0;" +
      "border-bottom: 1px solid var(--border);" +
      "}" +
      ".cal-row:last-child { border-bottom: 0; }" +
      ".cal-date {" +
      'font-family: "Manrope", sans-serif;' +
      "font-size: 12px;" +
      "font-weight: 700;" +
      "color: var(--brand-primary);" +
      "letter-spacing: 0.02em;" +
      "}" +
      ".cal-title {" +
      "font-size: 14px;" +
      "font-weight: 600;" +
      "color: var(--text-primary);" +
      "margin-bottom: 3px;" +
      "}" +
      ".cal-desc {" +
      "font-size: 12px;" +
      "color: var(--text-secondary);" +
      "line-height: 1.5;" +
      "}" +
      "</style>" +
      rows
    );
  }

  /* ------------------------------------------------------------------
     Layout: EXAMS (list of exams)
     ------------------------------------------------------------------ */
  function layoutExams(data) {
    var rows = data
      .map(function (e) {
        return (
          '<div class="exam-row">' +
          '<div class="exam-date-block">' +
          '<div class="exam-day">' +
          e.day +
          "</div>" +
          '<div class="exam-month">' +
          e.month +
          "</div>" +
          "</div>" +
          '<div class="exam-body">' +
          '<div class="exam-course">' +
          e.course +
          " - " +
          e.title +
          "</div>" +
          '<div class="exam-meta">' +
          "<span><strong>Time:</strong> " +
          e.time +
          "</span>" +
          "<span><strong>Venue:</strong> " +
          e.venue +
          "</span>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="section-title">Examination Schedule</div>' +
      "<style>" +
      ".exam-row {" +
      "display: grid;" +
      "grid-template-columns: 68px 1fr;" +
      "gap: 16px;" +
      "padding: 12px 0;" +
      "border-bottom: 1px solid var(--border);" +
      "align-items: flex-start;" +
      "}" +
      ".exam-row:last-child { border-bottom: 0; }" +
      ".exam-date-block {" +
      "background: var(--brand-secondary);" +
      "color: #FFFFFF;" +
      "border-radius: 8px;" +
      "padding: 10px 8px;" +
      "text-align: center;" +
      "line-height: 1;" +
      "}" +
      ".exam-day {" +
      'font-family: "Manrope", sans-serif;' +
      "font-size: 24px;" +
      "font-weight: 800;" +
      "}" +
      ".exam-month {" +
      "font-size: 10px;" +
      "font-weight: 700;" +
      "letter-spacing: 0.08em;" +
      "margin-top: 4px;" +
      "color: rgba(255, 255, 255, 0.85);" +
      "}" +
      ".exam-course {" +
      "font-size: 14px;" +
      "font-weight: 700;" +
      "color: var(--text-primary);" +
      "margin-bottom: 4px;" +
      "}" +
      ".exam-meta {" +
      "font-size: 12px;" +
      "color: var(--text-secondary);" +
      "display: flex;" +
      "gap: 16px;" +
      "flex-wrap: wrap;" +
      "}" +
      ".exam-meta strong { color: var(--text-primary); font-weight: 600; }" +
      "</style>" +
      rows
    );
  }

  /* ------------------------------------------------------------------
     Layout: LECTURES (grid table)
     ------------------------------------------------------------------ */
  function layoutLectures(data) {
    /* data: { days: [...], slots: [{time, periods:{Mon:{...},...}}] } */
    var days = data.days;
    var slots = data.slots;

    var headCells = '<div class="tt-cell tt-head">Time</div>';
    days.forEach(function (d) {
      headCells += '<div class="tt-cell tt-head">' + d + "</div>";
    });

    var bodyRows = slots
      .map(function (slot) {
        var row = '<div class="tt-cell tt-time">' + slot.time + "</div>";
        days.forEach(function (d) {
          var p = slot.periods[d];
          if (p) {
            row +=
              '<div class="tt-cell">' +
              '<div class="tt-class">' +
              "<strong>" +
              p.code +
              "</strong>" +
              "<span>" +
              p.venue +
              "</span>" +
              "<span>" +
              p.lecturer +
              "</span>" +
              "</div>" +
              "</div>";
          } else {
            row += '<div class="tt-cell tt-empty"></div>';
          }
        });
        return '<div class="tt-row">' + row + "</div>";
      })
      .join("");

    var gridCols = "120px repeat(" + days.length + ", minmax(0, 1fr))";

    return (
      '<div class="section-title">Weekly Lecture Schedule</div>' +
      "<style>" +
      ".tt-table {" +
      "border: 1px solid var(--border);" +
      "border-radius: 8px;" +
      "overflow: hidden;" +
      "margin-top: 4px;" +
      "}" +
      ".tt-header, .tt-row {" +
      "display: grid;" +
      "grid-template-columns: " +
      gridCols +
      ";" +
      "}" +
      ".tt-header {" +
      "background: var(--bg-subtle);" +
      "border-bottom: 1px solid var(--border);" +
      "}" +
      ".tt-row {" +
      "border-bottom: 1px solid var(--border);" +
      "}" +
      ".tt-row:last-child { border-bottom: 0; }" +
      ".tt-cell {" +
      "padding: 8px;" +
      "font-size: 11px;" +
      "border-right: 1px solid var(--border);" +
      "min-height: 62px;" +
      "display: flex;" +
      "flex-direction: column;" +
      "justify-content: center;" +
      "align-items: stretch;" +
      "}" +
      ".tt-cell:last-child { border-right: 0; }" +
      ".tt-head {" +
      "font-size: 10px;" +
      "font-weight: 700;" +
      "letter-spacing: 0.05em;" +
      "text-transform: uppercase;" +
      "color: var(--text-secondary);" +
      "background: var(--bg-subtle);" +
      "text-align: center;" +
      "justify-content: center;" +
      "}" +
      ".tt-time {" +
      "font-weight: 700;" +
      "color: var(--text-secondary);" +
      "font-size: 10px;" +
      "background: var(--bg-subtle);" +
      "}" +
      ".tt-class {" +
      "background: var(--brand-primary-soft);" +
      "border-left: 3px solid var(--brand-primary);" +
      "border-radius: 4px;" +
      "padding: 5px 6px;" +
      "font-size: 10px;" +
      "}" +
      ".tt-class strong {" +
      "display: block;" +
      "font-size: 11px;" +
      "color: var(--brand-primary);" +
      "margin-bottom: 2px;" +
      "}" +
      ".tt-class span {" +
      "display: block;" +
      "color: var(--text-secondary);" +
      "line-height: 1.3;" +
      "}" +
      "</style>" +
      '<div class="tt-table">' +
      '<div class="tt-header">' +
      headCells +
      "</div>" +
      bodyRows +
      "</div>"
    );
  }

  /* ------------------------------------------------------------------
     Layout: FILES (list of documents)
     ------------------------------------------------------------------ */
  function layoutFiles(data) {
    var rows = data
      .map(function (f, i) {
        return (
          '<div class="file-row">' +
          '<div class="file-num">' +
          (i + 1) +
          "</div>" +
          '<div class="file-body">' +
          '<div class="file-name">' +
          f.name +
          "</div>" +
          '<div class="file-meta">' +
          (f.course ? "<span>" + f.course + "</span>" : "") +
          (f.category ? "<span>" + f.category + "</span>" : "") +
          (f.size ? "<span>" + f.size + "</span>" : "") +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="section-title">' +
      data.length +
      " Item" +
      (data.length === 1 ? "" : "s") +
      "</div>" +
      "<style>" +
      ".file-row {" +
      "display: grid;" +
      "grid-template-columns: 28px 1fr;" +
      "gap: 12px;" +
      "padding: 10px 0;" +
      "border-bottom: 1px solid var(--border);" +
      "align-items: flex-start;" +
      "}" +
      ".file-row:last-child { border-bottom: 0; }" +
      ".file-num {" +
      "width: 24px;" +
      "height: 24px;" +
      "border-radius: 50%;" +
      "background: var(--brand-primary-soft);" +
      "color: var(--brand-primary);" +
      "display: flex;" +
      "align-items: center;" +
      "justify-content: center;" +
      "font-size: 11px;" +
      "font-weight: 700;" +
      "}" +
      ".file-name {" +
      "font-size: 13px;" +
      "font-weight: 600;" +
      "color: var(--text-primary);" +
      "margin-bottom: 3px;" +
      "line-height: 1.35;" +
      "}" +
      ".file-meta {" +
      "font-size: 11px;" +
      "color: var(--text-tertiary);" +
      "display: flex;" +
      "gap: 14px;" +
      "flex-wrap: wrap;" +
      "}" +
      "</style>" +
      rows
    );
  }

  /* ------------------------------------------------------------------
     Dispatch by type
     ------------------------------------------------------------------ */
  function buildContent(type, data) {
    switch (type) {
      case "calendar":
        return layoutCalendar(data);
      case "exams":
        return layoutExams(data);
      case "lectures":
        return layoutLectures(data);
      case "files":
        return layoutFiles(data);
      default:
        return '<div class="section-title">Content</div>';
    }
  }

  /* ------------------------------------------------------------------
     Public: open the print preview
     ------------------------------------------------------------------ */
  function open(opts) {
    opts = opts || {};

    var session = typeof Auth !== "undefined" ? Auth.current() : null;
    var student =
      session && typeof DEMO_STUDENTS !== "undefined"
        ? DEMO_STUDENTS.find(function (s) {
            return s.username === session.username;
          })
        : null;

    var printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to download the PDF.");
      return;
    }

    var brandIconUrl = new URL(
      "../../assets/icons/brand-icon.svg",
      location.href,
    ).href;
    var generatedOn = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    var contentHtml = buildContent(opts.type, opts.data);

    var html =
      "<!DOCTYPE html>" +
      '<html lang="en">' +
      "<head>" +
      '<meta charset="UTF-8">' +
      "<title>" +
      (opts.title || "Document") +
      " - Campus Space</title>" +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      "<style>" +
      sharedCss() +
      "</style>" +
      "</head>" +
      "<body>" +
      '<div class="actions no-print">' +
      '<button onclick="window.close()">Close</button>' +
      '<button class="primary" onclick="window.print()">Download as PDF</button>' +
      "</div>" +
      '<div class="page">' +
      '<div class="header">' +
      '<img src="' +
      brandIconUrl +
      '" alt="Campus Space">' +
      '<div class="header-brand">Campus Space<div class="sub">OAUSTECH Student Digital Ecosystem</div></div>' +
      "</div>" +
      '<div class="doc-title">' +
      (opts.title || "Document") +
      "</div>" +
      '<div class="doc-subtitle">' +
      (opts.subtitle || "") +
      "</div>" +
      '<div class="meta-strip">' +
      '<div><span class="label">Issued to</span><span class="value">' +
      (student ? student.firstName + " " + student.lastName : "Student") +
      "</span></div>" +
      '<div><span class="label">Generated</span><span class="value">' +
      generatedOn +
      "</span></div>" +
      "</div>" +
      contentHtml +
      '<div class="footer">' +
      '<div class="footer-brand"><img src="' +
      brandIconUrl +
      '" alt=""> Campus Space</div>' +
      '<div class="footer-note">' +
      '<span class="school">Issued by the Office of the Registrar, OAUSTECH</span>' +
      "Generated via Campus Space - the official student digital ecosystem." +
      "</div>" +
      "</div>" +
      "</div>" +
      "</body>" +
      "</html>";

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(function () {
      try {
        printWindow.focus();
      } catch (e) {}
    }, 200);
  }

  return { open: open };
})();
