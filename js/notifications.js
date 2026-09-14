/* ==========================================================================
   CAMPUS SPACE — notifications.js
   Frontend notification store and rendering helpers.
   ========================================================================== */
"use strict";

const Notifications = (() => {
  const DEFAULTS = [
    {
      id: "n001",
      type: "admin_post",
      icon: "fa-bullhorn",
      tone: "brand",
      title: "New Admin post",
      body: "Space Admin published a new announcement about course registration.",
      link: "announcements.html",
      time: Date.now() - 2 * 3600 * 1000,
      read: false,
    },
    {
      id: "n002",
      type: "academic_resource",
      icon: "fa-file-pdf",
      tone: "marine",
      title: "New Academic Resource Available",
      body: "A new Exam Timetable has been uploaded to Campus Space.",
      link: "exam-timetable.html",
      time: Date.now() - 24 * 3600 * 1000,
      read: false,
    },
    {
      id: "n003",
      type: "comment_reply",
      icon: "fa-comment-dots",
      tone: "success",
      title: "New reply to your post",
      body: "Chiamaka Okafor replied to your post in the Community.",
      link: "community.html",
      time: Date.now() - 2 * 24 * 3600 * 1000,
      read: false,
    },
    {
      id: "n004",
      type: "opportunity",
      icon: "fa-briefcase",
      tone: "marine",
      title: "New opportunity posted",
      body: "A new scholarship matching your department is now open for applications.",
      link: "opportunities.html",
      time: Date.now() - 3 * 24 * 3600 * 1000,
      read: true,
    },
    {
      id: "n005",
      type: "complaint_update",
      icon: "fa-file-shield",
      tone: "warning",
      title: "Your complaint status changed",
      body: 'Your complaint "Library noise levels" is now Under Review.',
      link: "complaints.html",
      time: Date.now() - 4 * 24 * 3600 * 1000,
      read: true,
    },
  ];

  function ensure() {
    let all = Store.get("notifications", null);
    if (!all) {
      all = DEFAULTS.slice();
      Store.set("notifications", all);
    }
    return all;
  }

  function all() {
    return ensure();
  }

  function unreadCount() {
    return ensure().filter((n) => !n.read).length;
  }

  function markRead(id) {
    const all = ensure();
    const idx = all.findIndex((n) => n.id === id);
    if (idx >= 0) {
      all[idx].read = true;
      Store.set("notifications", all);
    }
    syncBadge();
  }

  function markAllRead() {
    const all = ensure().map((n) => ({ ...n, read: true }));
    Store.set("notifications", all);
    syncBadge();
  }

  function syncBadge() {
    const count = unreadCount();
    Store.set("notif_unread", count);
    document.querySelectorAll(".badge-notif").forEach((el) => {
      if (count <= 0) el.remove();
      else el.textContent = count;
    });
  }

  function render(container) {
    if (!container) return;
    const all = ensure();
    container.innerHTML = "";
    if (!all.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-regular fa-bell"></i></div>
          <h3>You're all caught up</h3>
          <p>New activity — announcements, replies, and resource uploads — will appear here.</p>
        </div>`;
      return;
    }
    all.forEach((n) => {
      const el = document.createElement("div");
      el.className = "notif-item" + (n.read ? "" : " is-unread");
      el.tabIndex = 0;
      el.innerHTML = `
        <div class="notif-icon ${n.tone || "brand"}"><i class="fa-solid ${n.icon}"></i></div>
        <div class="notif-body">
          <h4>${Util.escape(n.title)}</h4>
          <p>${Util.escape(n.body)}</p>
          <time>${Util.relativeTime(n.time)}</time>
        </div>
        ${n.read ? "" : '<span class="notif-dot" aria-label="Unread"></span>'}`;
      const open = () => {
        markRead(n.id);
        el.classList.remove("is-unread");
        const dot = el.querySelector(".notif-dot");
        if (dot) dot.remove();
        if (n.link) window.location.href = n.link;
      };
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") open();
      });
      container.appendChild(el);
    });
  }

  return { all, unreadCount, markRead, markAllRead, render, syncBadge };
})();

document.addEventListener("DOMContentLoaded", () => {
  Notifications.syncBadge();
});
