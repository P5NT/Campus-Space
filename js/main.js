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
   ------------------------------------------------------------------------- */
const Theme = (() => {
  function apply(theme) {
    if (theme === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    Store.set("theme", theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      const icon = btn.querySelector("i");
      if (icon)
        icon.className =
          theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });
  }
  function init() {
    const saved = Store.get("theme", null);
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    apply(saved || (prefersDark ? "dark" : "light"));
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme-toggle]");
      if (!btn) return;
      const current =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light";
      apply(current === "dark" ? "light" : "dark");
    });
  }
  return { init, apply };
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
   Page init
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Modal.init();
  initDropdowns();
  initMobileMenu();
  initPasswordToggles();
  initExternalLinks();
  highlightActiveNav();

  // Start session timer only on pages that are inside the app shell
  if (document.body.classList.contains("has-session")) Session.start();

  // Demo: smooth initial page fade
  flashPageTransition();
});
