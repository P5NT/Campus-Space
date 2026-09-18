/* ==========================================================================
   CAMPUS SPACE — data/pending-announcements.js
   Leader-submitted messages awaiting Admin review. In the demo, stored in
   localStorage so submissions persist across reloads. This file seeds the
   initial (empty) state and provides the storage key.
   ========================================================================== */
"use strict";

const PENDING_ANNOUNCEMENTS_KEY = "pending_announcements";

/* Helper — read the pending queue */
function getPendingAnnouncements() {
  return Store.get(PENDING_ANNOUNCEMENTS_KEY, []) || [];
}

/* Helper — write the pending queue */
function savePendingAnnouncements(list) {
  Store.set(PENDING_ANNOUNCEMENTS_KEY, list);
}

/* Helper — add a pending submission */
function submitPendingAnnouncement(entry) {
  const list = getPendingAnnouncements();
  list.unshift(entry);
  savePendingAnnouncements(list);
  return entry;
}

/* Helper — remove a pending submission by id */
function removePendingAnnouncement(id) {
  const list = getPendingAnnouncements().filter((x) => x.id !== id);
  savePendingAnnouncements(list);
}
