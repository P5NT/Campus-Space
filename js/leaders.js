/* ==========================================================================
   CAMPUS SPACE — leaders.js
   Student leaders rendering.
   ========================================================================== */
"use strict";

function getLeaderList() {
  return DEMO_LEADERS.map((l) => {
    const student = DEMO_STUDENTS.find((s) => s.id === l.studentId);
    const assoc = DEMO_ASSOCIATIONS.find((a) => a.id === l.associationId);
    const pos = DEMO_POSITIONS.find((p) => p.id === l.positionId);
    if (!student || !assoc || !pos) return null;
    return { student, assoc, pos };
  }).filter(Boolean);
}

function renderLeaderCard(l) {
  const { student, assoc, pos } = l;
  const card = document.createElement("a");
  card.href = "leader-profile.html?id=" + student.id;
  card.className = "leader-card";
  card.innerHTML = `
    ${
      student.avatar
        ? `<img src="${student.avatar}" alt="" class="avatar avatar-72" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'avatar avatar-72 avatar-fallback',textContent:'${Util.initials(student.firstName + " " + student.lastName)}'}))">`
        : `<span class="avatar avatar-72 avatar-fallback">${Util.initials(student.firstName + " " + student.lastName)}</span>`
    }
    <h3>${Util.escape(student.firstName + " " + student.lastName)} <i class="fa-solid fa-circle-check tag-verified"></i></h3>
    <div class="handle">@${Util.escape(student.username)}</div>
    <div class="position">${Util.escape(pos.name)}</div>
    <div class="assoc">${Util.escape(assoc.name)} · ${Util.escape(assoc.acronym)}</div>
    <button class="btn btn-secondary btn-sm">
      <i class="fa-solid fa-arrow-right"></i> View profile
    </button>`;
  return card;
}
