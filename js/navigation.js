/* ==========================================================================
   CAMPUS SPACE — navigation.js
   Sidebar, header and mobile navigation logic for authenticated pages.

   Admin navigation is role-aware (super_admin, senior_admin, academia, su_pro).

   Student admins (academia, su_pro) can toggle between Admin view and
   Student view. The toggle is exposed at the top of the sidebar.

   Shared pages (notifications, profile, settings, immediate-response, search)
   live under /pages/student/ but are reachable by any role. The app shell
   derives its effective role from the session (respecting viewMode) rather
   than from the `role` argument, so a shared page renders the correct
   sidebar for whoever is signed in.

   All nav items resolve their hrefs through resolveNavHref() so that the
   admin sidebar works correctly when rendered from a student folder and
   vice versa.
   ========================================================================== */
"use strict";

/* ==========================================================================
   NAV ITEM PATH RESOLVER
   Resolves a nav item's href relative to the current page.

   area: "admin" | "student" — which folder the target page lives in.

   Rules:
     - href starts with "http" or "#"        → return unchanged
     - href already starts with "../"        → return unchanged
     - current page IS in the target area's
       folder                                → return href unchanged
     - current page is elsewhere             → prefix with the correct
                                               relative path to the area
   ========================================================================== */
function resolveNavHref(href, area) {
  if (!href) return "";
  if (href.indexOf("http") === 0) return href;
  if (href.indexOf("#") === 0) return href;
  if (href.indexOf("../") === 0) return href;

  var path = window.location.pathname;
  var inStudentFolder = path.indexOf("/pages/student/") !== -1;
  var inAdminFolder = path.indexOf("/pages/admin/") !== -1;
  var inSuperAdminFolder = path.indexOf("/pages/super-admin/") !== -1;
  var inSystemFolder = path.indexOf("/pages/system/") !== -1;
  var inAuthFolder = path.indexOf("/pages/auth/") !== -1;
  var inPages = path.indexOf("/pages/") !== -1;

  /* Target is an admin page */
  if (area === "admin") {
    if (inAdminFolder) return href; /* same folder */
    if (inStudentFolder || inSuperAdminFolder) return "../admin/" + href;
    if (inSystemFolder || inAuthFolder) return "../admin/" + href;
    if (!inPages) return "pages/admin/" + href;
    return href;
  }

  /* Target is a student page */
  if (area === "student") {
    if (inStudentFolder) return href;
    if (inAdminFolder || inSuperAdminFolder) return "../student/" + href;
    if (inSystemFolder || inAuthFolder) return "../student/" + href;
    if (!inPages) return "pages/student/" + href;
    return href;
  }

  return href;
}

/* ==========================================================================
   SHARED PAGE PATH RESOLVER
   Returns the correct relative path from the current page to a shared
   page that lives under pages/student/.
   ========================================================================== */
function resolveSharedHref(target) {
  if (!target) return "";
  if (target.indexOf("http") === 0) return target;
  if (target.indexOf("#") === 0) return target;

  var path = window.location.pathname;

  var inPagesStudent = path.indexOf("/pages/student/") !== -1;
  var inPagesAdmin = path.indexOf("/pages/admin/") !== -1;
  var inPagesSuper = path.indexOf("/pages/super-admin/") !== -1;
  var inPagesSystem = path.indexOf("/pages/system/") !== -1;
  var inPagesAuth = path.indexOf("/pages/auth/") !== -1;
  var inPages = path.indexOf("/pages/") !== -1;

  if (inPagesStudent) return target;

  if (inPagesAdmin || inPagesSuper || inPagesSystem || inPagesAuth) {
    return "../student/" + target;
  }

  if (!inPages) return "pages/student/" + target;

  return target;
}

/* ==========================================================================
   EFFECTIVE ROLE RESOLVER
   Derives the role the app shell should render, given the current session.

   Rules:
     - Student session            → "student"
     - Super admin session        → "admin"
     - Admin session              → "admin"
     - Student admin in viewMode
       "student"                  → "student"
     - Student admin in viewMode
       "admin"                    → "admin"
     - No session                 → null (caller should redirect)
   ========================================================================== */
function resolveShellRole(session, requestedRole) {
  if (!session) return null;

  var sessionRole = session.role;
  var viewMode = session.viewMode || null;

  if (sessionRole === "student") return "student";

  if (sessionRole === "super_admin") return "admin";
  if (sessionRole === "admin") {
    if (session.studentId && viewMode === "student") return "student";
    return "admin";
  }

  if (requestedRole === "admin") return "admin";
  return "student";
}

/* ==========================================================================
   HOME LINK RESOLVER
   ========================================================================== */
function resolveHomeHref(role, viewMode) {
  var path = window.location.pathname;
  var isSuperAdminPath = path.indexOf("/super-admin/") !== -1;
  var isAdminPath = path.indexOf("/pages/admin/") !== -1;
  var isStudentPath = path.indexOf("/pages/student/") !== -1;

  if (isSuperAdminPath) return "../admin/dashboard.html";
  if (isAdminPath) return "dashboard.html";
  if (isStudentPath) {
    if (role === "admin" && viewMode !== "student")
      return "../admin/dashboard.html";
    return "dashboard.html";
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
      {
        href: "student-verification.html",
        icon: "fa-user-check",
        label: "Student Verification",
        requires: ["students.verify"],
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
      },
      { href: "study-groups.html", icon: "fa-users", label: "Study Groups" },
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
  if (!session || !session.studentId) return "";

  var isSuperAdmin = session.role === "super_admin";
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
   NAV HTML BUILDER — resolves every item's href through resolveNavHref()
   ========================================================================== */
function buildNavHtml(nav, area) {
  return nav
    .map(function (group) {
      return (
        '<div class="nav-group">' +
        '<div class="nav-group-title">' +
        group.group +
        "</div>" +
        group.items
          .map(function (item) {
            var resolvedHref = resolveNavHref(item.href, area);
            return (
              '<a class="nav-item" href="' +
              resolvedHref +
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
}

/* ==========================================================================
   SIDEBAR
   ========================================================================== */
function buildSidebar(nav, options) {
  options = options || {};
  var role = options.role;
  var session = options.session;
  var viewMode = options.viewMode;
  var navArea = options.navArea || "student";

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

  var navHtml = buildNavHtml(nav, navArea);

  var avatar = resolveAvatar(session);
  var avatarHtml = avatar.url
    ? '<img src="' + avatar.url + '" alt="" class="avatar avatar-40">'
    : '<span class="avatar avatar-40 avatar-fallback">' +
      avatar.initials +
      "</span>";

  var homeHref = resolveHomeHref(role, viewMode);

  var toggleTarget = viewMode === "admin" ? "student" : "admin";
  var toggleHtml = buildViewToggle(session, toggleTarget);

  var profileHref = resolveSharedHref("profile.html");
  var settingsHref = resolveSharedHref("settings.html");
  var immediateHref = resolveSharedHref("immediate-response.html");

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
    (toggleHtml
      ? '<div class="view-toggle-wrap">' + toggleHtml + "</div>"
      : "") +
    navHtml +
    '<a href="' +
    immediateHref +
    '" class="nav-emergency">' +
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
    '<a class="dropdown-item" href="' +
    profileHref +
    '" role="menuitem"><i class="fa-solid fa-user"></i> Profile</a>' +
    '<a class="dropdown-item" href="' +
    settingsHref +
    '" role="menuitem"><i class="fa-solid fa-gear"></i> Settings</a>' +
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

  var notifCount = 0;
  if (
    typeof Notifications !== "undefined" &&
    typeof Notifications.unreadCount === "function"
  ) {
    notifCount = Notifications.unreadCount();
  } else {
    notifCount = Store.get("notif_unread", 0) || 0;
  }

  var avatar = resolveAvatar(session);
  var firstName = (session.name || session.username || "").split(" ")[0];
  var homeHref = resolveHomeHref(session.role, viewMode);

  var notificationsHref = resolveSharedHref("notifications.html");
  var profileHref = resolveSharedHref("profile.html");
  var settingsHref = resolveSharedHref("settings.html");

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
    '<a href="' +
    notificationsHref +
    '" class="btn-icon" aria-label="Notifications">' +
    '<i class="fa-regular fa-bell"></i>' +
    (notifCount > 0
      ? '<span class="badge-notif">' +
        (notifCount > 99 ? "99+" : notifCount) +
        "</span>"
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
    '<a class="dropdown-item" href="' +
    profileHref +
    '" role="menuitem"><i class="fa-solid fa-user"></i> View profile</a>' +
    '<a class="dropdown-item" href="' +
    settingsHref +
    '" role="menuitem"><i class="fa-solid fa-gear"></i> Settings</a>' +
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
    '<a href="' +
    resolveNavHref("dashboard.html", "student") +
    '" class="mobile-nav-item"><i class="fa-solid fa-house"></i><span>Home</span></a>' +
    '<a href="' +
    resolveNavHref("academics.html", "student") +
    '" class="mobile-nav-item"><i class="fa-solid fa-book-open-reader"></i><span>Academics</span></a>' +
    '<a href="' +
    resolveSharedHref("immediate-response.html") +
    '" class="mobile-nav-item emergency" aria-label="Immediate Response"><i class="fa-solid fa-circle-exclamation"></i><span>Emergency</span></a>' +
    '<a href="' +
    resolveNavHref("community.html", "student") +
    '" class="mobile-nav-item"><i class="fa-solid fa-comments"></i><span>Community</span></a>' +
    '<button class="mobile-nav-item" data-mobile-menu-open aria-label="Open menu"><i class="fa-solid fa-bars"></i><span>Menu</span></button>' +
    "</div>" +
    "</div>"
  );
}

/* ==========================================================================
   VIEW TOGGLE HANDLER
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

   The `role` argument is treated as a soft hint. The real role is derived
   from the current session via resolveShellRole(), so shared pages render
   the correct sidebar for whoever is signed in.
   ========================================================================== */
function initAppShell(role) {
  role = role || "student";
  var session = Auth.current();
  if (!session) return;

  var effectiveRole = resolveShellRole(session, role) || "student";

  /* ---- Maintenance mode gate ---- */
  if (
    typeof SystemSettings !== "undefined" &&
    SystemSettings.isEnabled("maintenance_mode") &&
    effectiveRole === "student"
  ) {
    var here = window.location.pathname.split("/").pop();
    var allowedPages = ["maintenance.html", "immediate-response.html"];
    if (allowedPages.indexOf(here) === -1) {
      window.location.href = "../system/maintenance.html";
      return;
    }
  }

  var nav;
  var navArea;
  if (effectiveRole === "student") {
    nav = STUDENT_NAV;
    navArea = "student";
  } else {
    nav = getAdminNav(session);
    navArea = "admin";
  }

  var isSuperAdminPage =
    window.location.pathname.indexOf("/super-admin/") !== -1;
  var viewMode =
    session.viewMode || (effectiveRole === "admin" ? "admin" : "student");

  /* Sidebar */
  var sidebarEl = document.getElementById("app-sidebar");
  if (sidebarEl) {
    var sidebarRole =
      effectiveRole === "student"
        ? "student"
        : typeof Permissions !== "undefined" && Permissions.getRole
          ? Permissions.getRole(session)
          : session.role;
    sidebarEl.innerHTML = buildSidebar(nav, {
      role: sidebarRole,
      session: session,
      viewMode: viewMode,
      navArea: navArea,
    });
  }

  /* Header */
  var headerEl = document.getElementById("app-header");
  if (headerEl) {
    headerEl.innerHTML = buildHeader({ session: session, viewMode: viewMode });
  }

  /* Mobile bottom nav (student only) */
  if (effectiveRole === "student") {
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
      (session.studentId && session.role !== "super_admin"
        ? '<div style="margin-bottom:16px;">' +
          buildViewToggle(session, viewMode === "admin" ? "student" : "admin") +
          "</div>"
        : "") +
      buildNavHtml(nav, navArea) +
      '<a href="' +
      resolveSharedHref("immediate-response.html") +
      '" class="nav-emergency">' +
      '<i class="fa-solid fa-circle-exclamation"></i>' +
      "<span>Immediate Response</span>" +
      "</a>" +
      '<hr class="dropdown-divider" style="margin:16px 0;">' +
      '<button class="dropdown-item is-danger" data-logout>' +
      '<i class="fa-solid fa-right-from-bracket"></i> Sign out' +
      "</button>" +
      "</div>";
  }

  /* Highlight current page in nav */
  var here = window.location.pathname.split("/").pop();
  document
    .querySelectorAll(".nav-item, .mobile-nav-item")
    .forEach(function (el) {
      var href = el.getAttribute("href");
      if (href && href.split("/").pop() === here) el.classList.add("is-active");
    });

  initViewToggle();

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
