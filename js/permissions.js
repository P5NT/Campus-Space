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

    /* Super Admin is a distinct account type — check first */
    if (session.role === "super_admin") return "super_admin";

    /* Student admins carry `adminRoles` array. Check BEFORE the
       generic `role === "admin"` fallback so they resolve correctly. */
    if (Array.isArray(session.adminRoles) && session.adminRoles.length) {
      if (session.adminRoles.indexOf("academia") !== -1) return "academia";
      if (session.adminRoles.indexOf("su_pro") !== -1) return "su_pro";
    }

    /* Also honor a single `adminRole` string (used on dynamically-created admins) */
    if (session.adminRole === "academia") return "academia";
    if (session.adminRole === "su_pro") return "su_pro";
    if (session.adminRole === "senior_admin") return "senior_admin";

    /* Legacy fallback — plain admin accounts are senior admins */
    if (session.role === "admin") return "senior_admin";

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
     Byline for admin-flavored content (announcements, news,
     complaints responses, opportunities).

     Rule: an admin acts in an OFFICIAL capacity. Public-facing content
     shows the OFFICE, not the person.

       Super Admin / Senior Admin → "Space Admin" (with ADMIN badge)
       SU PRO                     → "PRO, OAUSTECHSU" (no badge)
       Academia                   → no public byline (they only touch
                                    academic files, which carry no
                                    byline publicly)
       Everyone else              → their own name (students)
     ------------------------------------------------------------------ */
  function getByline(session) {
    const role = getRole(session);
    if (role === "super_admin" || role === "senior_admin") {
      return { name: "Space Admin", tag: "ADMIN", isAdmin: true };
    }
    if (role === "su_pro") {
      return { name: "PRO, OAUSTECHSU", tag: "", isAdmin: true };
    }
    /* Academia + students fall through to their own name.
       Academia never shows this publicly, but if they ever do,
       their name is the fallback. */
    return {
      name:
        ((session && session.firstName) || "") +
        " " +
        ((session && session.lastName) || ""),
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
