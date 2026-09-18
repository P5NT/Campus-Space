/* ==========================================================================
   CAMPUS SPACE — calendar-pdf.js
   Generates a printable A4 view of the academic calendar.
   Loaded as an external script to avoid inline-script parser issues.
   ========================================================================== */
"use strict";

function openPrintableCalendar() {
  var session = typeof Auth !== "undefined" ? Auth.current() : null;
  var student =
    session && typeof DEMO_STUDENTS !== "undefined"
      ? DEMO_STUDENTS.find(function (s) {
          return s.username === session.username;
        })
      : null;

  var events = [
    {
      date: "2 January 2026",
      title: "Resumption & Registration Begins",
      desc: "Returning students report to campus. Course registration opens.",
    },
    {
      date: "13 January 2026",
      title: "Late Registration Begins",
      desc: "A late registration fee applies from this date.",
    },
    {
      date: "20 January 2026",
      title: "Lectures Commence",
      desc: "First semester lectures begin across all faculties.",
    },
    {
      date: "26 January 2026",
      title: "Course Registration Deadline",
      desc: "No registration accepted beyond this date.",
    },
    {
      date: "14-18 April 2026",
      title: "Revision Week",
      desc: "Lectures end. Students prepare for examinations.",
    },
    {
      date: "20 April 2026",
      title: "First Semester Examinations Begin",
      desc: "Examination timetable published in advance.",
    },
    {
      date: "8 May 2026",
      title: "First Semester Ends",
      desc: "End of first semester.",
    },
    {
      date: "18 May 2026",
      title: "Second Semester Begins",
      desc: "Second semester lectures commence.",
    },
  ];

  var printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to download the PDF.");
    return;
  }

  var brandIconUrl = new URL("../../assets/icons/brand-icon.svg", location.href)
    .href;
  var generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  var rowsHtml = events
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

  var headStyles =
    "* { box-sizing: border-box; margin: 0; padding: 0; }" +
    ":root {" +
    "--brand-primary: #B33A3A;" +
    "--brand-primary-soft: #F7E9E9;" +
    "--brand-secondary: #003B5C;" +
    "--brand-secondary-soft: #E6EEF3;" +
    "--text-primary: #1A1A1A;" +
    "--text-secondary: #4A5261;" +
    "--text-tertiary: #6B7585;" +
    "--border: #E2E6ED;" +
    "--bg-subtle: #F5F7FA;" +
    "}" +
    'html, body { font-family: "Inter", system-ui, sans-serif; color: var(--text-primary); background: #FFFFFF; line-height: 1.55; font-size: 14px; }' +
    ".page { max-width: 210mm; margin: 0 auto; padding: 22mm 18mm 28mm 18mm; position: relative; min-height: 297mm; }" +
    ".header { display: flex; align-items: center; gap: 14px; padding-bottom: 16px; border-bottom: 3px solid var(--brand-primary); margin-bottom: 24px; }" +
    ".header img { width: 42px; height: 42px; }" +
    '.header-brand { font-family: "Manrope", sans-serif; font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }' +
    '.header-brand .sub { font-family: "Inter", sans-serif; font-size: 11px; font-weight: 500; color: var(--text-tertiary); letter-spacing: 0; margin-top: 3px; }' +
    '.doc-title { font-family: "Manrope", sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; color: var(--text-primary); margin-bottom: 6px; }' +
    ".doc-subtitle { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; }" +
    ".meta-strip { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 14px; background: var(--brand-secondary-soft); border-left: 4px solid var(--brand-secondary); border-radius: 6px; margin-bottom: 24px; font-size: 12px; }" +
    ".meta-strip .label { font-weight: 700; color: var(--brand-secondary); letter-spacing: 0.05em; text-transform: uppercase; font-size: 10.5px; margin-right: 6px; }" +
    ".meta-strip .value { color: var(--text-primary); }" +
    '.section-title { font-family: "Manrope", sans-serif; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-primary); margin-bottom: 14px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }' +
    ".cal-row { display: grid; grid-template-columns: 130px 1fr; gap: 18px; padding: 12px 0; border-bottom: 1px solid var(--border); }" +
    ".cal-row:last-child { border-bottom: 0; }" +
    '.cal-date { font-family: "Manrope", sans-serif; font-size: 12px; font-weight: 700; color: var(--brand-primary); letter-spacing: 0.02em; }' +
    ".cal-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }" +
    ".cal-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }" +
    ".footer { position: absolute; left: 18mm; right: 18mm; bottom: 16mm; padding-top: 14px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 11px; color: var(--text-tertiary); }" +
    '.footer-brand { display: flex; align-items: center; gap: 8px; font-family: "Manrope", sans-serif; font-weight: 700; color: var(--text-primary); font-size: 12px; }' +
    ".footer-brand img { width: 22px; height: 22px; }" +
    ".footer-note { text-align: right; line-height: 1.45; }" +
    ".footer-note .school { color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 2px; }" +
    "@page { size: A4; margin: 0; }" +
    "@media print { html, body { background: #FFFFFF; } .page { padding: 20mm 18mm 26mm 18mm; } .no-print { display: none !important; } }" +
    ".actions { max-width: 210mm; margin: 16px auto 0 auto; padding: 0 18mm; display: flex; gap: 12px; justify-content: flex-end; }" +
    '.actions button { font-family: "Inter", sans-serif; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: 1px solid #E2E6ED; background: #FFFFFF; color: var(--text-primary); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }' +
    ".actions button.primary { background: var(--brand-primary); color: #FFFFFF; border-color: var(--brand-primary); }";

  var html =
    "<!DOCTYPE html>" +
    '<html lang="en">' +
    "<head>" +
    '<meta charset="UTF-8">' +
    "<title>OAUSTECH Academic Calendar - 2026/2027</title>" +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    "<style>" +
    headStyles +
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
    '<div class="doc-title">Academic Calendar</div>' +
    '<div class="doc-subtitle">First Semester - 2026/2027 Academic Session</div>' +
    '<div class="meta-strip">' +
    '<div><span class="label">Issued to</span><span class="value">' +
    (student ? student.firstName + " " + student.lastName : "Student") +
    "</span></div>" +
    '<div><span class="label">Generated</span><span class="value">' +
    generatedOn +
    "</span></div>" +
    "</div>" +
    '<div class="section-title">Key Dates</div>' +
    rowsHtml +
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
