/* ==========================================================================
   CAMPUS SPACE — navigation.js
   Sidebar, header and mobile navigation logic for authenticated pages.
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   Primary sidebar navigation structure for student pages
   ------------------------------------------------------------------------- */
const STUDENT_NAV = [
  {
    group: "Main",
    items: [
      { href: "dashboard.html", icon: "fa-gauge-high", label: "Dashboard" },
      {
        href: "academics.html",
        icon: "fa-book-open-reader",
        label: "Academics",
      },
      { href: "community.html", icon: "fa-comments", label: "Community" },
    ],
  },
  {
    group: "Discover",
    items: [
      { href: "campus-news.html", icon: "fa-newspaper", label: "Campus News" },
      {
        href: "announcements.html",
        icon: "fa-bullhorn",
        label: "Announcements",
      },
      {
        href: "opportunities.html",
        icon: "fa-briefcase",
        label: "Opportunities",
      },
      { href: "events.html", icon: "fa-ticket", label: "Events" },
      { href: "marketplace.html", icon: "fa-store", label: "Marketplace" },
    ],
  },
  {
    group: "Support",
    items: [
      {
        href: "student-leaders.html",
        icon: "fa-user-tie",
        label: "Student Leaders",
      },
      { href: "complaints.html", icon: "fa-file-shield", label: "Complaints" },
    ],
  },
  {
    group: "Account",
    items: [
      { href: "profile.html", icon: "fa-user", label: "Profile" },
      { href: "settings.html", icon: "fa-gear", label: "Settings" },
      {
        href: "help-support.html",
        icon: "fa-circle-question",
        label: "Help & Support",
      },
    ],
  },
];

const ADMIN_NAV = [
  {
    group: "Overview",
    items: [
      {
        href: "dashboard.html",
        icon: "fa-gauge-high",
        label: "Admin Dashboard",
      },
      {
        href: "registered-students.html",
        icon: "fa-users",
        label: "Registered Students",
      },
    ],
  },
  {
    group: "Academics",
    items: [
      {
        href: "faculties.html",
        icon: "fa-building-columns",
        label: "Faculties",
      },
      {
        href: "departments.html",
        icon: "fa-diagram-project",
        label: "Departments",
      },
      {
        href: "academic-resources.html",
        icon: "fa-file-lines",
        label: "Academic Resources",
      },
      {
        href: "academic-calendar.html",
        icon: "fa-calendar-days",
        label: "Academic Calendar",
      },
    ],
  },
  {
    group: "Community",
    items: [
      {
        href: "student-associations.html",
        icon: "fa-people-group",
        label: "Student Associations",
      },
      {
        href: "leadership-positions.html",
        icon: "fa-ranking-star",
        label: "Leadership Positions",
      },
      {
        href: "student-leaders.html",
        icon: "fa-user-tie",
        label: "Student Leaders",
      },
      {
        href: "moderation.html",
        icon: "fa-shield-halved",
        label: "Moderation & Reports",
      },
    ],
  },
  {
    group: "Content",
    items: [
      { href: "news.html", icon: "fa-newspaper", label: "News" },
      {
        href: "announcements.html",
        icon: "fa-bullhorn",
        label: "Announcements",
      },
      {
        href: "opportunities.html",
        icon: "fa-briefcase",
        label: "Opportunities",
      },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "complaints.html", icon: "fa-file-shield", label: "Complaints" },
      {
        href: "emergency-contacts.html",
        icon: "fa-shield-heart",
        label: "Emergency Contacts",
      },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "complaints.html", icon: "fa-file-shield", label: "Complaints" },
      {
        href: "pending-announcements.html",
        icon: "fa-inbox",
        label: "Pending Announcements",
      }, // ← new
      {
        href: "emergency-contacts.html",
        icon: "fa-shield-heart",
        label: "Emergency Contacts",
      },
    ],
  },
];

/* -------------------------------------------------------------------------
   Avatar resolver — reads the user's saved avatar from localStorage
   (stored by profile.js when they upload a picture).
   Returns { url, initials } ready for rendering.
   ------------------------------------------------------------------------- */
function resolveAvatar(session) {
  const url = typeof Avatar !== "undefined" && Avatar.get ? Avatar.get() : "";
  const initials = Util.initials(
    (session && session.name) || (session && session.username) || "?",
  );
  return { url, initials };
}

/* -------------------------------------------------------------------------
   Build sidebar markup
   ------------------------------------------------------------------------- */
function buildSidebar(nav, { role, session }) {
  const roleBadge =
    role === "super_admin"
      ? '<span class="admin-badge super"><i class="fa-solid fa-crown"></i> Super Admin</span>'
      : '<span class="admin-badge"><i class="fa-solid fa-shield-halved"></i> Admin</span>';

  const navHtml = nav
    .map(
      (group) => `
    <div class="nav-group">
      <div class="nav-group-title">${group.group}</div>
      ${group.items
        .map(
          (item) => `
        <a class="nav-item" href="${item.href}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `,
        )
        .join("")}
    </div>
  `,
    )
    .join("");

  const { url: avatarUrl, initials } = resolveAvatar(session);

  const avatarHtml = avatarUrl
    ? `<img src="${avatarUrl}" alt="" class="avatar avatar-40">`
    : `<span class="avatar avatar-40 avatar-fallback">${initials}</span>`;

  return `
    <a href="dashboard.html" class="sidebar-brand" aria-label="Campus Space home">
      <img src="../../assets/icons/brand-icon.svg" alt="" width="34" height="34">
      <span class="sidebar-brand-text">Campus Space</span>
    </a>

    <nav class="sidebar-nav" aria-label="Primary">
      ${role !== "student" ? `<div style="padding: 0 12px 8px;">${roleBadge}</div>` : ""}
      ${navHtml}

      <a href="immediate-response.html" class="nav-emergency">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>Immediate Response</span>
      </a>
    </nav>

    <div class="sidebar-foot">
      <div class="dropdown">
        <button class="sidebar-user" data-dropdown aria-haspopup="true" aria-expanded="false" style="width:100%;">
          ${avatarHtml}
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${Util.escape(session.name || session.username)}</div>
            <div class="sidebar-user-handle">@${Util.escape(session.username)}</div>
          </div>
          <i class="fa-solid fa-chevron-up" style="font-size:11px; color:var(--text-tertiary);"></i>
        </button>
        <div class="dropdown-menu" role="menu">
          <div class="dropdown-header">
            <h6>${Util.escape(session.name || session.username)}</h6>
            <p>@${Util.escape(session.username)}</p>
          </div>
          <a class="dropdown-item" href="profile.html" role="menuitem"><i class="fa-solid fa-user"></i> Profile</a>
          <a class="dropdown-item" href="settings.html" role="menuitem"><i class="fa-solid fa-gear"></i> Settings</a>
          <button class="dropdown-item" data-theme-toggle role="menuitem"><i class="fa-solid fa-moon"></i> Toggle theme</button>
          <hr class="dropdown-divider">
          <button class="dropdown-item is-danger" data-logout role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> Sign out</button>
        </div>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------------------
   Build header markup
   ------------------------------------------------------------------------- */
function buildHeader({ session }) {
  const notifCount = Store.get("notif_unread", 3);
  const { url: avatarUrl, initials } = resolveAvatar(session);
  const firstName = (session.name || session.username || "").split(" ")[0];

  const avatarHtml = avatarUrl
    ? `<img src="${avatarUrl}" alt="" class="avatar avatar-32">`
    : `<span class="avatar avatar-32 avatar-fallback">${initials}</span>`;

  return `
    <button class="btn-icon header-brand-mobile" data-mobile-menu-open aria-label="Open menu">
      <i class="fa-solid fa-bars"></i>
    </button>
    <a href="dashboard.html" class="header-brand-mobile" aria-label="Campus Space home" style="text-decoration:none;">
      <img src="../../assets/icons/brand-icon.svg" alt="" width="28" height="28">
    </a>

    <div class="header-search" id="header-search-wrap">
      <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
      <input class="input" type="search" placeholder="Search Campus Space…" aria-label="Search" id="header-search-input" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="header-search-suggestions" aria-autocomplete="list">
      <button type="button" class="header-search-submit" id="header-search-submit" aria-label="Submit search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <span>Search</span>
    </button>
      <div class="search-suggest" id="header-search-suggestions" role="listbox" hidden></div>
    </div>

    <div class="header-actions">
      <button type="button" class="btn-icon header-search-btn" aria-label="Search" id="header-search-mobile" data-search-open>
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      </button>
      <a href="notifications.html" class="btn-icon" aria-label="Notifications">
        <i class="fa-regular fa-bell"></i>
        ${notifCount > 0 ? `<span class="badge-notif">${notifCount}</span>` : ""}
      </a>
      <div class="dropdown">
        <button class="header-profile" data-dropdown aria-haspopup="true" aria-expanded="false">
          ${avatarHtml}
          <span>${Util.escape(firstName)}</span>
        </button>
        <div class="dropdown-menu" role="menu">
          <div class="dropdown-header">
            <h6>${Util.escape(session.name || session.username)}</h6>
            <p>@${Util.escape(session.username)}</p>
          </div>
          <a class="dropdown-item" href="profile.html" role="menuitem"><i class="fa-solid fa-user"></i> View profile</a>
          <a class="dropdown-item" href="settings.html" role="menuitem"><i class="fa-solid fa-gear"></i> Settings</a>
          <hr class="dropdown-divider">
          <button class="dropdown-item is-danger" data-logout role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> Sign out</button>
        </div>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------------------
   Build mobile bottom navigation
   ------------------------------------------------------------------------- */
function buildMobileNav() {
  return `
    <div class="mobile-bottom-nav" role="navigation" aria-label="Mobile primary">
      <div class="mobile-bottom-nav-inner">
        <a href="dashboard.html" class="mobile-nav-item">
          <i class="fa-solid fa-house"></i><span>Home</span>
        </a>
        <a href="academics.html" class="mobile-nav-item">
          <i class="fa-solid fa-book-open-reader"></i><span>Academics</span>
        </a>
        <a href="immediate-response.html" class="mobile-nav-item emergency" aria-label="Immediate Response">
          <i class="fa-solid fa-circle-exclamation"></i><span>Emergency</span>
        </a>
        <a href="community.html" class="mobile-nav-item">
          <i class="fa-solid fa-comments"></i><span>Community</span>
        </a>
        <button class="mobile-nav-item" data-mobile-menu-open aria-label="Open menu">
          <i class="fa-solid fa-bars"></i><span>Menu</span>
        </button>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------------------
   Mount the full app shell (sidebar + header + mobile nav + drawer)
   Called by each authenticated page via initAppShell(role)
   ------------------------------------------------------------------------- */
function initAppShell(role = "student") {
  const session = Auth.current();
  if (!session) return;

  const nav = role === "student" ? STUDENT_NAV : ADMIN_NAV;

  // Sidebar
  const sidebarEl = document.getElementById("app-sidebar");
  if (sidebarEl)
    sidebarEl.innerHTML = buildSidebar(nav, { role: session.role, session });

  // Header
  const headerEl = document.getElementById("app-header");
  if (headerEl) headerEl.innerHTML = buildHeader({ session });

  // Mobile bottom nav (student only)
  if (role === "student") {
    const wrap = document.getElementById("mobile-nav-mount");
    if (wrap) wrap.innerHTML = buildMobileNav();
  }

  // Mobile menu drawer
  const menuEl = document.getElementById("mobile-menu-mount");
  if (menuEl) {
    menuEl.innerHTML = `
      <div class="mobile-menu-head">
        <div class="cluster">
          <img src="../../assets/icons/brand-icon.svg" alt="" width="30" height="30">
          <strong style="font-family:var(--font-heading);">Campus Space</strong>
        </div>
        <button class="btn-icon" data-mobile-menu-close aria-label="Close menu">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div style="padding:16px;">
        ${nav
          .map(
            (g) => `
          <div class="nav-group">
            <div class="nav-group-title">${g.group}</div>
            ${g.items
              .map(
                (item) => `
              <a class="nav-item" href="${item.href}">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.label}</span>
              </a>
            `,
              )
              .join("")}
          </div>
        `,
          )
          .join("")}
        <a href="immediate-response.html" class="nav-emergency">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>Immediate Response</span>
        </a>
        <hr class="dropdown-divider" style="margin:16px 0;">
        <button class="dropdown-item is-danger" data-logout>
          <i class="fa-solid fa-right-from-bracket"></i> Sign out
        </button>
      </div>
    `;
  }

  // Highlight current page in nav
  const here = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((el) => {
    const href = el.getAttribute("href");
    if (href && href.split("/").pop() === here) el.classList.add("is-active");
  });

  // Re-init mobile menu bindings after header + drawer were rendered
  if (typeof initMobileMenu === "function") initMobileMenu();

  // After the header is rendered, sync the user avatar into any [data-avatar-slot] elements
  if (typeof syncAvatarEverywhere === "function") syncAvatarEverywhere();

  // Wire the search input and mobile search button now that the header exists
  if (typeof initHeaderSearch === "function") initHeaderSearch();
  if (typeof initSearchButtons === "function") initSearchButtons();
  if (typeof initCustomSelects === "function") initCustomSelects();
}

/* -------------------------------------------------------------------------
   Keyboard shortcut: Ctrl/Cmd + K to jump to search
   ------------------------------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    const input = document.getElementById("header-search-input");
    if (input) input.focus();
    else {
      const base = window.location.pathname.includes("/pages/") ? "../../" : "";
      window.location.href = base + "pages/student/search.html";
    }
  }
});
