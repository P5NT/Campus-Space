/* ==========================================================================
   CAMPUS SPACE — password-change.js
   Multi-step password change modal.

   Flow:
     1. Verify     — student enters current password
     2. Confirm    — 6-digit OTP sent to email
     3. Update     — new password + confirm, with live strength bar

   Security:
     - Current password is compared against the student's stored password
     - OTP has a 5-minute validity window (per page session)
     - New password must meet the standard requirements
     - Old password is stored in student_overrides for audit? No — passwords
       are kept only in the base student record.
   ========================================================================== */
"use strict";

const PasswordChange = (() => {
  /* Get the effective password for a student, considering overrides */
  function getCurrentPassword(student) {
    var o = Store.get("student_overrides", {}) || {};
    var edit = (o.edits && o.edits[student.id]) || {};
    return edit.password || student.password || "Campus@2026";
  }

  /* Persist the new password for a student */
  function setNewPassword(studentId, newPassword) {
    var o = Store.get("student_overrides", {}) || {};
    o.edits = o.edits || {};
    o.edits[studentId] = Object.assign({}, o.edits[studentId] || {}, {
      password: newPassword,
      passwordChangedAt: Date.now(),
    });
    Store.set("student_overrides", o);

    /* Also update registered_students if the student was a real signup */
    var registered = Store.get("registered_students", []) || [];
    var changed = false;
    registered.forEach(function (s) {
      if (s.id === studentId) {
        s.password = newPassword;
        changed = true;
      }
    });
    if (changed) Store.set("registered_students", registered);
  }

  return {
    getCurrentPassword: getCurrentPassword,
    setNewPassword: setNewPassword,
  };
})();

/* ==========================================================================
   UI INITIALIZATION — runs on the Settings page
   ========================================================================== */
function initPasswordChange(session, student) {
  if (!student) return;

  var modal = document.getElementById("change-password-modal");
  if (!modal) return;

  var openBtn = document.getElementById("open-change-password");
  var stepEls = modal.querySelectorAll(".cp-step");
  var forms = {
    1: document.getElementById("cp-step-1"),
    2: document.getElementById("cp-step-2"),
    3: document.getElementById("cp-step-3"),
  };

  /* State */
  var currentStep = 1;
  var generatedOtp = null;
  var otpGeneratedAt = null;
  var verifiedCurrentPassword = null;

  /* ------------------------------------------------------------------
     STEP NAVIGATION
     ------------------------------------------------------------------ */
  function goToStep(n) {
    currentStep = n;

    /* Update step indicators */
    stepEls.forEach(function (el) {
      var stepNum = parseInt(el.getAttribute("data-step"), 10);
      el.classList.remove("is-active", "is-done");
      if (stepNum < n) el.classList.add("is-done");
      else if (stepNum === n) el.classList.add("is-active");
      /* Reset the checkmark for completed steps */
      var num = el.querySelector(".cp-step-num");
      if (stepNum < n && num)
        num.innerHTML = '<i class="fa-solid fa-check"></i>';
      else if (num) num.textContent = String(stepNum);
    });

    /* Show only the current form */
    Object.keys(forms).forEach(function (k) {
      forms[k].hidden = parseInt(k, 10) !== n;
    });

    /* Focus the first input of the current step */
    var firstInput = forms[n].querySelector("input");
    if (firstInput)
      setTimeout(function () {
        firstInput.focus();
      }, 100);
  }

  /* ------------------------------------------------------------------
     OPEN MODAL — always start at step 1
     ------------------------------------------------------------------ */
  function openModal() {
    currentStep = 1;
    generatedOtp = null;
    otpGeneratedAt = null;
    verifiedCurrentPassword = null;

    /* Reset all forms */
    Object.keys(forms).forEach(function (k) {
      forms[k].reset();
      forms[k].querySelectorAll(".field").forEach(function (f) {
        f.classList.remove("is-invalid", "is-valid");
      });
    });
    document.getElementById("cp-otp-error").classList.remove("is-visible");

    /* Reset password feedback */
    var pw = document.getElementById("cp-new");
    var reqsEl = forms[3].querySelector(".pw-reqs");
    var strengthEl = forms[3].querySelector(".pw-strength");
    if (reqsEl)
      reqsEl.querySelectorAll("li").forEach(function (li) {
        li.classList.remove("met");
      });
    if (strengthEl) strengthEl.setAttribute("data-level", "0");

    goToStep(1);
    Modal.open("change-password-modal");
  }

  if (openBtn) openBtn.addEventListener("click", openModal);

  /* ------------------------------------------------------------------
     STEP 1 — Verify current password
     ------------------------------------------------------------------ */
  bindForm(
    forms[1],
    {
      currentPassword: [Rules.required],
    },
    function (data) {
      var entered = String(data.get("currentPassword") || "");
      var expected = PasswordChange.getCurrentPassword(student);

      if (entered !== expected) {
        /* Mark the field invalid and show an inline error */
        var field = forms[1].querySelector(".field");
        field.classList.add("is-invalid");
        var errEl = field.querySelector(".field-error span");
        if (errEl)
          errEl.textContent =
            "That password doesn't match our records. Please try again.";
        Toast.error("Incorrect password.", "Verification failed");
        return;
      }

      /* Correct — generate OTP and move to step 2 */
      verifiedCurrentPassword = entered;
      generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      otpGeneratedAt = Date.now();

      var hint = document.getElementById("cp-otp-hint");
      if (hint) hint.textContent = generatedOtp;

      var target = document.getElementById("cp-email-target");
      if (target) target.textContent = student.email || "your email";

      /* Reset OTP inputs */
      var otpContainer = document.getElementById("cp-otp-container");
      otpContainer.querySelectorAll(".otp-input").forEach(function (i) {
        i.value = "";
      });
      document.getElementById("cp-otp-error").classList.remove("is-visible");

      Toast.info(
        "A 6-digit code has been sent to your email (simulated).",
        "Check your email",
      );
      goToStep(2);
    },
  );

  /* ------------------------------------------------------------------
     STEP 2 — Verify OTP
     ------------------------------------------------------------------ */
  var otpContainer = document.getElementById("cp-otp-container");
  if (typeof initOtpInputs === "function") initOtpInputs(otpContainer);

  bindForm(forms[2], {}, function () {
    var entered =
      typeof getOtpValue === "function"
        ? getOtpValue(otpContainer)
        : Array.from(otpContainer.querySelectorAll(".otp-input"))
            .map(function (i) {
              return i.value;
            })
            .join("");

    var errEl = document.getElementById("cp-otp-error");

    /* Check code */
    if (entered !== generatedOtp) {
      errEl.querySelector("span").textContent =
        "The code you entered doesn't match. Try again.";
      errEl.classList.add("is-visible");
      return;
    }

    /* Check expiry — 5 minutes */
    if (Date.now() - otpGeneratedAt > 5 * 60 * 1000) {
      errEl.querySelector("span").textContent =
        "That code has expired. Go back and request a new one.";
      errEl.classList.add("is-visible");
      return;
    }

    errEl.classList.remove("is-visible");
    Toast.success("Identity verified.", "Verified");
    goToStep(3);
  });

  /* Back button from step 2 */
  var backBtn = document.getElementById("cp-step-2-back");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      generatedOtp = null;
      otpGeneratedAt = null;
      goToStep(1);
    });
  }

  /* ------------------------------------------------------------------
     STEP 3 — New password
     ------------------------------------------------------------------ */
  var newPw = document.getElementById("cp-new");
  var confirmPw = document.getElementById("cp-confirm");
  var reqsEl = forms[3].querySelector(".pw-reqs");
  var strengthEl = forms[3].querySelector(".pw-strength");

  if (typeof initPasswordFeedback === "function") {
    initPasswordFeedback(newPw, { reqsEl: reqsEl, strengthEl: strengthEl });
  }

  bindForm(
    forms[3],
    {
      newPassword: [Rules.required, Rules.password],
      confirmPassword: [Rules.required, Rules.match(newPw)],
    },
    function (data) {
      var newPassword = String(data.get("newPassword") || "");

      /* Guard: don't allow reusing the current password */
      if (newPassword === verifiedCurrentPassword) {
        Toast.warning(
          "Choose a password different from your current one.",
          "Same as current",
        );
        return;
      }

      /* Persist */
      PasswordChange.setNewPassword(student.id, newPassword);

      /* Add an in-platform notification to the student's own feed */
      if (typeof Notifications !== "undefined" && Notifications.all) {
        var notifs = Notifications.all();
        notifs.unshift({
          id: "n-pw-" + Date.now(),
          type: "security",
          icon: "fa-key",
          tone: "brand",
          title: "Password changed",
          body: "Your Campus Space password was updated successfully.",
          link: "settings.html",
          time: Date.now(),
          read: false,
        });
        Store.set("notifications", notifs);
      }

      Modal.close("change-password-modal");
      Toast.success("Your password has been updated.", "Password changed");
    },
  );

  /* ------------------------------------------------------------------
     ROUTE TO FORGOT PASSWORD — close the modal before navigating
     ------------------------------------------------------------------ */
  /* Forgot password — close the modal first, then navigate programmatically.
     This avoids the browser cancelling the click when the anchor's
     parent becomes hidden mid-event. */
  var forgotLink = document.getElementById("cp-forgot-password");
  if (forgotLink) {
    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();
      Modal.close("change-password-modal");
      setTimeout(function () {
        window.location.href = "../auth/forgot-password.html";
      }, 150);
    });
  }

  /* ------------------------------------------------------------------
     RESET MODAL STATE ON CLOSE
     ------------------------------------------------------------------ */
  modal.addEventListener("click", function (e) {
    if (e.target.closest("[data-modal-close]")) {
      generatedOtp = null;
      otpGeneratedAt = null;
      verifiedCurrentPassword = null;
      currentStep = 1;
    }
  });
}
