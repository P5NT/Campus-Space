/* ==========================================================================
   CAMPUS SPACE — notifications.js
   Session-aware notification store, emitter, and rendering helpers.

   Every notification carries an "audience" descriptor:
     audience: { usernames: ['akinola'], roles: ['students', 'admins'] }

   Role matching accepts both plural group names (preferred for writing
   broadcasts) and singular session roles:
     'students'      ↔ 'student'
     'admins'        ↔ 'admin'
     'super_admins'  ↔ 'super_admin'
     'academia'      ↔ 'academia'       (same)
     'su_pro'        ↔ 'su_pro'         (same)

   Super Admin does NOT inherit 'admins' broadcasts (strict by design).
   Read state is per-user via readBy (array of usernames).

   Dedupe signature includes:
     type + link + audience + actorUsername
   so two different actors firing the same event produce two notifications,
   while the same actor firing twice within the window collapses into one.
   ========================================================================== */
"use strict";

const Notifications = (() => {
  const STORE_KEY = "notifications";
  const BADGE_KEY = "notif_unread";
  const DEDUPE_WINDOW_MS = 30 * 1000;

  /* ------------------------------------------------------------------
     ROLE ALIASES — normalize both sides so group names and session
     roles match cleanly.
     ------------------------------------------------------------------ */
  const ROLE_ALIASES = {
    /* plural (group) → canonical singular */
    students: "student",
    admins: "admin",
    super_admins: "super_admin",
    /* already singular → identity */
    student: "student",
    admin: "admin",
    super_admin: "super_admin",
    academia: "academia",
    su_pro: "su_pro",
  };

  function canonicalRole(role) {
    if (!role) return "";
    const key = String(role).toLowerCase().trim();
    return ROLE_ALIASES[key] || key;
  }

  /* ------------------------------------------------------------------
     SEED NOTIFICATIONS (demo placeholders, broadcast to everyone)
     ------------------------------------------------------------------ */
  const DEFAULTS = [
    {
      id: "n001",
      type: "admin_post",
      icon: "fa-bullhorn",
      tone: "brand",
      title: "New Admin post",
      body: "Space Admin published a new announcement about course registration.",
      link: "announcements.html",
      audience: {
        usernames: [],
        roles: ["students", "admins", "super_admins"],
      },
      readBy: [],
      time: Date.now() - 2 * 3600 * 1000,
    },
    {
      id: "n002",
      type: "academic_resource",
      icon: "fa-file-pdf",
      tone: "marine",
      title: "New Academic Resource Available",
      body: "A new Exam Timetable has been uploaded to Campus Space.",
      link: "exam-timetable.html",
      audience: {
        usernames: [],
        roles: ["students", "admins", "super_admins"],
      },
      readBy: [],
      time: Date.now() - 24 * 3600 * 1000,
    },
    {
      id: "n003",
      type: "comment_reply",
      icon: "fa-comment-dots",
      tone: "success",
      title: "New reply to your post",
      body: "Chiamaka Okafor replied to your post in the Community.",
      link: "community.html",
      audience: {
        usernames: [],
        roles: ["students", "admins", "super_admins"],
      },
      readBy: [],
      time: Date.now() - 2 * 24 * 3600 * 1000,
    },
    {
      id: "n004",
      type: "opportunity",
      icon: "fa-briefcase",
      tone: "marine",
      title: "New opportunity posted",
      body: "A new scholarship matching your department is now open for applications.",
      link: "opportunities.html",
      audience: {
        usernames: [],
        roles: ["students", "admins", "super_admins"],
      },
      readBy: [],
      time: Date.now() - 3 * 24 * 3600 * 1000,
    },
    {
      id: "n005",
      type: "complaint_update",
      icon: "fa-file-shield",
      tone: "warning",
      title: "Your complaint status changed",
      body: 'Your complaint "Library noise levels" is now Under Review.',
      link: "complaints.html",
      audience: {
        usernames: [],
        roles: ["students", "admins", "super_admins"],
      },
      readBy: [],
      time: Date.now() - 4 * 24 * 3600 * 1000,
    },
  ];

  /* ------------------------------------------------------------------
     MIGRATION
     ------------------------------------------------------------------ */
  function migrate(entry) {
    if (!entry) return entry;

    if (!entry.audience || typeof entry.audience !== "object") {
      entry.audience = {
        usernames: [],
        roles: ["students", "admins", "super_admins"],
      };
    }
    if (!Array.isArray(entry.audience.usernames)) entry.audience.usernames = [];
    if (!Array.isArray(entry.audience.roles)) entry.audience.roles = [];

    if (!Array.isArray(entry.readBy)) {
      entry.readBy = [];
      if (entry.read === true) {
        const s = getSession();
        if (s && s.username) entry.readBy.push(s.username);
      }
    }

    delete entry.read;
    return entry;
  }

  /* ------------------------------------------------------------------
     SESSION HELPER
     ------------------------------------------------------------------ */
  function getSession() {
    try {
      if (typeof Auth !== "undefined" && typeof Auth.current === "function") {
        return Auth.current();
      }
    } catch (e) {
      /* ignore */
    }
    try {
      return Store.get("session", null);
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------------
     STORE ACCESS
     ------------------------------------------------------------------ */
  function ensure() {
    let list = Store.get(STORE_KEY, null);
    if (!Array.isArray(list)) {
      list = DEFAULTS.map((d) => JSON.parse(JSON.stringify(d)));
      Store.set(STORE_KEY, list);
      return list;
    }
    let mutated = false;
    list.forEach((entry) => {
      const before = JSON.stringify(entry);
      migrate(entry);
      const after = JSON.stringify(entry);
      if (before !== after) mutated = true;
    });
    if (mutated) Store.set(STORE_KEY, list);
    return list;
  }

  function persist(list) {
    Store.set(STORE_KEY, list);
  }

  /* ------------------------------------------------------------------
     AUDIENCE MATCHING
     ------------------------------------------------------------------ */
  function visibleTo(notification, session) {
    if (!notification || !session) return false;
    const aud = notification.audience || {};
    const usernames = Array.isArray(aud.usernames) ? aud.usernames : [];
    const roles = Array.isArray(aud.roles) ? aud.roles : [];

    if (usernames.indexOf(session.username) !== -1) return true;

    const canonicalSession = canonicalRole(session.role);
    for (let i = 0; i < roles.length; i++) {
      if (canonicalRole(roles[i]) === canonicalSession) return true;
    }

    return false;
  }

  /* ------------------------------------------------------------------
     PUBLIC READ API
     ------------------------------------------------------------------ */
  function all() {
    const session = getSession();
    if (!session) return [];
    return ensure()
      .filter((n) => visibleTo(n, session))
      .sort((a, b) => (b.time || 0) - (a.time || 0));
  }

  function unreadCount() {
    const session = getSession();
    if (!session) return 0;
    return ensure().filter(
      (n) => visibleTo(n, session) && !isReadBy(n, session.username),
    ).length;
  }

  function isReadBy(notification, username) {
    if (!notification || !Array.isArray(notification.readBy)) return false;
    return notification.readBy.indexOf(username) !== -1;
  }

  /* ------------------------------------------------------------------
     READ STATE MUTATIONS
     ------------------------------------------------------------------ */
  function markRead(id) {
    const session = getSession();
    if (!session) return;
    const list = ensure();
    const entry = list.find((n) => n.id === id);
    if (!entry) return;
    if (!visibleTo(entry, session)) return;
    if (!Array.isArray(entry.readBy)) entry.readBy = [];
    if (entry.readBy.indexOf(session.username) === -1) {
      entry.readBy.push(session.username);
      persist(list);
    }
    syncBadge();
  }

  function markAllRead() {
    const session = getSession();
    if (!session) return;
    const list = ensure();
    let mutated = false;
    list.forEach((entry) => {
      if (!visibleTo(entry, session)) return;
      if (!Array.isArray(entry.readBy)) entry.readBy = [];
      if (entry.readBy.indexOf(session.username) === -1) {
        entry.readBy.push(session.username);
        mutated = true;
      }
    });
    if (mutated) persist(list);
    syncBadge();
  }

  /* ------------------------------------------------------------------
     BADGE SYNC
     ------------------------------------------------------------------ */
  function syncBadge() {
    const count = unreadCount();
    Store.set(BADGE_KEY, count);
    document.querySelectorAll(".badge-notif").forEach((el) => {
      if (count <= 0) el.remove();
      else el.textContent = count > 99 ? "99+" : String(count);
    });
  }

  /* ------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------ */
  function render(container) {
    if (!container) return;
    const session = getSession();
    container.innerHTML = "";

    if (!session) {
      container.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon"><i class="fa-regular fa-bell"></i></div>' +
        "<h3>Sign in to view notifications</h3>" +
        "</div>";
      return;
    }

    const list = all();

    if (!list.length) {
      container.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon"><i class="fa-regular fa-bell"></i></div>' +
        "<h3>You're all caught up</h3>" +
        "<p>New activity — announcements, replies, and resource uploads — will appear here.</p>" +
        "</div>";
      return;
    }

    list.forEach((n) => {
      const isUnread = !isReadBy(n, session.username);
      const el = document.createElement("div");
      el.className = "notif-item" + (isUnread ? " is-unread" : "");
      el.tabIndex = 0;
      el.innerHTML =
        '<div class="notif-icon ' +
        (n.tone || "brand") +
        '"><i class="fa-solid ' +
        (n.icon || "fa-bell") +
        '"></i></div>' +
        '<div class="notif-body">' +
        "<h4>" +
        Util.escape(n.title || "") +
        "</h4>" +
        "<p>" +
        Util.escape(n.body || "") +
        "</p>" +
        "<time>" +
        Util.relativeTime(n.time) +
        "</time>" +
        "</div>" +
        (isUnread ? '<span class="notif-dot" aria-label="Unread"></span>' : "");

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

  /* ------------------------------------------------------------------
     EMIT — the single API every module uses to create a notification.

     Dedupe signature includes:
       type + link + audience + actorUsername

     This means:
       - Two different actors firing the same event → two notifications
       - The same actor firing the same event within 30 seconds → one
     ------------------------------------------------------------------ */
  function emit(payload) {
    if (!payload || typeof payload !== "object") return null;

    const audience = payload.audience || {};
    const usernames = Array.isArray(audience.usernames)
      ? audience.usernames.slice()
      : [];
    const roles = Array.isArray(audience.roles) ? audience.roles.slice() : [];

    if (!usernames.length && !roles.length) {
      /* eslint-disable-next-line no-console */
      console.warn(
        "[Notifications.emit] dropped — no audience provided",
        payload,
      );
      return null;
    }

    /* Never let a user notify themselves — strip the actor if provided */
    if (payload.actorUsername) {
      const idx = usernames.indexOf(payload.actorUsername);
      if (idx !== -1) usernames.splice(idx, 1);
      if (!usernames.length && !roles.length) return null;
    }

    /* Deduplication signature */
    const now = Date.now();
    const list = ensure();
    const actor = payload.actorUsername || "";
    const signature = JSON.stringify({
      type: payload.type || "",
      link: payload.link || "",
      usernames: usernames.slice().sort(),
      roles: roles.slice().sort(),
      actor: actor,
    });
    const duplicate = list.find((entry) => {
      if (!entry) return false;
      if (now - (entry.time || 0) > DEDUPE_WINDOW_MS) return false;
      const aud = entry.audience || {};
      const sig = JSON.stringify({
        type: entry.type || "",
        link: entry.link || "",
        usernames: (aud.usernames || []).slice().sort(),
        roles: (aud.roles || []).slice().sort(),
        actor: entry.actorUsername || "",
      });
      return sig === signature;
    });
    if (duplicate) {
      duplicate.time = now;
      persist(list);
      syncBadge();
      return duplicate;
    }

    const entry = {
      id: "n-" + now + "-" + Math.floor(Math.random() * 10000),
      type: payload.type || "general",
      icon: payload.icon || "fa-bell",
      tone: payload.tone || "brand",
      title: payload.title || "New notification",
      body: payload.body || "",
      link: payload.link || "",
      audience: { usernames: usernames, roles: roles },
      actorUsername: actor,
      readBy: [],
      time: now,
    };

    list.unshift(entry);
    persist(list);
    syncBadge();
    return entry;
  }

  /* ------------------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------------------ */
  return {
    all,
    unreadCount,
    markRead,
    markAllRead,
    render,
    syncBadge,
    emit,
    _visibleTo: visibleTo,
    _migrate: migrate,
    _canonicalRole: canonicalRole,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  Notifications.syncBadge();
});
