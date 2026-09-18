/* ==========================================================================
   CAMPUS SPACE — auth.js
   Frontend authentication simulation:
     - Login (student / admin / super admin)
     - Registration (with faculty → department cascade)
     - Email verification (registration + password reset modes)
     - Forgot password (email → code → verify → reset)
     - Password reset (only after verification)
     - Session handling, logout, role-based redirect
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

/* ==========================================================================
   LOGIN
   ========================================================================== */
function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  /* Session-expired notice */
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

/* ==========================================================================
   REGISTER
   ========================================================================== */
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

  /* Populate faculty dropdown */
  DEMO_FACULTIES.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.name;
    opt.textContent = f.name;
    facultySelect.appendChild(opt);
  });

  /* Department depends on faculty */
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

  /* Live password feedback */
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

/* ==========================================================================
   EMAIL VERIFICATION
   Handles two modes:
     - Registration: no query param
     - Password reset: ?mode=reset
   ========================================================================== */
function initEmailVerificationPage() {
  const container = document.getElementById("otp-container");
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const mode = params.get("mode"); /* null or "reset" */

  const pending =
    mode === "reset"
      ? Store.get("pending_password_reset")
      : Store.get("pending_registration");

  /* No pending record for this mode → bounce back */
  if (!pending) {
    window.location.href =
      mode === "reset" ? "forgot-password.html" : "register.html";
    return;
  }

  /* Reset mode: swap the copy */
  if (mode === "reset") {
    const titleEl = document.getElementById("verify-title");
    const subtitleEl = document.getElementById("verify-subtitle");
    const asideTitle = document.getElementById("aside-title");
    const asideCopy = document.getElementById("aside-copy");

    if (titleEl) titleEl.textContent = "Enter verification code";
    if (subtitleEl) {
      subtitleEl.textContent =
        "We sent a 4-digit code to " +
        (pending.email || "your email") +
        ". Enter it to reset your password.";
    }
    if (asideTitle) asideTitle.textContent = "Verify your identity.";
    if (asideCopy) {
      asideCopy.textContent =
        "Enter the 4-digit code we just sent to your email to continue resetting your password.";
    }
  }

  /* OTP inputs + demo hint */
  initOtpInputs(container);
  const hint = document.getElementById("otp-hint");
  if (hint) hint.textContent = pending.code;

  /* Submit */
  const form = document.getElementById("verify-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const entered = getOtpValue(container);
    const btn = document.getElementById("verify-submit");
    if (btn) {
      btn.classList.add("is-loading");
      btn.disabled = true;
    }

    setTimeout(() => {
      if (btn) {
        btn.classList.remove("is-loading");
        btn.disabled = false;
      }

      if (entered !== pending.code) {
        Toast.error(
          "The code you entered does not match. Please try again.",
          "Verification failed",
        );
        return;
      }

      if (mode === "reset") {
        /* Mark the reset request as verified, then move to the reset form */
        pending.verified = true;
        pending.verifiedAt = Date.now();
        Store.set("pending_password_reset", pending);

        Toast.success("Email verified. Choose your new password.", "Verified");
        setTimeout(() => {
          window.location.href = "reset-password.html";
        }, 700);
      } else {
        /* Registration: create session and go to dashboard */
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
        }, 700);
      }
    }, 600);
  });

  /* Resend */
  const resend = document.getElementById("otp-resend");
  if (resend) {
    resend.addEventListener("click", (e) => {
      e.preventDefault();
      pending.code = String(Math.floor(1000 + Math.random() * 9000));
      if (mode === "reset") Store.set("pending_password_reset", pending);
      else Store.set("pending_registration", pending);

      if (hint) hint.textContent = pending.code;
      Toast.info(
        "A new verification code has been sent (simulated).",
        "Code resent",
      );
    });
  }
}

/* ==========================================================================
   FORGOT PASSWORD
   ========================================================================== */
function initForgotPasswordPage() {
  const form = document.getElementById("forgot-form");
  if (!form) return;

  bindForm(form, { email: [Rules.required, Rules.email] }, (data) => {
    const email = String(data.get("email")).trim();

    const btn = document.getElementById("forgot-submit");
    if (btn) {
      btn.classList.add("is-loading");
      btn.disabled = true;
    }

    setTimeout(() => {
      /* Generate and store the code */
      const code = String(Math.floor(1000 + Math.random() * 9000));

      Store.set("pending_password_reset", {
        email: email,
        code: code,
        requestedAt: Date.now(),
        verified: false,
      });

      if (btn) {
        btn.classList.remove("is-loading");
        btn.disabled = false;
      }

      Toast.info(
        "A 4-digit code has been sent to " + email + " (simulated).",
        "Check your email",
      );

      /* Route to the shared verification page in reset mode */
      setTimeout(() => {
        window.location.href = "email-verification.html?mode=reset";
      }, 700);
    }, 700);
  });
}

/* ==========================================================================
   RESET PASSWORD
   Only accessible after email verification.
   ========================================================================== */
function initResetPasswordPage() {
  const form = document.getElementById("reset-form");
  if (!form) return;

  /* Verify that a pending reset record was marked as verified */
  const pending = Store.get("pending_password_reset");
  if (!pending || !pending.verified) {
    Toast.warning(
      "Please verify your email before setting a new password.",
      "Verification required",
    );
    window.location.href = "forgot-password.html";
    return;
  }

  /* Guard against an old verification sitting around for too long */
  const MAX_AGE = 15 * 60 * 1000; /* 15 minutes */
  if (pending.verifiedAt && Date.now() - pending.verifiedAt > MAX_AGE) {
    Store.remove("pending_password_reset");
    Toast.warning(
      "Your verification session expired. Please start again.",
      "Session expired",
    );
    window.location.href = "forgot-password.html";
    return;
  }

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
      /* Clear the pending record — the password is now (simulated) updated */
      Store.remove("pending_password_reset");

      Toast.success(
        "Your password has been reset. You can now sign in.",
        "Password updated",
      );
      setTimeout(() => {
        window.location.href = "reset-success.html";
      }, 800);
    },
  );
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */
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

/* ==========================================================================
   PAGE GUARD
   ========================================================================== */
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

/* ==========================================================================
   PAGE INIT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  initRegisterPage();
  initEmailVerificationPage();
  initForgotPasswordPage();
  initResetPasswordPage();
  initLogoutButtons();
});
