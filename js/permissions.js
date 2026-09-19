/* ==========================================================================
   CAMPUS SPACE — permissions.js
   Central role-checking system for admin capability gating.

   Roles:
     - super_admin    — one account, manages all other admins
     - senior_admin   — full admin except admin management
     - academia       — student admins for academics only
     - su_pro         — student admins for content + complaints
   ========================================================================== */
"use strict";

const Permissions = (() => {
  /* ------------------------------------------------------------------
     Role resolution — figure out which role the current session has
     ------------------------------------------------------------------ */
  function getRole(session) {
    if (!session) return null;

    /* Legacy role names still work */
    if (session.role === "super_admin") return "super_admin";
    if (session.role === "admin") return "senior_admin";

    /* Student admins carry `adminRoles` array */
    if (Array.isArray(session.adminRoles)) {
      if (session.adminRoles.indexOf("academia") !== -1) return "academia";
      if (session.adminRoles.indexOf("su_pro") !== -1) return "su_pro";
    }

    return null;
  }

  function isAdminRole(session) {
    return getRole(session) !== null;
  }

  function getRoleLabel(role) {
    return (
      {
        super_admin: "Super Admin",
        senior_admin: "Senior Admin",
        academia: "Academic Admin",
        su_pro: "SU PRO",
      }[role] || "Admin"
    );
  }

  /* ------------------------------------------------------------------
     Capability table — who can do what
     ------------------------------------------------------------------ */
  const CAPABILITIES = {
    super_admin: [
      "students.view",
      "students.verify",
      "students.suspend",
      "complaints.view",
      "complaints.respond",
      "announcements.publish",
      "news.publish",
      "opportunities.publish",
      "academics.view",
      "academics.upload",
      "academics.publish",
      "moderation.view",
      "moderation.act",
      "leaders.assign",
      "associations.manage",
      "positions.manage",
      "faculties.manage",
      "departments.manage",
      "emergency.manage",
      "admins.manage",
      "admins.assign_roles",
      "dashboard.full",
    ],
    senior_admin: [
      "students.view",
      "students.verify",
      "students.suspend",
      "complaints.view",
      "complaints.respond",
      "announcements.publish",
      "news.publish",
      "opportunities.publish",
      "academics.view",
      "academics.upload",
      "academics.publish",
      "moderation.view",
      "moderation.act",
      "leaders.assign",
      "associations.manage",
      "positions.manage",
      "faculties.manage",
      "departments.manage",
      "emergency.manage",
      "dashboard.full",
    ],
    academia: [
      "academics.view",
      "academics.upload",
      "academics.publish",
      "dashboard.academics",
    ],
    su_pro: [
      "complaints.view",
      "complaints.respond",
      "announcements.publish",
      "news.publish",
      "opportunities.publish",
      "dashboard.content",
    ],
  };

  function can(session, capability) {
    const role = getRole(session);
    if (!role) return false;
    const list = CAPABILITIES[role];
    return Array.isArray(list) && list.indexOf(capability) !== -1;
  }

  /* ------------------------------------------------------------------
     Byline for admin-flavored content (announcements, news, opportunities)
     ------------------------------------------------------------------ */
  function getByline(session) {
    const role = getRole(session);
    if (role === "super_admin" || role === "senior_admin") {
      return { name: "Space Admin", tag: "ADMIN", isAdmin: true };
    }
    if (role === "su_pro") {
      return { name: "PRO, OAUSTECHSU", tag: "", isAdmin: true };
    }
    /* Fallback — treat as a normal student */
    return {
      name: (session.firstName || "") + " " + (session.lastName || ""),
      tag: "",
      isAdmin: false,
    };
  }

  return {
    getRole: getRole,
    isAdminRole: isAdminRole,
    getRoleLabel: getRoleLabel,
    can: can,
    getByline: getByline,
  };
})();
