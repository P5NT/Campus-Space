/* ==========================================================================
   CAMPUS SPACE — auth.js
   Frontend authentication simulation: login, register, dual verification
   (email + phone), password reset, session handling.
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
   STUDENT LOOKUP — merges seed + registered students, applies overrides
   ------------------------------------------------------------------------- */
function getAllStudentsForAuth() {
  var base = (typeof DEMO_STUDENTS !== "undefined" ? DEMO_STUDENTS : []).map(
    function (s) {
      return Object.assign({}, s);
    },
  );

  var registered = null;
  try {
    registered = Store.get("registered_students", []);
  } catch (e) {
    registered = [];
  }
  if (Array.isArray(registered)) {
    registered.forEach(function (s) {
      if (
        !base.some(function (x) {
          return x.id === s.id || x.username === s.username;
        })
      ) {
        base.push(s);
      }
    });
  }

  var overrides = null;
  try {
    overrides = Store.get("student_overrides", null);
  } catch (e) {
    overrides = null;
  }
  if (overrides && overrides.edits) {
    base.forEach(function (s) {
      var edit = overrides.edits[s.id];
      if (edit) Object.assign(s, edit);
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

  /* Returns the current session's student record (or null if it's a
     pure admin without a student link). */
  currentStudent() {
    var session = Auth.current();
    if (!session) return null;
    var students = getAllStudentsForAuth();
    return (
      students.find(function (s) {
        return s.username === session.username;
      }) ||
      students.find(function (s) {
        return s.id === session.studentId;
      }) ||
      null
    );
  },

  /* Is the current student verified? Admins are considered verified. */
  isVerified() {
    var session = Auth.current();
    if (!session) return false;
    if (session.role === "admin" || session.role === "super_admin") return true;
    var student = Auth.currentStudent();
    if (!student) return false;
    return student.verificationStatus === "verified";
  },

  /* Returns "verified" | "pending" | "rejected" | null.
     Admins return "verified". */
  verificationStatus() {
    var session = Auth.current();
    if (!session) return null;
    if (session.role === "admin" || session.role === "super_admin")
      return "verified";
    var student = Auth.currentStudent();
    return student ? student.verificationStatus || "pending" : null;
  },

  /* Called by gated pages. If the current student is not verified, shows
     a lock screen in the #main container and returns false. */
  requireVerifiedStudent(options) {
    if (Auth.isVerified()) return true;
    var status = Auth.verificationStatus();
    var main = document.getElementById("main");
    if (!main) return false;

    var isRejected = status === "rejected";
    var title = isRejected
      ? "Verification rejected"
      : "Awaiting student verification";
    var body = isRejected
      ? "Your student details were rejected by Admin. Please contact Admin to resolve this before accessing this feature."
      : "Your student details are still being verified by Admin. This feature will unlock once your account is verified.";
    var icon = isRejected ? "fa-user-slash" : "fa-hourglass-half";

    main.innerHTML =
      '<div class="card" style="max-width: 560px; margin: 40px auto; padding: 40px 32px; text-align: center;">' +
      '<div class="empty-icon" style="margin: 0 auto 20px; background: var(--warning-soft); color: var(--warning);"><i class="fa-solid ' +
      icon +
      '"></i></div>' +
      '<h2 style="font-size: var(--fs-xl); margin-bottom: 12px;">' +
      title +
      "</h2>" +
      '<p style="font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">' +
      body +
      "</p>" +
      '<div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">' +
      '<a class="btn btn-primary" href="dashboard.html"><i class="fa-solid fa-house"></i> Back to Dashboard</a>' +
      '<a class="btn btn-secondary" href="help-support.html"><i class="fa-solid fa-circle-question"></i> Get help</a>' +
      "</div></div>";
    return false;
  },

  save(user) {
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

  switchView(target) {
    var session = Auth.current();
    if (!session) return false;
    if (!session.studentId) return false;
    if (target !== "admin" && target !== "student") return false;

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
        const students = getAllStudentsForAuth();
        const student = students.find(
          (s) =>
            s.username.toLowerCase() === id || s.email.toLowerCase() === id,
        );
        const adminList = getAllAdminsForAuth();
        const admin = adminList.find(
          (a) =>
            a.username.toLowerCase() === id || a.email.toLowerCase() === id,
        );

        let matched = null;

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

        /* Deactivation check */
        if (matched.user.status === "deactivated") {
          if (matched.isAdmin && matched.user.studentId) {
            var studentRecord = getAllStudentsForAuth().find(function (s) {
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

        /* Rejected verification check — block login */
        if (
          !matched.isAdmin &&
          matched.user.verificationStatus === "rejected"
        ) {
          Toast.error(
            "Your verification was rejected. Contact Admin.",
            "Verification rejected",
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

        var initialView = "student";
        if (matched.isAdmin) {
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
   Register — collects details and generates BOTH email + phone OTPs
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
      email: [Rules.required, Rules.email],
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
        email: data.get("email"),
        phone: data.get("phone"),
        faculty: data.get("faculty"),
        department: data.get("department"),
        level: data.get("level"),
        matric: data.get("matric"),
        password: data.get("password"),
        emailCode: String(Math.floor(1000 + Math.random() * 9000)),
        phoneCode: String(Math.floor(100000 + Math.random() * 900000)),
        emailVerified: false,
      };
      Store.set("pending_registration", pending);
      Toast.info(
        "A 4-digit code has been sent to your email (simulated).",
        "Check your email",
      );
      setTimeout(() => {
        window.location.href = "email-verification.html";
      }, 900);
    },
  );
}

/* -------------------------------------------------------------------------
   Email verification — verify 4-digit code, then redirect to phone step
   ------------------------------------------------------------------------- */
function initEmailVerificationPage() {
  /* Only run on the email verification page */
  if (!window.location.pathname.endsWith("email-verification.html")) return;

  const container = document.getElementById("otp-container");
  if (!container) return;

  const pending = Store.get("pending_registration");
  if (!pending) {
    window.location.href = "register.html";
    return;
  }

  initOtpInputs(container);

  const hint = document.getElementById("otp-hint");
  if (hint) hint.textContent = pending.emailCode;

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

      if (entered !== pending.emailCode) {
        Toast.error(
          "The code you entered does not match. Please try again.",
          "Verification failed",
        );
        return;
      }

      pending.emailVerified = true;
      Store.set("pending_registration", pending);

      Toast.success(
        "Email verified. Now let's verify your phone number.",
        "Email verified",
      );
      setTimeout(() => {
        window.location.href = "phone-verification.html";
      }, 800);
    }, 600);
  });

  const resend = document.getElementById("otp-resend");
  if (resend) {
    resend.addEventListener("click", (e) => {
      e.preventDefault();
      pending.emailCode = String(Math.floor(1000 + Math.random() * 9000));
      Store.set("pending_registration", pending);
      if (hint) hint.textContent = pending.emailCode;
      Toast.info(
        "A new verification code has been sent (simulated).",
        "Code resent",
      );
    });
  }
}

/* -------------------------------------------------------------------------
   Phone verification — verify 6-digit code, then create the account
   ------------------------------------------------------------------------- */
function initPhoneVerificationPage() {
  /* Only run on the phone verification page */
  if (!window.location.pathname.endsWith("phone-verification.html")) return;

  const container = document.getElementById("otp-container");
  if (!container) return;

  const pending = Store.get("pending_registration");
  if (!pending) {
    window.location.href = "register.html";
    return;
  }
  if (!pending.emailVerified) {
    /* Skip back to email step if it wasn't done */
    window.location.href = "email-verification.html";
    return;
  }

  initOtpInputs(container);

  const hint = document.getElementById("otp-hint");
  if (hint) hint.textContent = pending.phoneCode;

  const phoneDisplay = document.getElementById("phone-display");
  if (phoneDisplay) phoneDisplay.textContent = pending.phone;

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

      if (entered !== pending.phoneCode) {
        Toast.error(
          "The code you entered does not match. Please try again.",
          "Verification failed",
        );
        return;
      }

      /* Create the student account — pending student-detail verification */
      const newStudent = {
        id: "STU-" + Date.now(),
        firstName: pending.firstName,
        otherName: pending.otherName || "",
        lastName: pending.lastName,
        username: pending.username,
        email: pending.email,
        phone: pending.phone,
        faculty: pending.faculty,
        department: pending.department,
        level: pending.level,
        matric: pending.matric,
        password: pending.password,
        association: "",
        associationFull: "",
        position: "",
        avatar: "",
        status: "active",
        role: "student",
        verificationStatus: "pending",
        isLeader: false,
        isEmergencyContact: false,
        emergencyCategory: "",
        joined: new Date().toISOString().slice(0, 10),
      };

      /* Persist to the registered_students bucket */
      var registered = Store.get("registered_students", []) || [];
      registered.unshift(newStudent);
      Store.set("registered_students", registered);

      Store.remove("pending_registration");

      Toast.success(
        "Account created. Please wait for Admin to verify your student details.",
        "Welcome to Campus Space",
      );

      Auth.save(newStudent);

      setTimeout(() => {
        window.location.href = "../student/dashboard.html";
      }, 1200);
    }, 600);
  });

  const resend = document.getElementById("otp-resend");
  if (resend) {
    resend.addEventListener("click", (e) => {
      e.preventDefault();
      pending.phoneCode = String(Math.floor(100000 + Math.random() * 900000));
      Store.set("pending_registration", pending);
      if (hint) hint.textContent = pending.phoneCode;
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
   Page guard — role + verification enforced at page level
   ------------------------------------------------------------------------- */
function guardPage(requiredRole) {
  const session = Auth.current();
  const base = window.location.pathname.includes("/pages/") ? "../../" : "";

  if (!session) {
    window.location.href = base + "pages/auth/login.html";
    return false;
  }

  /* Admin deactivation check */
  if (session.role === "admin" || session.role === "super_admin") {
    const adminList = getAllAdminsForAuth();
    const record = adminList.find(
      (a) => a.id === session.id || a.username === session.username,
    );
    if (record && record.status === "deactivated") {
      if (session.studentId) {
        var studentRecord = getAllStudentsForAuth().find(function (s) {
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

  /* Page access check */
  if (requiredRole) {
    const isAdminPage = requiredRole === "admin";
    const isAdminSession =
      session.role === "admin" || session.role === "super_admin";

    if (isAdminPage) {
      if (!isAdminSession) {
        window.location.href =
          base + "pages/student/dashboard.html?unauthorized=1";
        return false;
      }
      if (session.viewMode === "student") {
        session.viewMode = "admin";
        Store.set("session", session);
      }
      return true;
    }

    if (requiredRole === "student") {
      if (isAdminSession && !session.studentId) {
        window.location.href = base + "pages/admin/dashboard.html";
        return false;
      }
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
  initPhoneVerificationPage();
  initForgotPasswordPage();
  initResetPasswordPage();
  initLogoutButtons();
});
