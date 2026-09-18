/* ==========================================================================
   CAMPUS SPACE — main.js
   Core utilities: toasts, modals, dropdowns, theme, storage helpers,
   session inactivity, and shared page behaviour.
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   Storage helpers — safe wrappers around localStorage
   ------------------------------------------------------------------------- */
const Store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem("cs_" + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("cs_" + key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem("cs_" + key);
    } catch {}
  },
};

/* -------------------------------------------------------------------------
   Toast system
   ------------------------------------------------------------------------- */
const Toast = (() => {
  let stack;

  function ensureStack() {
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("role", "status");
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }

  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info",
  };

  function show(
    message,
    { title = "", type = "success", duration = 4200 } = {},
  ) {
    const s = ensureStack();
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
      <div class="toast-body">
        ${title ? `<h4>${title}</h4>` : ""}
        <p>${message}</p>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <i class="fa-solid fa-xmark"></i>
      </button>`;
    s.appendChild(el);

    const dismiss = () => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 220);
    };
    el.querySelector(".toast-close").addEventListener("click", dismiss);
    if (duration) setTimeout(dismiss, duration);
    return el;
  }

  return {
    show,
    success: (m, t) => show(m, { title: t, type: "success" }),
    error: (m, t) => show(m, { title: t, type: "error" }),
    warning: (m, t) => show(m, { title: t, type: "warning" }),
    info: (m, t) => show(m, { title: t, type: "info" }),
  };
})();

/* -------------------------------------------------------------------------
   Modal system
   Usage:
     Modal.open('modal-id');
     Modal.close('modal-id');
   Any element with [data-modal-close] inside a modal closes it.
   Any element with [data-modal-open="id"] opens the matching modal.
   ------------------------------------------------------------------------- */
const Modal = (() => {
  function open(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("is-open");
    document.body.style.overflow = "hidden";
    const focusable = m.querySelector(
      'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) setTimeout(() => focusable.focus(), 120);
    m._lastFocus = document.activeElement;
  }
  function close(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("is-open");
    document.body.style.overflow = "";
    if (m._lastFocus && m._lastFocus.focus) m._lastFocus.focus();
  }
  function init() {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-modal-open]");
      if (opener) {
        open(opener.getAttribute("data-modal-open"));
        return;
      }
      const closer = e.target.closest("[data-modal-close]");
      if (closer) {
        const parent = closer.closest(".modal-backdrop");
        if (parent) close(parent.id);
        return;
      }
      // backdrop click
      if (e.target.classList.contains("modal-backdrop")) close(e.target.id);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document
          .querySelectorAll(".modal-backdrop.is-open")
          .forEach((m) => close(m.id));
        document
          .querySelectorAll(".dropdown.is-open")
          .forEach((d) => d.classList.remove("is-open"));
      }
    });
  }
  return { open, close, init };
})();

/* -------------------------------------------------------------------------
   Confirmation dialog — reusable
   Confirmation.confirm({ title, message, confirmLabel, variant })
     returns a Promise<boolean>
   ------------------------------------------------------------------------- */
const Confirmation = (() => {
  let resolver = null;

  function ensure() {
    if (document.getElementById("cs-confirm")) return;
    const el = document.createElement("div");
    el.className = "modal-backdrop";
    el.id = "cs-confirm";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-head">
          <h3 id="cs-confirm-title">Are you sure?</h3>
          <button class="btn-icon" data-modal-close aria-label="Close dialog">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p id="cs-confirm-msg" class="text-secondary"></p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="cs-confirm-cancel">Cancel</button>
          <button class="btn btn-primary" id="cs-confirm-ok">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    el.querySelector("#cs-confirm-cancel").addEventListener("click", () =>
      resolve(false),
    );
    el.querySelector("[data-modal-close]").addEventListener("click", () =>
      resolve(false),
    );
    el.querySelector("#cs-confirm-ok").addEventListener("click", () =>
      resolve(true),
    );
    el.addEventListener("click", (e) => {
      if (e.target === el) resolve(false);
    });
  }

  function resolve(val) {
    const el = document.getElementById("cs-confirm");
    if (el) el.classList.remove("is-open");
    document.body.style.overflow = "";
    if (resolver) {
      resolver(val);
      resolver = null;
    }
  }

  function confirm(opts = {}) {
    ensure();
    const el = document.getElementById("cs-confirm");
    const title = opts.title || "Are you sure?";
    const message = opts.message || "This action cannot be undone.";
    const label = opts.confirmLabel || "Confirm";
    const variant = opts.variant || "primary";

    el.querySelector("#cs-confirm-title").textContent = title;
    el.querySelector("#cs-confirm-msg").textContent = message;
    const ok = el.querySelector("#cs-confirm-ok");
    ok.textContent = label;
    ok.className = "btn btn-" + (variant === "danger" ? "danger" : "primary");

    el.classList.add("is-open");
    document.body.style.overflow = "hidden";
    return new Promise((res) => {
      resolver = res;
    });
  }

  return { confirm };
})();

/* -------------------------------------------------------------------------
   Dropdown behaviour
   ------------------------------------------------------------------------- */
function initDropdowns() {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-dropdown]");
    if (trigger) {
      const parent = trigger.closest(".dropdown");
      const isOpen = parent.classList.contains("is-open");
      document
        .querySelectorAll(".dropdown.is-open")
        .forEach((d) => d.classList.remove("is-open"));
      if (!isOpen) {
        parent.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
      return;
    }
    if (!e.target.closest(".dropdown-menu")) {
      document.querySelectorAll(".dropdown.is-open").forEach((d) => {
        d.classList.remove("is-open");
        const t = d.querySelector("[data-dropdown]");
        if (t) t.setAttribute("aria-expanded", "false");
      });
    }
  });
}

/* -------------------------------------------------------------------------
   Theme handling
   Applies the light/dark theme, syncs the icon AND the toggle's on/off
   state, and persists the choice in localStorage.
   ------------------------------------------------------------------------- */
const Theme = (() => {
  function apply(theme) {
    if (theme === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    Store.set("theme", theme);

    var isDark = theme === "dark";

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      /* Update the icon */
      var icon = btn.querySelector("i");
      if (icon) {
        icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
      }
      /* Update the toggle's visual state */
      btn.setAttribute("aria-checked", isDark ? "true" : "false");
    });
  }

  function init() {
    var saved = Store.get("theme", null);
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    apply(saved || (prefersDark ? "dark" : "light"));

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-theme-toggle]");
      if (!btn) return;
      var current =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light";
      apply(current === "dark" ? "light" : "dark");
    });
  }

  return { init: init, apply: apply };
})();

/* -------------------------------------------------------------------------
   Mobile menu
   ------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------
   Mobile menu — open/close drawer.
   Uses event delegation on document, so it works even when the header
   (and its hamburger button) is rendered dynamically AFTER this runs.
   Safe to call multiple times.
   ------------------------------------------------------------------------- */
function initMobileMenu() {
  if (document._mobileMenuBound) return;
  document._mobileMenuBound = true;

  const open = () => {
    const backdrop = document.querySelector(".mobile-menu-backdrop");
    const menu = document.querySelector(".mobile-menu");
    if (backdrop) backdrop.classList.add("is-open");
    if (menu) menu.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    const backdrop = document.querySelector(".mobile-menu-backdrop");
    const menu = document.querySelector(".mobile-menu");
    if (backdrop) backdrop.classList.remove("is-open");
    if (menu) menu.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-mobile-menu-open]")) {
      open();
      return;
    }
    if (e.target.closest("[data-mobile-menu-close]")) {
      close();
      return;
    }
    if (e.target.classList.contains("mobile-menu-backdrop")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* -------------------------------------------------------------------------
   Session inactivity — 30 minutes
   Simulated client-side session timeout.
   ------------------------------------------------------------------------- */
const Session = (() => {
  const TIMEOUT = 30 * 60 * 1000; // 30 minutes
  let timer;
  const ACTIVITY = ["mousemove", "keydown", "click", "scroll", "touchstart"];

  function reset() {
    clearTimeout(timer);
    timer = setTimeout(expire, TIMEOUT);
  }
  function expire() {
    if (!Store.get("session")) return;
    Store.remove("session");
    Toast.warning(
      "Your session expired after 30 minutes of inactivity. Please sign in again.",
      "Session expired",
    );
    const depth = window.location.pathname.includes("/pages/") ? "../../" : "";
    setTimeout(() => {
      window.location.href = depth + "pages/auth/login.html?expired=1";
    }, 1200);
  }
  function start() {
    ACTIVITY.forEach((ev) =>
      window.addEventListener(ev, reset, { passive: true }),
    );
    reset();
  }
  function stop() {
    clearTimeout(timer);
    ACTIVITY.forEach((ev) => window.removeEventListener(ev, reset));
  }
  return { start, stop };
})();

/* -------------------------------------------------------------------------
   Utility helpers
   ------------------------------------------------------------------------- */
const Util = {
  // Format a date into a readable format
  formatDate(d, opts = { day: "numeric", month: "short", year: "numeric" }) {
    return new Date(d).toLocaleDateString("en-GB", opts);
  },
  // Relative time e.g. "2h ago"
  relativeTime(date) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
    return Util.formatDate(date);
  },
  // Initials for avatar fallback
  initials(name) {
    return (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  },
  // Escape HTML entities
  escape(str) {
    return String(str).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  },
  // Query helper
  qs: (sel, root = document) => root.querySelector(sel),
  qsa: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
};

/* -------------------------------------------------------------------------
   Password strength scoring
   ------------------------------------------------------------------------- */
function scorePassword(pw) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const met = Object.values(checks).filter(Boolean).length;
  let level = 0;
  if (met >= 2) level = 1;
  if (met >= 3) level = 2;
  if (met >= 4) level = 3;
  if (met === 5 && pw.length >= 10) level = 4;
  return { checks, level, met };
}

/* -------------------------------------------------------------------------
   Password visibility toggles
   ------------------------------------------------------------------------- */
function initPasswordToggles() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle-password]");
    if (!btn) return;
    const target = document.getElementById(
      btn.getAttribute("data-toggle-password"),
    );
    if (!target) return;
    const icon = btn.querySelector("i");
    if (target.type === "password") {
      target.type = "text";
      if (icon) icon.className = "fa-solid fa-eye-slash";
      btn.setAttribute("aria-label", "Hide password");
    } else {
      target.type = "password";
      if (icon) icon.className = "fa-solid fa-eye";
      btn.setAttribute("aria-label", "Show password");
    }
  });
}

/* -------------------------------------------------------------------------
   Active navigation highlighting based on current URL
   ------------------------------------------------------------------------- */
function highlightActiveNav() {
  const here = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((item) => {
    const href = item.getAttribute("href");
    if (!href) return;
    const target = href.split("/").pop().split("?")[0];
    if (target === here) item.classList.add("is-active");
  });
}

/* -------------------------------------------------------------------------
   Simulated network page transitions for demo "loading" feedback
   ------------------------------------------------------------------------- */
function flashPageTransition() {
  document.documentElement.style.opacity = "0";
  document.documentElement.style.transition = "opacity 160ms ease";
  requestAnimationFrame(() => {
    document.documentElement.style.opacity = "1";
  });
}

/* -------------------------------------------------------------------------
   Global click interception for demo "coming soon" external links
   marked with [data-external]
   ------------------------------------------------------------------------- */
function initExternalLinks() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-external]");
    if (!link) return;
    const url = link.getAttribute("href");
    if (!url || url === "#") {
      e.preventDefault();
      Toast.info(
        "This external platform opens in a new tab in the live product.",
        "External platform",
      );
    }
  });
}

/* -------------------------------------------------------------------------
   Avatar store — persisted in localStorage so the user's uploaded avatar
   is available to every page (header, sidebar, community, dashboard).
   Defined here (rather than in profile.js) so all pages can access it.
   ------------------------------------------------------------------------- */
const Avatar = {
  KEY: "user_avatar",
  get() {
    return Store.get(this.KEY, "");
  },
  set(dataUrl) {
    Store.set(this.KEY, dataUrl);
  },
  clear() {
    Store.remove(this.KEY);
  },

  // Apply the avatar to a given element (img or span fallback).
  applyTo(el, initials, size) {
    if (!el) return null;
    const url = this.get();
    if (!url) {
      if (el.tagName === "IMG") {
        const span = document.createElement("span");
        span.className = "avatar avatar-" + size + " avatar-fallback";
        span.setAttribute("data-avatar-slot", "");
        span.setAttribute("data-avatar-size", size);
        span.textContent = initials;
        el.replaceWith(span);
        return span;
      }
      return el;
    }
    if (el.tagName === "SPAN") {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.className = "avatar avatar-" + size;
      img.setAttribute("data-avatar-slot", "");
      img.setAttribute("data-avatar-size", size);
      el.replaceWith(img);
      return img;
    }
    el.src = url;
    return el;
  },
};

const Cover = {
  KEY: "user_cover",
  get() {
    return Store.get(this.KEY, "");
  },
  set(dataUrl) {
    Store.set(this.KEY, dataUrl);
  },
  clear() {
    Store.remove(this.KEY);
  },
};

/* -------------------------------------------------------------------------
   Global avatar sync — applies the saved avatar to every tagged slot
   in the app (header, sidebar, dashboard, etc.).
   ------------------------------------------------------------------------- */
function syncAvatarEverywhere() {
  const session = Auth.current();
  if (!session) return;

  const initials = Util.initials(session.name || session.username);

  document.querySelectorAll("[data-avatar-slot]").forEach((el) => {
    const size = el.getAttribute("data-avatar-size") || "40";
    Avatar.applyTo(el, initials, size);
  });

  // Also patch the standard header-profile and sidebar-user avatars
  document
    .querySelectorAll(".header-profile .avatar, .sidebar-user .avatar")
    .forEach((el) => {
      const size = el.classList.contains("avatar-32")
        ? "32"
        : el.classList.contains("avatar-40")
          ? "40"
          : "40";
      Avatar.applyTo(el, initials, size);
    });
}

/* ==========================================================================
   GLOBAL SEARCH — live suggestions in the header.
   Searches every dataset the student has access to, plus a static index
   of every page in the app.
   ========================================================================== */

/* Static page index — pages, nav items, and tools the student can access */
const SEARCH_PAGE_INDEX = [
  {
    title: "Dashboard",
    sub: "Your personal workspace",
    href: "dashboard.html",
    icon: "fa-gauge-high",
  },
  {
    title: "Academics",
    sub: "Academic hub",
    href: "academics.html",
    icon: "fa-book-open-reader",
  },
  {
    title: "Course Catalog",
    sub: "Browse all courses",
    href: "course-catalog.html",
    icon: "fa-book",
  },
  {
    title: "Course Materials",
    sub: "Lecture notes and courseware",
    href: "course-materials.html",
    icon: "fa-folder-open",
  },
  {
    title: "Past Questions",
    sub: "Revise with past papers",
    href: "past-questions.html",
    icon: "fa-file-pdf",
  },
  {
    title: "GPA Calculator",
    sub: "Calculate your semester GPA",
    href: "gpa-calculator.html",
    icon: "fa-calculator",
  },
  {
    title: "CGPA Calculator",
    sub: "Calculate your cumulative GPA",
    href: "cgpa-calculator.html",
    icon: "fa-chart-line",
  },
  {
    title: "Lecture Timetable",
    sub: "Your weekly lecture schedule",
    href: "lecture-timetable.html",
    icon: "fa-chalkboard",
  },
  {
    title: "Exam Timetable",
    sub: "Examination dates and venues",
    href: "exam-timetable.html",
    icon: "fa-file-signature",
  },
  {
    title: "Academic Calendar",
    sub: "Key session dates",
    href: "academic-calendar.html",
    icon: "fa-calendar-days",
  },
  {
    title: "Study Groups",
    sub: "Join a study group",
    href: "study-groups.html",
    icon: "fa-users",
  },
  {
    title: "Faculty Information",
    sub: "Faculties and departments",
    href: "faculty-information.html",
    icon: "fa-building-columns",
  },
  {
    title: "Department Information",
    sub: "Your department at a glance",
    href: "department-information.html",
    icon: "fa-diagram-project",
  },
  {
    title: "Course Representatives",
    sub: "Contact your course rep",
    href: "course-representatives.html",
    icon: "fa-user-graduate",
  },
  {
    title: "Community",
    sub: "Student feed and discussions",
    href: "community.html",
    icon: "fa-comments",
  },
  {
    title: "Campus News",
    sub: "Editorial coverage",
    href: "campus-news.html",
    icon: "fa-newspaper",
  },
  {
    title: "Announcements",
    sub: "Official announcements",
    href: "announcements.html",
    icon: "fa-bullhorn",
  },
  {
    title: "Opportunities",
    sub: "Scholarships, internships, jobs",
    href: "opportunities.html",
    icon: "fa-briefcase",
  },
  {
    title: "Events",
    sub: "Discover what is happening",
    href: "events.html",
    icon: "fa-ticket",
  },
  {
    title: "Marketplace",
    sub: "Buy and sell via Campus Plug",
    href: "marketplace.html",
    icon: "fa-store",
  },
  {
    title: "Student Leaders",
    sub: "Contact a verified leader",
    href: "student-leaders.html",
    icon: "fa-user-tie",
  },
  {
    title: "Complaints",
    sub: "Submit or track a complaint",
    href: "complaints.html",
    icon: "fa-file-shield",
  },
  {
    title: "Immediate Response",
    sub: "Emergency contacts",
    href: "immediate-response.html",
    icon: "fa-circle-exclamation",
  },
  {
    title: "Notifications",
    sub: "Your recent activity",
    href: "notifications.html",
    icon: "fa-bell",
  },
  {
    title: "Profile",
    sub: "Your account details",
    href: "profile.html",
    icon: "fa-user",
  },
  {
    title: "Settings",
    sub: "Account, privacy, security",
    href: "settings.html",
    icon: "fa-gear",
  },
  {
    title: "Help & Support",
    sub: "FAQs and contact",
    href: "help-support.html",
    icon: "fa-circle-question",
  },
];

function initHeaderSearch() {
  const input = document.getElementById("header-search-input");
  const suggest = document.getElementById("header-search-suggestions");
  const wrap = document.getElementById("header-search-wrap");
  if (!input || !suggest) return;

  if (input.dataset.searchBound === "true") return;
  input.dataset.searchBound = "true";

  let activeIndex = -1;

  function closeSuggest() {
    suggest.hidden = true;
    suggest.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  }

  function openSuggest() {
    suggest.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function has(q, ...fields) {
    for (const f of fields) {
      if (f && String(f).toLowerCase().includes(q)) return true;
    }
    return false;
  }

  function buildResults(query) {
    const results = [];
    const q = query.toLowerCase().trim();
    if (!q) return results;

    /* ---- Students (with leader tags if applicable) ---- */
    if (typeof DEMO_STUDENTS !== "undefined") {
      const leaderMap =
        typeof getLeaderList === "function"
          ? Object.fromEntries(getLeaderList().map((l) => [l.student.id, l]))
          : {};

      /* ---- Students (all registered students) ---- */
      if (typeof DEMO_STUDENTS !== "undefined") {
        const leaderMap =
          typeof getLeaderList === "function"
            ? Object.fromEntries(getLeaderList().map((l) => [l.student.id, l]))
            : {};

        DEMO_STUDENTS.forEach((s) => {
          if (s.status && s.status !== "active") return;

          const isLeader = !!leaderMap[s.id];

          if (!isLeader && s.searchable === false) return;

          const full = [s.firstName, s.otherName, s.lastName]
            .filter(Boolean)
            .join(" ");
          if (!has(q, full, s.username, s.matric, s.department, s.faculty))
            return;

          const currentSession =
            typeof Auth !== "undefined" ? Auth.current() : null;
          const isSelf =
            currentSession && currentSession.username === s.username;

          const tag = isLeader
            ? leaderMap[s.id].assoc.acronym + " - " + leaderMap[s.id].pos.name
            : s.association || "";

          results.push({
            type: isSelf ? "You" : isLeader ? "Leader" : "Student",
            icon: isSelf
              ? "fa-user-circle"
              : isLeader
                ? "fa-user-tie"
                : "fa-user",
            title: full,
            subtitle:
              "@" + s.username + " - " + s.department + " - " + s.level + "L",
            tag: tag,
            href: isSelf
              ? "profile.html"
              : isLeader
                ? "leader-profile.html?id=" + s.id
                : "student-profile.html?id=" + s.id,
          });
        });
      }
    }

    /* ---- Courses ---- */
    if (typeof DEMO_COURSES !== "undefined") {
      DEMO_COURSES.forEach((c) => {
        if (!has(q, c.code, c.title, c.lecturer, c.department)) return;
        results.push({
          type: "Course",
          icon: "fa-book",
          title: c.code + " — " + c.title,
          subtitle: c.department + " · " + c.units + " units",
          href: "course-details.html?id=" + c.id,
        });
      });
    }

    /* ---- Academic Resources (timetables, materials, past questions) ---- */
    if (typeof DEMO_RESOURCES !== "undefined") {
      DEMO_RESOURCES.forEach((r) => {
        if (!has(q, r.name, r.course, r.category, r.department)) return;
        results.push({
          type: "Resource",
          icon: "fa-file-lines",
          title: r.name,
          subtitle: r.category + " · " + (r.course || "General"),
          href: "course-materials.html",
        });
      });
    }

    /* ---- Opportunities ---- */
    if (typeof DEMO_OPPORTUNITIES !== "undefined") {
      DEMO_OPPORTUNITIES.forEach((o) => {
        if (!has(q, o.title, o.organization, o.category, o.summary)) return;
        results.push({
          type: "Opportunity",
          icon: "fa-briefcase",
          title: o.title,
          subtitle: o.organization + " · " + o.category,
          href: "opportunity-details.html?id=" + o.id,
        });
      });
    }

    /* ---- Events ---- */
    if (typeof DEMO_EVENTS !== "undefined") {
      DEMO_EVENTS.forEach((e) => {
        if (!has(q, e.title, e.organizer, e.category, e.location)) return;
        results.push({
          type: "Event",
          icon: "fa-ticket",
          title: e.title,
          subtitle: e.organizer + " · " + e.date,
          href: "events.html",
        });
      });
    }

    /* ---- News ---- */
    if (typeof DEMO_NEWS !== "undefined") {
      DEMO_NEWS.forEach((n) => {
        if (!has(q, n.title, n.excerpt, n.category, n.author)) return;
        results.push({
          type: "News",
          icon: "fa-newspaper",
          title: n.title,
          subtitle: n.category + " · " + Util.formatDate(n.date),
          href: "news-details.html?id=" + n.id,
        });
      });
    }

    /* ---- Announcements ---- */
    if (typeof DEMO_ANNOUNCEMENTS !== "undefined") {
      DEMO_ANNOUNCEMENTS.forEach((a) => {
        if (!has(q, a.title, a.body, a.author, a.affected)) return;
        results.push({
          type: "Announcement",
          icon: "fa-bullhorn",
          title: a.title,
          subtitle:
            Util.formatDate(a.date) + (a.affected ? " · " + a.affected : ""),
          href: "announcements.html",
        });
      });
    }

    /* ---- Community Posts ---- */
    if (
      typeof Community !== "undefined" &&
      typeof Community.all === "function"
    ) {
      Community.all().forEach((p) => {
        if (!has(q, p.text, p.author, p.handle, p.tag)) return;
        results.push({
          type: "Post",
          icon: "fa-comments",
          title: p.author + " · @" + p.handle,
          subtitle: p.text.slice(0, 90) + (p.text.length > 90 ? "…" : ""),
          href: "post-details.html?id=" + p.id,
        });
      });
    }

    /* ---- Pages / Navigation ---- */
    SEARCH_PAGE_INDEX.forEach((p) => {
      if (!has(q, p.title, p.sub)) return;
      results.push({
        type: "Page",
        icon: p.icon,
        title: p.title,
        subtitle: p.sub,
        href: p.href,
      });
    });

    return results.slice(0, 10);
  }

  function renderSuggest(query) {
    const results = buildResults(query);
    activeIndex = -1;

    if (!query.trim()) {
      suggest.innerHTML =
        '<div class="search-suggest-hint">' +
        '<i class="fa-solid fa-magnifying-glass"></i>' +
        "<span>Search students, courses, leaders, events, pages and more…</span>" +
        "</div>";
      openSuggest();
      return;
    }

    if (!results.length) {
      suggest.innerHTML =
        '<div class="search-suggest-empty">' +
        '<i class="fa-solid fa-circle-question"></i>' +
        "<div>" +
        '<div class="search-suggest-empty-title">No results for "' +
        Util.escape(query) +
        '"</div>' +
        '<div class="search-suggest-empty-sub">Try a different name, course code or keyword</div>' +
        "</div>" +
        "</div>";
      openSuggest();
      return;
    }

    suggest.innerHTML =
      results
        .map(function (r, i) {
          var tagHtml = r.tag
            ? '<span class="search-suggest-tag"><i class="fa-solid fa-circle-check"></i> ' +
              Util.escape(r.tag) +
              "</span>"
            : "";
          return (
            '<a class="search-suggest-item" href="' +
            r.href +
            '" role="option" data-index="' +
            i +
            '">' +
            '<span class="search-suggest-icon"><i class="fa-solid ' +
            r.icon +
            '"></i></span>' +
            '<span class="search-suggest-body">' +
            '<span class="search-suggest-title">' +
            Util.escape(r.title) +
            "</span>" +
            '<span class="search-suggest-sub">' +
            Util.escape(r.subtitle) +
            "</span>" +
            tagHtml +
            "</span>" +
            '<span class="search-suggest-type">' +
            Util.escape(r.type) +
            "</span>" +
            "</a>"
          );
        })
        .join("") +
      '<a class="search-suggest-all" href="search.html?q=' +
      encodeURIComponent(query) +
      '">' +
      '<i class="fa-solid fa-arrow-right"></i>' +
      'View all results for "' +
      Util.escape(query) +
      '"' +
      "</a>";
    openSuggest();
  }

  input.addEventListener("input", function () {
    renderSuggest(input.value);
  });
  input.addEventListener("focus", function () {
    renderSuggest(input.value);
  });

  input.addEventListener("keydown", function (e) {
    const items = suggest.querySelectorAll(".search-suggest-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      items.forEach(function (el, i) {
        el.classList.toggle("is-active", i === activeIndex);
      });
      if (items[activeIndex])
        items[activeIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      items.forEach(function (el, i) {
        el.classList.toggle("is-active", i === activeIndex);
      });
      if (items[activeIndex])
        items[activeIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        items[activeIndex].click();
      } else if (input.value.trim()) {
        e.preventDefault();
        window.location.href =
          "search.html?q=" + encodeURIComponent(input.value.trim());
      }
    } else if (e.key === "Escape") {
      closeSuggest();
      input.blur();
    }
  });

  /* Submit button — navigates to the full search page with the current query */
  const submitBtn = document.getElementById("header-search-submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const q = input.value.trim();
      if (!q) {
        input.focus();
        return;
      }
      window.location.href = "search.html?q=" + encodeURIComponent(q);
    });
  }

  document.addEventListener("click", function (e) {
    if (wrap && !wrap.contains(e.target)) closeSuggest();
  });
  suggest.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  });
}

/* Also: capture the Enter key via the form wrapper if present */

/* -------------------------------------------------------------------------
   Mobile search button
   ------------------------------------------------------------------------- */
function initSearchButtons() {
  if (document._searchButtonsBound) return;
  document._searchButtonsBound = true;

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-search-open], #header-search-mobile");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const input = document.getElementById("header-search-input");
    const wrap = document.getElementById("header-search-wrap");

    if (wrap && input) {
      wrap.classList.add("is-open");
      input.focus();
      if (input.select) input.select();

      const collapse = function (ev) {
        if (!wrap.contains(ev.target)) {
          wrap.classList.remove("is-open");
          document.removeEventListener("click", collapse);
        }
      };
      setTimeout(function () {
        document.addEventListener("click", collapse);
      }, 50);
      return;
    }

    window.location.href = "search.html";
  });
}

/* ==========================================================================
   CUSTOM DROPDOWN (SELECT) — replaces native <select class="select">
   Provides a themed dropdown list with keyboard support, focus states,
   and mobile-friendly interaction.
   ========================================================================== */
function initCustomSelects() {
  document.querySelectorAll("select.select").forEach(function (nativeSelect) {
    if (nativeSelect.dataset.customized === "true") return;
    nativeSelect.dataset.customized = "true";

    // Build the visual wrapper
    var wrapper = document.createElement("div");
    wrapper.className = "cselect";

    // Trigger button
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cselect-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    if (nativeSelect.id) {
      // Associate the label with the trigger for accessibility
      trigger.id = nativeSelect.id + "-trigger";
      var lbl = document.querySelector('label[for="' + nativeSelect.id + '"]');
      if (lbl) lbl.setAttribute("for", trigger.id);
    }

    var triggerText = document.createElement("span");
    triggerText.className = "cselect-text";

    var triggerIcon = document.createElement("i");
    triggerIcon.className = "fa-solid fa-chevron-down cselect-icon";

    trigger.appendChild(triggerText);
    trigger.appendChild(triggerIcon);

    // The custom list
    var list = document.createElement("div");
    list.className = "cselect-list";
    list.setAttribute("role", "listbox");

    // Copy options
    var options = Array.prototype.slice.call(nativeSelect.options);
    options.forEach(function (opt, idx) {
      var item = document.createElement("div");
      item.className = "cselect-option";
      item.setAttribute("role", "option");
      item.setAttribute("data-value", opt.value);
      item.tabIndex = -1;
      item.textContent = opt.textContent;
      if (opt.selected || nativeSelect.value === opt.value) {
        item.classList.add("is-selected");
      }
      list.appendChild(item);
    });

    // Assemble the wrapper
    wrapper.appendChild(trigger);
    wrapper.appendChild(list);

    // Insert wrapper right after the native select, then hide the select
    nativeSelect.parentNode.insertBefore(wrapper, nativeSelect.nextSibling);
    nativeSelect.classList.add("cselect-native");

    // ---- Sync helper: reflects the current value into the trigger text ----
    function updateTriggerText() {
      var sel = nativeSelect.options[nativeSelect.selectedIndex];
      triggerText.textContent = sel ? sel.textContent : "";
      list.querySelectorAll(".cselect-option").forEach(function (el) {
        el.classList.toggle(
          "is-selected",
          el.getAttribute("data-value") === nativeSelect.value,
        );
      });
    }
    updateTriggerText();

    // ---- Open / close ----
    function open() {
      // Close any other open cselects
      document.querySelectorAll(".cselect.is-open").forEach(function (other) {
        if (other !== wrapper) other.classList.remove("is-open");
      });
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      // Scroll the selected item into view
      var sel = list.querySelector(".cselect-option.is-selected");
      if (sel) sel.scrollIntoView({ block: "nearest" });
    }
    function close() {
      wrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    function toggle() {
      if (wrapper.classList.contains("is-open")) close();
      else open();
    }

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    // Option selection
    list.addEventListener("click", function (e) {
      var opt = e.target.closest(".cselect-option");
      if (!opt) return;
      e.preventDefault();
      e.stopPropagation();
      nativeSelect.value = opt.getAttribute("data-value");
      // Fire change event so listeners on the native select still work
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      updateTriggerText();
      close();
      trigger.focus();
    });

    // Keyboard support
    wrapper.addEventListener("keydown", function (e) {
      var isOpen = wrapper.classList.contains("is-open");
      var currentIdx = options.findIndex(function (o) {
        return o.value === nativeSelect.value;
      });

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        var next = Math.min(currentIdx + 1, options.length - 1);
        nativeSelect.selectedIndex = next;
        updateTriggerText();
        nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        var prev = Math.max(currentIdx - 1, 0);
        nativeSelect.selectedIndex = prev;
        updateTriggerText();
        nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!isOpen) open();
        else {
          var sel = list.querySelector(".cselect-option.is-selected");
          if (sel) sel.click();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Home") {
        e.preventDefault();
        nativeSelect.selectedIndex = 0;
        updateTriggerText();
      } else if (e.key === "End") {
        e.preventDefault();
        nativeSelect.selectedIndex = options.length - 1;
        updateTriggerText();
      }
    });

    // External updates to nativeSelect.value reflect back
    nativeSelect.addEventListener("change", updateTriggerText);

    // Click outside closes
    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) close();
    });
  });
}

/* -------------------------------------------------------------------------
   Page init
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Modal.init();
  initDropdowns();
  initMobileMenu();
  initPasswordToggles();
  initExternalLinks();
  initCustomSelects();
  highlightActiveNav();

  // Start session timer only on pages that are inside the app shell
  if (document.body.classList.contains("has-session")) Session.start();

  // Demo: smooth initial page fade
  flashPageTransition();
});
