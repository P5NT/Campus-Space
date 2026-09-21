/* ==========================================================================
   CAMPUS SPACE — auth.js
   Frontend authentication simulation: login, register, verification,
   password reset, session handling.

   Student admin support:
     Student admins (academia / su_pro) have BOTH an admin record and a
     linked student record. Their session carries:
       - studentId: pointer to the student record
       - adminRole / adminRoles: preserved so the admin view still works
       - viewMode: "admin" | "student" — which view is currently active
     A deactivated student admin is auto-downgraded to student view on
     their next page load — they keep their student account and never
     lose their student-side access.
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   ADMIN LOOKUP — merges seed + created admins, applies deactivations
   ------------------------------------------------------------------------- */
function getAllAdminsForAuth() {
  var base = (typeof DEMO_ADMINS !== "undefined" ? DEMO_ADMINS : []).map(
    function (a) {
      return Object.assign({}, a);
    },
  );

  var saved = null;
  try {
    saved = Store.get("admins_overrides", null);
  } catch (e) {
    saved = null;
  }
  if (!saved) return base;

  if (Array.isArray(saved.created)) {
    saved.created.forEach(function (a) {
      if (
        !base.some(function (x) {
          return x.id === a.id;
        })
      ) {
        base.push(a);
      }
    });
  }
  if (saved.edits) {
    base.forEach(function (a) {
      var edit = saved.edits[a.id];
      if (edit) Object.assign(a, edit);
    });
  }
  if (Array.isArray(saved.deactivated)) {
    base.forEach(function (a) {
      if (saved.deactivated.indexOf(a.id) !== -1) a.status = "deactivated";
    });
  }
  return base;
}

/* -------------------------------------------------------------------------
   Auth — session helpers
   ------------------------------------------------------------------------- */
const Auth = {
  current() {
    return Store.get("session", null);
  },
  isLoggedIn() {
    return !!Auth.current();
  },

  save(user) {
    /* Preserve existing viewMode if we're re-saving the same user */
    var existing = Auth.current();
    var viewMode = "admin";
    if (existing && existing.id === user.id && existing.viewMode) {
      viewMode = existing.viewMode;
    } else if (user.role === "student" && !user.adminRole) {
      viewMode = "student";
    }

    Store.set("session", {
      id: user.id,
      username: user.username,
      role: user.role || "student",
      adminRole: user.adminRole || null,
      adminRoles: user.adminRoles || null,
      studentId: user.studentId || null,
      viewMode: viewMode,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username,
      avatar: user.avatar || "",
      loggedAt: Date.now(),
    });
  },

  /* Switch between admin and student views for a student admin.
     Only works if the session has a studentId. */
  switchView(target) {
    var session = Auth.current();
    if (!session) return false;
    if (!session.studentId) return false;
    if (target !== "admin" && target !== "student") return false;

    /* If switching to admin, verify the admin record is still active */
    if (target === "admin") {
      var adminList = getAllAdminsForAuth();
      var record = adminList.find(function (a) {
        return a.id === session.id || a.username === session.username;
      });
      if (!record || record.status === "deactivated") {
        Toast.warning(
          "Your admin access has been revoked.",
          "Admin deactivated",
        );
        return false;
      }
    }

    session.viewMode = target;
    Store.set("session", session);

    var base = window.location.pathname.includes("/pages/") ? "../../" : "";
    if (target === "admin") {
      window.location.href = base + "pages/admin/dashboard.html";
    } else {
      window.location.href = base + "pages/student/dashboard.html";
    }
    return true;
  },

  logout() {
    Store.remove("session");
    const depth = window.location.pathname.includes("/pages/") ? "../../" : "";
    window.location.href = depth + "pages/auth/login.html";
  },

  redirectByRole(role) {
    const base = window.location.pathname.includes("/pages/") ? "../../" : "";
    if (role === "admin" || role === "super_admin") {
      window.location.href = base + "pages/admin/dashboard.html";
    } else {
      window.location.href = base + "pages/student/dashboard.html";
    }
  },
};

/* -------------------------------------------------------------------------
   Login page
   ------------------------------------------------------------------------- */
function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  if (new URLSearchParams(location.search).get("expired") === "1") {
    const notice = document.getElementById("expired-notice");
    if (notice) notice.style.display = "block";
  }
  if (new URLSearchParams(location.search).get("deactivated") === "1") {
    const notice = document.getElementById("expired-notice");
    if (notice) {
      notice.style.display = "block";
      var h5 = notice.querySelector("h5");
      var row = notice.querySelector(".row");
      if (h5)
        h5.innerHTML =
          '<i class="fa-solid fa-user-slash"></i> Account deactivated';
      if (row)
        row.textContent =
          "Your admin access has been revoked. Contact the Super Admin if this was a mistake.";
    }
  }

  bindForm(
    form,
    {
      identifier: [Rules.required],
      password: [Rules.required],
    },
    (data) => {
      const id = String(data.get("identifier") || "")
        .trim()
        .toLowerCase();
      const pw = String(data.get("password") || "");

      if (typeof DEMO_STUDENTS === "undefined") {
        Toast.error(
          "Demo data failed to load. Ensure data/students.js is loading correctly.",
          "Error",
        );
        return;
      }

      const btn = document.getElementById("login-submit");
      if (btn) {
        btn.classList.add("is-loading");
        btn.disabled = true;
      }

      setTimeout(() => {
        const student = DEMO_STUDENTS.find(
          (s) =>
            s.username.toLowerCase() === id || s.email.toLowerCase() === id,
        );
        const adminList = getAllAdminsForAuth();
        const admin = adminList.find(
          (a) =>
            a.username.toLowerCase() === id || a.email.toLowerCase() === id,
        );

        let matched = null;

        /* Prefer the admin record when the account is an admin.
         Seun and Temilade exist in BOTH DEMO_STUDENTS and DEMO_ADMINS —
         we want the admin password to win for them. */
        if (admin) {
          const roleKey =
            admin.adminRole === "super_admin"
              ? "superadmin"
              : admin.adminRole === "academia"
                ? "academia"
                : admin.adminRole === "su_pro"
                  ? "supro"
                  : "admin";

          const fallback =
            typeof DEMO_CREDENTIALS !== "undefined" && DEMO_CREDENTIALS[roleKey]
              ? DEMO_CREDENTIALS[roleKey].password
              : "";

          const expected = admin.password || fallback;
          matched = { user: admin, expected: expected, isAdmin: true };
        } else if (student) {
          const expected =
            student.password ||
            (typeof DEMO_CREDENTIALS !== "undefined" && DEMO_CREDENTIALS.student
              ? DEMO_CREDENTIALS.student.password
              : "Campus@2026");
          matched = { user: student, expected: expected, isAdmin: false };
        }

        if (btn) {
          btn.classList.remove("is-loading");
          btn.disabled = false;
        }

        if (!matched) {
          Toast.error(
            "No account found with those credentials.",
            "Sign in failed",
          );
          return;
        }

        /* Deactivation check — student admins get auto-downgraded, others blocked */
        if (matched.user.status === "deactivated") {
          if (matched.isAdmin && matched.user.studentId) {
            /* Student admin whose admin access was revoked → auto-downgrade to
             their student account. They never lose student-side access. */
            var studentRecord = DEMO_STUDENTS.find(function (s) {
              return s.id === matched.user.studentId;
            });
            if (studentRecord) {
              Auth.save(
                Object.assign({}, studentRecord, { viewMode: "student" }),
              );
              Toast.warning(
                "Your admin access has been revoked. You've been signed in as a student.",
                "Admin access revoked",
              );
              setTimeout(() => Auth.redirectByRole("student"), 700);
              return;
            }
          }
          Toast.warning(
            "This account has been deactivated. Contact Admin to reactivate.",
            "Account deactivated",
          );
          return;
        }
        if (matched.user.status === "suspended") {
          Toast.error(
            "This account has been suspended by Admin.",
            "Account suspended",
          );
          return;
        }

        if (pw !== matched.expected) {
          Toast.error(
            "Incorrect password. Please try again.",
            "Sign in failed",
          );
          return;
        }

        /* Determine the initial view mode */
        var initialView = "student";
        if (matched.isAdmin) {
          /* Admins default to admin view */
          initialView = "admin";
        }
        Auth.save(Object.assign({}, matched.user, { viewMode: initialView }));

        Toast.success("Signed in successfully. Welcome back!", "Welcome");

        setTimeout(() => {
          if (initialView === "admin") {
            Auth.redirectByRole("admin");
          } else {
            Auth.redirectByRole("student");
          }
        }, 500);
      }, 600);
    },
  );
}

/* -------------------------------------------------------------------------
   Register
   ------------------------------------------------------------------------- */
function initRegisterPage() {
  const form = document.getElementById("register-form");
  if (!form) return;

  if (typeof DEMO_FACULTIES === "undefined") {
    console.warn(
      "[auth.js] DEMO_FACULTIES is not loaded — the faculty dropdown will be empty.",
    );
    return;
  }

  const facultySelect = form.querySelector('[name="faculty"]');
  const deptSelect = form.querySelector('[name="department"]');

  DEMO_FACULTIES.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.name;
    opt.textContent = f.name;
    facultySelect.appendChild(opt);
  });

  facultySelect.addEventListener("change", () => {
    deptSelect.innerHTML = '<option value="">Select department</option>';
    const fac = DEMO_FACULTIES.find((f) => f.name === facultySelect.value);
    if (fac) {
      fac.departments.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.name;
        opt.textContent = d.name;
        deptSelect.appendChild(opt);
      });
    }
  });

  const pw = form.querySelector('[name="password"]');
  const reqsEl = form.querySelector(".pw-reqs");
  const strengthEl = form.querySelector(".pw-strength");
  initPasswordFeedback(pw, { reqsEl, strengthEl });

  bindForm(
    form,
    {
      firstName: [Rules.required, Rules.name],
      lastName: [Rules.required, Rules.name],
      username: [Rules.required, Rules.username],
      phone: [Rules.required, Rules.phone],
      faculty: [Rules.required],
      department: [Rules.required],
      level: [Rules.required],
      matric: [Rules.required, Rules.matric],
      password: [Rules.required, Rules.password],
      confirm: [Rules.required, Rules.match(pw)],
    },
    (data) => {
      const pending = {
        firstName: data.get("firstName"),
        otherName: data.get("otherName") || "",
        lastName: data.get("lastName"),
        username: data.get("username"),
        phone: data.get("phone"),
        faculty: data.get("faculty"),
        department: data.get("department"),
        level: data.get("level"),
        matric: data.get("matric"),
        password: data.get("password"),
        code: String(Math.floor(1000 + Math.random() * 9000)),
      };
      Store.set("pending_registration", pending);
      Toast.info(
        "A 4-digit verification code has been sent to your email (simulated).",
        "Check your email",
      );
      setTimeout(() => {
        window.location.href = "email-verification.html";
      }, 900);
    },
  );
}

/* -------------------------------------------------------------------------
   Email verification
   ------------------------------------------------------------------------- */
function initEmailVerificationPage() {
  const container = document.getElementById("otp-container");
  if (!container) return;

  const pending = Store.get("pending_registration");
  if (!pending) {
    window.location.href = "register.html";
    return;
  }

  initOtpInputs(container);

  const hint = document.getElementById("otp-hint");
  if (hint) hint.textContent = pending.code;

  const form = document.getElementById("verify-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const entered = getOtpValue(container);
    const btn = document.getElementById("verify-submit");
    btn.classList.add("is-loading");
    btn.disabled = true;

    setTimeout(() => {
      btn.classList.remove("is-loading");
      btn.disabled = false;

      if (entered !== pending.code) {
        Toast.error(
          "The code you entered does not match. Please try again.",
          "Verification failed",
        );
        return;
      }

      Toast.success(
        "Account verified. A welcome email has been sent (simulated).",
        "Welcome to Campus Space",
      );
      Auth.save({
        id: "STU-" + Date.now(),
        username: pending.username,
        firstName: pending.firstName,
        lastName: pending.lastName,
        role: "student",
        viewMode: "student",
        avatar: "",
      });
      Store.remove("pending_registration");
      setTimeout(() => {
        window.location.href = "../student/dashboard.html";
      }, 900);
    }, 600);
  });

  const resend = document.getElementById("otp-resend");
  if (resend) {
    resend.addEventListener("click", (e) => {
      e.preventDefault();
      pending.code = String(Math.floor(1000 + Math.random() * 9000));
      Store.set("pending_registration", pending);
      if (hint) hint.textContent = pending.code;
      Toast.info(
        "A new verification code has been sent (simulated).",
        "Code resent",
      );
    });
  }
}

/* -------------------------------------------------------------------------
   Forgot password
   ------------------------------------------------------------------------- */
function initForgotPasswordPage() {
  const form = document.getElementById("forgot-form");
  if (!form) return;

  bindForm(form, { email: [Rules.required, Rules.email] }, (data) => {
    Store.set("reset_email", data.get("email"));
    Toast.success(
      "A password reset link has been sent to your email (simulated).",
      "Check your inbox",
    );
    setTimeout(() => {
      window.location.href = "reset-password.html";
    }, 900);
  });
}

/* -------------------------------------------------------------------------
   Reset password
   ------------------------------------------------------------------------- */
function initResetPasswordPage() {
  const form = document.getElementById("reset-form");
  if (!form) return;

  const pw = form.querySelector('[name="password"]');
  const reqsEl = form.querySelector(".pw-reqs");
  const strengthEl = form.querySelector(".pw-strength");
  initPasswordFeedback(pw, { reqsEl, strengthEl });

  bindForm(
    form,
    {
      password: [Rules.required, Rules.password],
      confirm: [Rules.required, Rules.match(pw)],
    },
    () => {
      Toast.success(
        "Your password has been reset. You can now sign in.",
        "Password updated",
      );
      setTimeout(() => {
        window.location.href = "reset-success.html";
      }, 900);
    },
  );
}

/* -------------------------------------------------------------------------
   Logout
   ------------------------------------------------------------------------- */
function initLogoutButtons() {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-logout]");
    if (!btn) return;
    e.preventDefault();
    const ok = await Confirmation.confirm({
      title: "Sign out of Campus Space?",
      message: "You will need to sign in again to continue.",
      confirmLabel: "Sign out",
    });
    if (ok) {
      Toast.info("Signing you out…", "Goodbye");
      setTimeout(() => Auth.logout(), 500);
    }
  });
}

/* -------------------------------------------------------------------------
   Page guard
   - Redirects to login if there's no session
   - Enforces admin deactivation: a deactivated student admin is
     auto-downgraded to student view; a deactivated non-student admin is
     signed out.
   - Enforces the correct view for the page (admin vs student)
   ------------------------------------------------------------------------- */
function guardPage(requiredRole) {
  const session = Auth.current();
  const base = window.location.pathname.includes("/pages/") ? "../../" : "";

  if (!session) {
    window.location.href = base + "pages/auth/login.html";
    return false;
  }

  /* ---- Admin deactivation check ---- */
  if (session.role === "admin" || session.role === "super_admin") {
    const adminList = getAllAdminsForAuth();
    const record = adminList.find(
      (a) => a.id === session.id || a.username === session.username,
    );
    if (record && record.status === "deactivated") {
      /* Student admin → auto-downgrade to student view */
      if (session.studentId) {
        var studentRecord = (
          typeof DEMO_STUDENTS !== "undefined" ? DEMO_STUDENTS : []
        ).find(function (s) {
          return s.id === session.studentId;
        });
        if (studentRecord) {
          session.role = "student";
          session.adminRole = null;
          session.adminRoles = null;
          session.viewMode = "student";
          Store.set("session", session);
          Toast.warning(
            "Your admin access has been revoked. You've been switched to student view.",
            "Admin access revoked",
          );
          setTimeout(function () {
            window.location.href = base + "pages/student/dashboard.html";
          }, 900);
          return false;
        }
      }
      /* Non-student admin → sign out */
      Store.remove("session");
      Toast.warning(
        "Your admin account has been deactivated. You have been signed out.",
        "Access revoked",
      );
      setTimeout(() => {
        window.location.href = base + "pages/auth/login.html?deactivated=1";
      }, 900);
      return false;
    }
  }

  /* ---- Page access check ---- */
  if (requiredRole) {
    const isAdminPage = requiredRole === "admin";
    const isAdminSession =
      session.role === "admin" || session.role === "super_admin";

    /* Viewing admin page requires admin role AND admin view mode */
    if (isAdminPage) {
      if (!isAdminSession) {
        window.location.href =
          base + "pages/student/dashboard.html?unauthorized=1";
        return false;
      }
      if (session.viewMode === "student") {
        /* Student admin with student view active trying to open admin page →
           silently switch back to admin view */
        session.viewMode = "admin";
        Store.set("session", session);
      }
      return true;
    }

    /* Viewing student page */
    if (requiredRole === "student") {
      /* Admins (non-student) shouldn't be here — send them to the admin dashboard */
      if (isAdminSession && !session.studentId) {
        window.location.href = base + "pages/admin/dashboard.html";
        return false;
      }
      /* Student admins in admin view mode landing on a student page →
         treat it as an implicit switch to student view */
      if (isAdminSession && session.studentId && session.viewMode === "admin") {
        session.viewMode = "student";
        Store.set("session", session);
      }
      return true;
    }
  }

  return true;
}

/* -------------------------------------------------------------------------
   Page init
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  initRegisterPage();
  initEmailVerificationPage();
  initForgotPasswordPage();
  initResetPasswordPage();
  initLogoutButtons();
});
