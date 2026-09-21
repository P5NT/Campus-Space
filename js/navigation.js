/* ==========================================================================
   CAMPUS SPACE — navigation.js
   Sidebar, header and mobile navigation logic for authenticated pages.

   Admin navigation is role-aware (super_admin, senior_admin, academia, su_pro).

   Student admins (academia, su_pro) can toggle between Admin view and
   Student view. The toggle is exposed at the top of the sidebar.
   ========================================================================== */
"use strict";

/* ==========================================================================
   HOME LINK RESOLVER
   ========================================================================== */
function resolveHomeHref(role, viewMode) {
  var path = window.location.pathname;
  var isSuperAdminPath = path.indexOf("/super-admin/") !== -1;
  var isAdminPath = path.indexOf("/pages/admin/") !== -1;
  var isStudentPath = path.indexOf("/pages/student/") !== -1;

  /* If we're on a super-admin page, always go back to the admin dashboard */
  if (isSuperAdminPath) return "../admin/dashboard.html";

  /* If we're on an admin page, stay in admin context */
  if (isAdminPath) return "dashboard.html";

  /* If we're on a student page, stay in student context */
  if (isStudentPath) return "dashboard.html";

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
   ========================================================================== */
function resolveRole(session) {
  if (!session) return null;
  if (typeof Permissions !== "undefined" && Permissions.getRole) {
    return Permissions.getRole(session);
  }
  if (session.role === "super_admin") return "super_admin";
  if (session.role === "admin") return "senior_admin";
  return session.role || null;
}

/* ==========================================================================
   ADMIN NAV FILTER — fail-closed, dual-gated for Super Admin items
   ========================================================================== */
function getAdminNav(session) {
  var role = resolveRole(session);
  var isSuperAdmin = role === "super_admin";

  var canFn;
  if (typeof Permissions !== "undefined" && Permissions.can) {
    canFn = Permissions.can.bind(Permissions);
  } else {
    canFn = function () {
      return false;
    };
  }

  return ADMIN_NAV_ITEMS.map(function (group) {
    if (group.superAdminOnly && !isSuperAdmin) {
      return { group: group.group, items: [] };
    }
    var items = group.items.filter(function (item) {
      if (item.superAdminOnly && !isSuperAdmin) return false;
      if (!item.requires || !item.requires.length) return true;
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
   VIEW TOGGLE — shown only for student admins
   ========================================================================== */
function buildViewToggle(session, target) {
  /* target is the view we'll switch TO: "admin" or "student" */
  if (!session || !session.studentId) return "";

  var isAdminCurrently =
    session.role === "admin" || session.role === "super_admin";
  var isSuperAdmin = session.role === "super_admin";

  /* Super Admins never have a student side (they aren't linked to a student) */
  if (isSuperAdmin) return "";

  var label = target === "student" ? "Student view" : "Admin view";
  var icon = target === "student" ? "fa-user-graduate" : "fa-shield-halved";
  var hint =
    target === "student"
      ? "See Campus Space the way students do"
      : "Return to your admin workspace";

  return (
    '<button type="button" class="view-toggle" data-view-switch="' +
    target +
    '" title="' +
    hint +
    '">' +
    '<span class="view-toggle-icon"><i class="fa-solid ' +
    icon +
    '"></i></span>' +
    '<span class="view-toggle-body">' +
    '<span class="view-toggle-label">Switch to</span>' +
    '<span class="view-toggle-target">' +
    label +
    "</span>" +
    "</span>" +
    '<i class="fa-solid fa-right-left view-toggle-arrow"></i>' +
    "</button>"
  );
}

/* ==========================================================================
   SIDEBAR
   ========================================================================== */
function buildSidebar(nav, options) {
  options = options || {};
  var role = options.role;
  var session = options.session;
  var viewMode = options.viewMode; /* "admin" | "student" */

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

  var homeHref = resolveHomeHref(role, viewMode);

  /* The view toggle — only rendered for student admins */
  var toggleTarget = viewMode === "admin" ? "student" : "admin";
  var toggleHtml = buildViewToggle(session, toggleTarget);

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
    /* View toggle sits right below the role badge */
    (toggleHtml
      ? '<div class="view-toggle-wrap">' + toggleHtml + "</div>"
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
  var viewMode = options.viewMode;
  var notifCount = Store.get("notif_unread", 3);
  var avatar = resolveAvatar(session);
  var firstName = (session.name || session.username || "").split(" ")[0];
  var homeHref = resolveHomeHref(session.role, viewMode);

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
   VIEW TOGGLE HANDLER — delegates clicks to Auth.switchView()
   ========================================================================== */
function initViewToggle() {
  if (document._viewToggleBound) return;
  document._viewToggleBound = true;

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-view-switch]");
    if (!btn) return;
    e.preventDefault();

    var target = btn.getAttribute("data-view-switch");
    if (typeof Auth !== "undefined" && Auth.switchView) {
      Auth.switchView(target);
    }
  });
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

  var isSuperAdminPage =
    window.location.pathname.indexOf("/super-admin/") !== -1;
  var viewMode = session.viewMode || (role === "admin" ? "admin" : "student");

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
      viewMode: viewMode,
    });
  }

  /* Header */
  var headerEl = document.getElementById("app-header");
  if (headerEl) {
    headerEl.innerHTML = buildHeader({ session: session, viewMode: viewMode });
  }

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
      /* Mobile view toggle for student admins */
      (session.studentId && session.role !== "super_admin"
        ? '<div style="margin-bottom:16px;">' +
          buildViewToggle(session, viewMode === "admin" ? "student" : "admin") +
          "</div>"
        : "") +
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

  /* Wire view toggle */
  initViewToggle();

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
