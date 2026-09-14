/* ==========================================================================
   CAMPUS SPACE — auth.js
   Frontend authentication simulation: login, register, verification,
   password reset, session handling.
   ========================================================================== */
"use strict";

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
    Store.set("session", {
      id: user.id,
      username: user.username,
      role: user.role || "student",
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username,
      avatar: user.avatar || "",
      loggedAt: Date.now(),
    });
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
   Login
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

      if (
        typeof DEMO_STUDENTS === "undefined" ||
        typeof DEMO_ADMINS === "undefined"
      ) {
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
        const admin = DEMO_ADMINS.find(
          (a) =>
            a.username.toLowerCase() === id || a.email.toLowerCase() === id,
        );

        let matched = null;
        if (student) {
          matched = {
            user: student,
            expected: DEMO_CREDENTIALS.student.password,
          };
        } else if (admin) {
          const creds =
            admin.role === "super_admin"
              ? DEMO_CREDENTIALS.superadmin
              : DEMO_CREDENTIALS.admin;
          matched = { user: admin, expected: creds.password };
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

        if (matched.user.status === "deactivated") {
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

        Auth.save(matched.user);
        Toast.success("Signed in successfully. Welcome back!", "Welcome");

        setTimeout(() => Auth.redirectByRole(matched.user.role), 500);
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
      "[auth.js] DEMO_FACULTIES is not loaded — the faculty dropdown will be empty. Ensure data/faculties.js is included on this page.",
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
   Guard
   ------------------------------------------------------------------------- */
function guardPage(requiredRole) {
  const session = Auth.current();
  const base = window.location.pathname.includes("/pages/") ? "../../" : "";
  if (!session) {
    window.location.href = base + "pages/auth/login.html";
    return false;
  }
  if (requiredRole && session.role !== requiredRole) {
    if (session.role === "student" && requiredRole !== "student") {
      window.location.href =
        base + "pages/student/dashboard.html?unauthorized=1";
    } else if (
      (session.role === "admin" || session.role === "super_admin") &&
      requiredRole === "student"
    ) {
      window.location.href = base + "pages/admin/dashboard.html";
    }
    return false;
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
