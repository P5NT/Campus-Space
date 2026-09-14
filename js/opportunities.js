/* ==========================================================================
   CAMPUS SPACE — opportunities.js
   Opportunity listing and detail rendering.
   ========================================================================== */
"use strict";

function renderOpportunities(container, list) {
  if (!container) return;
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon"><i class="fa-solid fa-briefcase"></i></div>
        <h3>No opportunities found</h3>
        <p>Try a different category or search term.</p>
      </div>`;
    return;
  }
  list.forEach((o) => {
    const days = Math.ceil((new Date(o.deadline) - Date.now()) / 86400000);
    const urgent = days <= 14 && days >= 0;
    const card = document.createElement("a");
    card.href = "opportunity-details.html?id=" + o.id;
    card.className = "opp-card";
    card.innerHTML = `
      <div class="opp-head">
        <span class="opp-org">${Util.escape(o.organization)}</span>
        <span class="badge badge-marine">${Util.escape(o.category)}</span>
      </div>
      <h3>${Util.escape(o.title)}</h3>
      <p class="desc">${Util.escape(o.summary)}</p>
      <div class="opp-foot">
        <span class="opp-deadline${urgent ? " urgent" : ""}">
          <i class="fa-regular fa-clock"></i>
          ${days < 0 ? "Expired" : days === 0 ? "Due today" : days + " days left"}
        </span>
        <span class="badge badge-neutral"><i class="fa-solid fa-location-dot"></i> ${Util.escape(o.location)}</span>
      </div>`;
    container.appendChild(card);
  });
}
