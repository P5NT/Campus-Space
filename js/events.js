/* ==========================================================================
   CAMPUS SPACE — events.js
   Event listing renderer + external PassSpot links.
   ========================================================================== */
"use strict";

function renderEvents(container, list) {
  if (!container) return;
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon"><i class="fa-solid fa-ticket"></i></div>
        <h3>No events found</h3>
        <p>Check back soon — new events are added regularly.</p>
      </div>`;
    return;
  }
  list.forEach((e) => {
    const d = new Date(e.date);
    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-media">
        <img src="${e.image}" alt="" onerror="this.parentElement.style.background='linear-gradient(135deg, var(--brand-secondary), #001F31)'; this.style.display='none';">
        <div class="event-date-badge">
          <div class="day">${d.getDate()}</div>
          <div class="month">${d.toLocaleString("en-GB", { month: "short" })}</div>
        </div>
      </div>
      <div class="event-card-body">
        <span class="badge badge-marine" style="align-self:flex-start; margin-bottom:12px;">${Util.escape(e.category)}</span>
        <h3>${Util.escape(e.title)}</h3>
        <div class="event-info">
          <span><i class="fa-regular fa-clock"></i> ${Util.escape(e.time)}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${Util.escape(e.location)}</span>
          <span><i class="fa-solid fa-user-tie"></i> ${Util.escape(e.organizer)}</span>
        </div>
        <a href="${e.ticketUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-block" data-external>
          <i class="fa-solid fa-ticket"></i> Get tickets
        </a>
        <div class="external-note" style="margin-top:8px; align-self:center;">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Tickets powered by PassSpot
        </div>
      </div>`;
    container.appendChild(card);
  });
}
