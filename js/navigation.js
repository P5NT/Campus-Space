/* ==========================================================================
   CAMPUS SPACE — navigation.js
   Sidebar, header and mobile navigation logic for authenticated pages.
   Admin navigation is role-aware (super_admin, senior_admin, academia, su_pro).

   Super Admin pages are gated two ways:
     1. Capability check via Permissions.can(session, "admins.manage")
     2. Hard role check via `superAdminOnly: true` on the group + items
   Either check failing keeps the group hidden.
   ========================================================================== */
"use strict";

/* ==========================================================================
   HOME LINK RESOLVER
   Returns the path to the correct dashboard for the current page's location.
   Works from pages/student/*, pages/admin/*, and pages/super-admin/*.
   ========================================================================== */
function resolveHomeHref(role) {
  var path = window.location.pathname;
  if (path.indexOf("/super-admin/") !== -1) {
    return "../admin/dashboard.html";
  }
  return "dashboard.html";
}

/* ==========================================================================
   STUDENT NAVIGATION
   ========================================================================== */
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

/* ==========================================================================
   ADMIN NAVIGATION — role-aware
   ==========================================================================
   Each item can carry:
     requires: [capability]    → filtered by Permissions.can(session, cap)
     superAdminOnly: true      → hidden unless session role is exactly super_admin
   ========================================================================== */
const ADMIN_NAV_ITEMS = [
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
        requires: ["students.view"],
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
        requires: ["faculties.manage"],
      },
      {
        href: "departments.html",
        icon: "fa-diagram-project",
        label: "Departments",
        requires: ["departments.manage"],
      },
      {
        href: "academic-resources.html",
        icon: "fa-file-lines",
        label: "Academic Resources",
        requires: ["academics.view"],
      },
      {
        href: "academic-calendar.html",
        icon: "fa-calendar-days",
        label: "Academic Calendar",
        requires: ["academics.view"],
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
        requires: ["associations.manage"],
      },
      {
        href: "leadership-positions.html",
        icon: "fa-ranking-star",
        label: "Leadership Positions",
        requires: ["positions.manage"],
      },
      {
        href: "student-leaders.html",
        icon: "fa-user-tie",
        label: "Student Leaders",
        requires: ["leaders.assign"],
      },
      {
        href: "moderation.html",
        icon: "fa-shield-halved",
        label: "Moderation & Reports",
        requires: ["moderation.view"],
      },
    ],
  },
  {
    group: "Content",
    items: [
      {
        href: "news.html",
        icon: "fa-newspaper",
        label: "News",
        requires: ["news.publish"],
      },
      {
        href: "announcements.html",
        icon: "fa-bullhorn",
        label: "Announcements",
        requires: ["announcements.publish"],
      },
      {
        href: "opportunities.html",
        icon: "fa-briefcase",
        label: "Opportunities",
        requires: ["opportunities.publish"],
      },
    ],
  },
  {
    group: "Operations",
    items: [
      {
        href: "complaints.html",
        icon: "fa-file-shield",
        label: "Complaints",
        requires: ["complaints.view"],
      },
      {
        href: "emergency-contacts.html",
        icon: "fa-shield-heart",
        label: "Emergency Contacts",
        requires: ["emergency.manage"],
      },
    ],
  },
  {
    group: "Super Admin",
    superAdminOnly: true,
    items: [
      {
        href: "../super-admin/admins.html",
        icon: "fa-user-shield",
        label: "Admins",
        requires: ["admins.manage"],
        superAdminOnly: true,
      },
      {
        href: "../super-admin/student-verification.html",
        icon: "fa-user-check",
        label: "Student Verification",
        requires: ["admins.manage"],
        superAdminOnly: true,
      },
      {
        href: "../super-admin/admin-controls.html",
        icon: "fa-sliders",
        label: "Admin Controls",
        requires: ["admins.manage"],
        superAdminOnly: true,
      },
      {
        href: "../super-admin/admin-profile-images.html",
        icon: "fa-image",
        label: "Admin Profile Images",
        requires: ["admins.manage"],
        superAdminOnly: true,
      },
    ],
  },
];

/* ==========================================================================
   ROLE RESOLVER
   Safely reads the resolved role from Permissions, falling back to session.role.
   ========================================================================== */
function resolveRole(session) {
  if (!session) return null;
  if (typeof Permissions !== "undefined" && Permissions.getRole) {
    return Permissions.getRole(session);
  }
  /* Legacy fallback */
  if (session.role === "super_admin") return "super_admin";
  if (session.role === "admin") return "senior_admin";
  return session.role || null;
}

/* ==========================================================================
   ADMIN NAV FILTER
   Fail-closed: if Permissions isn't loaded, no capability-gated item passes.
   Super Admin items are also gated by an explicit role check — two
   independent guarantees against the group leaking to non-super-admins.
   ========================================================================== */
function getAdminNav(session) {
  var role = resolveRole(session);
  var isSuperAdmin = role === "super_admin";

  /* Capability checker — fail closed if Permissions isn't available */
  var canFn;
  if (typeof Permissions !== "undefined" && Permissions.can) {
    canFn = Permissions.can.bind(Permissions);
  } else {
    canFn = function () {
      return false;
    };
  }

  return ADMIN_NAV_ITEMS.map(function (group) {
    /* Entire group blocked for non-super-admins */
    if (group.superAdminOnly && !isSuperAdmin) {
      return { group: group.group, items: [] };
    }

    var items = group.items.filter(function (item) {
      /* Individual item blocked for non-super-admins */
      if (item.superAdminOnly && !isSuperAdmin) return false;

      /* No capability requirement — visible to any admin */
      if (!item.requires || !item.requires.length) return true;

      /* Every required capability must pass */
      return item.requires.every(function (cap) {
        return canFn(session, cap);
      });
    });

    return { group: group.group, items: items };
  }).filter(function (group) {
    return group.items.length > 0;
  });
}

/* ==========================================================================
   AVATAR HELPER
   ========================================================================== */
function resolveAvatar(session) {
  var url = typeof Avatar !== "undefined" && Avatar.get ? Avatar.get() : "";
  var initials = Util.initials(
    (session && session.name) || (session && session.username) || "?",
  );
  return { url: url, initials: initials };
}

/* ==========================================================================
   SIDEBAR
   ========================================================================== */
function buildSidebar(nav, options) {
  options = options || {};
  var role = options.role;
  var session = options.session;

  var roleBadge;
  var label =
    typeof Permissions !== "undefined" && Permissions.getRoleLabel
      ? Permissions.getRoleLabel(role)
      : "Admin";

  if (role === "super_admin") {
    roleBadge =
      '<span class="admin-badge super"><i class="fa-solid fa-crown"></i> ' +
      label +
      "</span>";
  } else if (role === "academia") {
    roleBadge =
      '<span class="admin-badge"><i class="fa-solid fa-graduation-cap"></i> ' +
      label +
      "</span>";
  } else if (role === "su_pro") {
    roleBadge =
      '<span class="admin-badge"><i class="fa-solid fa-bullhorn"></i> ' +
      label +
      "</span>";
  } else if (role === "senior_admin" || role === "admin") {
    roleBadge =
      '<span class="admin-badge"><i class="fa-solid fa-shield-halved"></i> ' +
      label +
      "</span>";
  } else {
    roleBadge = "";
  }

  var navHtml = nav
    .map(function (group) {
      return (
        '<div class="nav-group">' +
        '<div class="nav-group-title">' +
        group.group +
        "</div>" +
        group.items
          .map(function (item) {
            return (
              '<a class="nav-item" href="' +
              item.href +
              '">' +
              '<i class="fa-solid ' +
              item.icon +
              '"></i>' +
              "<span>" +
              item.label +
              "</span>" +
              "</a>"
            );
          })
          .join("") +
        "</div>"
      );
    })
    .join("");

  var avatar = resolveAvatar(session);
  var avatarHtml = avatar.url
    ? '<img src="' + avatar.url + '" alt="" class="avatar avatar-40">'
    : '<span class="avatar avatar-40 avatar-fallback">' +
      avatar.initials +
      "</span>";

  var homeHref = resolveHomeHref(role);

  return (
    '<a href="' +
    homeHref +
    '" class="sidebar-brand" aria-label="Campus Space home">' +
    '<img src="../../assets/icons/brand-icon.svg" alt="" width="34" height="34">' +
    '<span class="sidebar-brand-text">Campus Space</span>' +
    "</a>" +
    '<nav class="sidebar-nav" aria-label="Primary">' +
    (role !== "student" && roleBadge
      ? '<div style="padding: 0 12px 8px;">' + roleBadge + "</div>"
      : "") +
    navHtml +
    '<a href="immediate-response.html" class="nav-emergency">' +
    '<i class="fa-solid fa-circle-exclamation"></i>' +
    "<span>Immediate Response</span>" +
    "</a>" +
    "</nav>" +
    '<div class="sidebar-foot">' +
    '<div class="dropdown">' +
    '<button class="sidebar-user" data-dropdown aria-haspopup="true" aria-expanded="false" style="width:100%;">' +
    avatarHtml +
    '<div class="sidebar-user-info">' +
    '<div class="sidebar-user-name">' +
    Util.escape(session.name || session.username) +
    "</div>" +
    '<div class="sidebar-user-handle">@' +
    Util.escape(session.username) +
    "</div>" +
    "</div>" +
    '<i class="fa-solid fa-chevron-up" style="font-size:11px; color:var(--text-tertiary);"></i>' +
    "</button>" +
    '<div class="dropdown-menu" role="menu">' +
    '<div class="dropdown-header">' +
    "<h6>" +
    Util.escape(session.name || session.username) +
    "</h6>" +
    "<p>@" +
    Util.escape(session.username) +
    "</p>" +
    "</div>" +
    '<a class="dropdown-item" href="profile.html" role="menuitem"><i class="fa-solid fa-user"></i> Profile</a>' +
    '<a class="dropdown-item" href="settings.html" role="menuitem"><i class="fa-solid fa-gear"></i> Settings</a>' +
    '<button class="dropdown-item" data-theme-toggle role="menuitem"><i class="fa-solid fa-moon"></i> Toggle theme</button>' +
    '<hr class="dropdown-divider">' +
    '<button class="dropdown-item is-danger" data-logout role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> Sign out</button>' +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

/* ==========================================================================
   HEADER
   ========================================================================== */
function buildHeader(options) {
  var session = options.session;
  var notifCount = Store.get("notif_unread", 3);
  var avatar = resolveAvatar(session);
  var firstName = (session.name || session.username || "").split(" ")[0];
  var homeHref = resolveHomeHref(session.role);

  var avatarHtml = avatar.url
    ? '<img src="' + avatar.url + '" alt="" class="avatar avatar-32">'
    : '<span class="avatar avatar-32 avatar-fallback">' +
      avatar.initials +
      "</span>";

  return (
    '<button class="btn-icon header-brand-mobile" data-mobile-menu-open aria-label="Open menu">' +
    '<i class="fa-solid fa-bars"></i>' +
    "</button>" +
    '<a href="' +
    homeHref +
    '" class="header-brand-mobile" aria-label="Campus Space home" style="text-decoration:none;">' +
    '<img src="../../assets/icons/brand-icon.svg" alt="" width="28" height="28">' +
    "</a>" +
    '<div class="header-search" id="header-search-wrap">' +
    '<i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>' +
    '<input class="input" type="search" placeholder="Search Campus Space…" aria-label="Search" id="header-search-input" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="header-search-suggestions" aria-autocomplete="list">' +
    '<button type="button" class="header-search-submit" id="header-search-submit" aria-label="Submit search">' +
    '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
    "<span>Search</span>" +
    "</button>" +
    '<div class="search-suggest" id="header-search-suggestions" role="listbox" hidden></div>' +
    "</div>" +
    '<div class="header-actions">' +
    '<button type="button" class="btn-icon header-search-btn" aria-label="Search" id="header-search-mobile" data-search-open>' +
    '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
    "</button>" +
    '<a href="notifications.html" class="btn-icon" aria-label="Notifications">' +
    '<i class="fa-regular fa-bell"></i>' +
    (notifCount > 0
      ? '<span class="badge-notif">' + notifCount + "</span>"
      : "") +
    "</a>" +
    '<div class="dropdown">' +
    '<button class="header-profile" data-dropdown aria-haspopup="true" aria-expanded="false">' +
    avatarHtml +
    "<span>" +
    Util.escape(firstName) +
    "</span>" +
    "</button>" +
    '<div class="dropdown-menu" role="menu">' +
    '<div class="dropdown-header">' +
    "<h6>" +
    Util.escape(session.name || session.username) +
    "</h6>" +
    "<p>@" +
    Util.escape(session.username) +
    "</p>" +
    "</div>" +
    '<a class="dropdown-item" href="profile.html" role="menuitem"><i class="fa-solid fa-user"></i> View profile</a>' +
    '<a class="dropdown-item" href="settings.html" role="menuitem"><i class="fa-solid fa-gear"></i> Settings</a>' +
    '<hr class="dropdown-divider">' +
    '<button class="dropdown-item is-danger" data-logout role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> Sign out</button>' +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

/* ==========================================================================
   MOBILE BOTTOM NAV (student only)
   ========================================================================== */
function buildMobileNav() {
  return (
    '<div class="mobile-bottom-nav" role="navigation" aria-label="Mobile primary">' +
    '<div class="mobile-bottom-nav-inner">' +
    '<a href="dashboard.html" class="mobile-nav-item"><i class="fa-solid fa-house"></i><span>Home</span></a>' +
    '<a href="academics.html" class="mobile-nav-item"><i class="fa-solid fa-book-open-reader"></i><span>Academics</span></a>' +
    '<a href="immediate-response.html" class="mobile-nav-item emergency" aria-label="Immediate Response"><i class="fa-solid fa-circle-exclamation"></i><span>Emergency</span></a>' +
    '<a href="community.html" class="mobile-nav-item"><i class="fa-solid fa-comments"></i><span>Community</span></a>' +
    '<button class="mobile-nav-item" data-mobile-menu-open aria-label="Open menu"><i class="fa-solid fa-bars"></i><span>Menu</span></button>' +
    "</div>" +
    "</div>"
  );
}

/* ==========================================================================
   APP SHELL MOUNT
   ========================================================================== */
function initAppShell(role) {
  role = role || "student";
  var session = Auth.current();
  if (!session) return;

  var nav;
  if (role === "student") {
    nav = STUDENT_NAV;
  } else {
    nav = getAdminNav(session);
  }

  /* Compute the correct home link once, and rewrite nav item hrefs to
     be absolute from the current location. This makes the sidebar work
     whether it's on pages/admin/* or pages/super-admin/*. */
  var isSuperAdminPage =
    window.location.pathname.indexOf("/super-admin/") !== -1;

  /* Sidebar */
  var sidebarEl = document.getElementById("app-sidebar");
  if (sidebarEl) {
    var sidebarRole =
      role === "student"
        ? "student"
        : typeof Permissions !== "undefined" && Permissions.getRole
          ? Permissions.getRole(session)
          : session.role;
    sidebarEl.innerHTML = buildSidebar(nav, {
      role: sidebarRole,
      session: session,
    });
  }

  /* Header */
  var headerEl = document.getElementById("app-header");
  if (headerEl) headerEl.innerHTML = buildHeader({ session: session });

  /* Mobile bottom nav (student only) */
  if (role === "student") {
    var wrap = document.getElementById("mobile-nav-mount");
    if (wrap) wrap.innerHTML = buildMobileNav();
  }

  /* Mobile menu drawer */
  var menuEl = document.getElementById("mobile-menu-mount");
  if (menuEl) {
    menuEl.innerHTML =
      '<div class="mobile-menu-head">' +
      '<div class="cluster">' +
      '<img src="../../assets/icons/brand-icon.svg" alt="" width="30" height="30">' +
      '<strong style="font-family:var(--font-heading);">Campus Space</strong>' +
      "</div>" +
      '<button class="btn-icon" data-mobile-menu-close aria-label="Close menu">' +
      '<i class="fa-solid fa-xmark"></i>' +
      "</button>" +
      "</div>" +
      '<div style="padding:16px;">' +
      nav
        .map(function (g) {
          return (
            '<div class="nav-group">' +
            '<div class="nav-group-title">' +
            g.group +
            "</div>" +
            g.items
              .map(function (item) {
                return (
                  '<a class="nav-item" href="' +
                  item.href +
                  '">' +
                  '<i class="fa-solid ' +
                  item.icon +
                  '"></i>' +
                  "<span>" +
                  item.label +
                  "</span>" +
                  "</a>"
                );
              })
              .join("") +
            "</div>"
          );
        })
        .join("") +
      '<a href="immediate-response.html" class="nav-emergency">' +
      '<i class="fa-solid fa-circle-exclamation"></i>' +
      "<span>Immediate Response</span>" +
      "</a>" +
      '<hr class="dropdown-divider" style="margin:16px 0;">' +
      '<button class="dropdown-item is-danger" data-logout>' +
      '<i class="fa-solid fa-right-from-bracket"></i> Sign out' +
      "</button>" +
      "</div>";
  }

  /* ---- Fix relative hrefs when on a Super Admin page ---- */
  if (isSuperAdminPage && role !== "student") {
    document
      .querySelectorAll(
        ".sidebar-nav a, .sidebar-brand, .mobile-menu .nav-item",
      )
      .forEach(function (a) {
        var href = a.getAttribute("href");
        if (!href) return;
        if (href.indexOf("../") === 0) return;
        if (href.indexOf("http") === 0) return;
        a.setAttribute("href", "../admin/" + href);
      });
  }

  /* Highlight current page in nav */
  var here = window.location.pathname.split("/").pop();
  document
    .querySelectorAll(".nav-item, .mobile-nav-item")
    .forEach(function (el) {
      var href = el.getAttribute("href");
      if (href && href.split("/").pop() === here) el.classList.add("is-active");
    });

  /* Post-render hooks */
  if (typeof initMobileMenu === "function") initMobileMenu();
  if (typeof syncAvatarEverywhere === "function") syncAvatarEverywhere();
  if (typeof initHeaderSearch === "function") initHeaderSearch();
  if (typeof initSearchButtons === "function") initSearchButtons();
  if (typeof initCustomSelects === "function") initCustomSelects();
}

/* ==========================================================================
   KEYBOARD SHORTCUT — ⌘K / Ctrl+K to search
   ========================================================================== */
document.addEventListener("keydown", function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    var input = document.getElementById("header-search-input");
    if (input) input.focus();
    else {
      var base = window.location.pathname.includes("/pages/") ? "../../" : "";
      window.location.href = base + "pages/student/search.html";
    }
  }
});
