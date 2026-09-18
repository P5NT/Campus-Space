/* ==========================================================================
   CAMPUS SPACE — settings.js
   Settings page: toggle persistence, leader phone override, password change,
   account deactivation.

   Password change flow (3 steps, always ends in email verification):
     Step 1: Verify identity
       - Enter current password → correct → code sent
       - OR click "Forgot your password? Verify by email instead" → code sent
     Step 2: Enter 4-digit code sent to email
     Step 3: Set new password
   ========================================================================== */
"use strict";

(function () {
  if (window._settingsInit) return;
  window._settingsInit = true;

  function boot() {
    var session = typeof Auth !== "undefined" ? Auth.current() : null;
    if (!session) {
      window.location.href = "../auth/login.html";
      return;
    }

    if (typeof initAppShell === "function") initAppShell("student");

    var student =
      typeof DEMO_STUDENTS !== "undefined"
        ? DEMO_STUDENTS.find(function (s) {
            return s.username === session.username;
          })
        : null;

    var isLeader = student && student.isLeader === true;

    /* =====================================================================
       TOGGLES — persistence + leader overrides
       ===================================================================== */
    document
      .querySelectorAll(".toggle[data-setting]")
      .forEach(function (toggle) {
        var key = toggle.getAttribute("data-setting");
        var stored = Store.get(key, null);
        var initial;

        if (stored === null) {
          initial = toggle.getAttribute("aria-checked") === "true";
        } else {
          initial = stored === true;
        }
        toggle.setAttribute("aria-checked", String(initial));

        toggle.addEventListener("click", function () {
          /* Leaders cannot change certain settings */
          if (
            isLeader &&
            (key === "privacy_show_phone" ||
              key === "privacy_searchable" ||
              key === "notif_complaints")
          ) {
            var labels = {
              privacy_show_phone: "Leaders always display their phone number.",
              privacy_searchable: "Leaders always appear in student search.",
              notif_complaints: "Leaders always receive complaint updates.",
            };
            if (typeof Toast !== "undefined") {
              Toast.info(labels[key], "Required");
            }
            return;
          }

          var next = toggle.getAttribute("aria-checked") !== "true";
          toggle.setAttribute("aria-checked", String(next));
          Store.set(key, next);

          if (key === "privacy_show_phone" && student) {
            student.phoneVisible = next;
          }
          if (key === "privacy_searchable" && student) {
            student.searchable = next;
          }

          if (typeof Toast !== "undefined") {
            Toast.success("Preference updated.", "Saved");
          }
        });

        toggle.addEventListener("keydown", function (e) {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggle.click();
          }
        });
      });

    /* Leader overrides — force certain toggles to on and lock them */
    if (isLeader) {
      var leaderLockedKeys = [
        "privacy_show_phone",
        "privacy_searchable",
        "notif_complaints",
      ];
      var leaderMessages = {
        privacy_show_phone: "Leaders always display their phone number.",
        privacy_searchable: "Leaders always appear in student search.",
        notif_complaints: "Leaders always receive complaint updates.",
      };

      leaderLockedKeys.forEach(function (key) {
        var toggle = document.querySelector('[data-setting="' + key + '"]');
        if (!toggle) return;

        toggle.setAttribute("aria-checked", "true");
        toggle.setAttribute("disabled", "true");
        toggle.style.opacity = "0.55";
        toggle.style.cursor = "not-allowed";
        toggle.setAttribute("title", leaderMessages[key]);

        Store.set(key, true);

        var row = toggle.closest(".setting-row");
        if (row) {
          var desc = row.querySelector(".setting-row-info p");
          if (desc) {
            var original =
              desc.getAttribute("data-original-text") || desc.textContent;
            if (!desc.getAttribute("data-original-text")) {
              desc.setAttribute("data-original-text", original);
            }
            desc.innerHTML =
              original +
              ' <strong style="color:var(--brand-primary);">(Required for leaders)</strong>';
          }
        }
      });
    } else if (student) {
      var phoneToggle = document.querySelector(
        '[data-setting="privacy_show_phone"]',
      );
      if (phoneToggle) {
        var visible = student.phoneVisible === true;
        phoneToggle.setAttribute("aria-checked", String(visible));
        Store.set("privacy_show_phone", visible);
      }
    }

    /* Settings navigation scroll + active state */
    document.querySelectorAll(".settings-nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-target"));
        if (target)
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelectorAll(".settings-nav-item").forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");
      });
    });

    /* =====================================================================
       CHANGE PASSWORD — 3-step flow
       ===================================================================== */
    var cpModal = document.getElementById("change-password-modal");
    var cpSteps = document.getElementById("cp-steps");
    var cpStep1 = document.getElementById("cp-step-1");
    var cpStep2 = document.getElementById("cp-step-2");
    var cpStep3 = document.getElementById("cp-step-3");
    var cpCurrent = document.getElementById("cp-current");
    var cpForgotBtn = document.getElementById("cp-forgot-password");
    var cpEmailMask = document.getElementById("cp-email-mask");
    var cpOtpHint = document.getElementById("cp-otp-hint");
    var cpOtpWrap = document.getElementById("cp-otp-container");
    var cpOtpError = document.getElementById("cp-otp-error");
    var cpResend = document.getElementById("cp-otp-resend");
    var cpBackTo1 = document.getElementById("cp-back-to-1");
    var cpBackTo2 = document.getElementById("cp-back-to-2");
    var cpNew = document.getElementById("cp-new");

    if (cpModal && cpStep1) {
      /* ---- Current expected password for the signed-in user ---- */
      function expectedPassword() {
        var s = typeof Auth !== "undefined" ? Auth.current() : null;
        if (!s) return null;
        if (s.role === "admin" || s.role === "super_admin") {
          var admin =
            typeof DEMO_ADMINS !== "undefined"
              ? DEMO_ADMINS.find(function (a) {
                  return a.username === s.username;
                })
              : null;
          if (!admin) return null;
          return admin.role === "super_admin"
            ? DEMO_CREDENTIALS.superadmin.password
            : DEMO_CREDENTIALS.admin.password;
        }
        return DEMO_CREDENTIALS.student.password;
      }

      /* ---- Get the signed-in student's email for the "we sent to..." line ---- */
      function getSessionEmail() {
        var s = typeof Auth !== "undefined" ? Auth.current() : null;
        if (!s) return "";
        var st =
          typeof DEMO_STUDENTS !== "undefined"
            ? DEMO_STUDENTS.find(function (x) {
                return x.username === s.username;
              })
            : null;
        if (st && st.email) return st.email;
        return s.username + "@oaustech.edu.ng";
      }

      function maskEmail(email) {
        if (!email) return "your email";
        var parts = email.split("@");
        if (parts.length !== 2) return email;
        var local = parts[0];
        var visible = local.slice(0, 2);
        return visible + "••••@" + parts[1];
      }

      /* ---- Error helpers for the current-password field ---- */
      function flagCurrentPwError(msg) {
        var field = cpCurrent.closest(".field");
        if (!field) return;
        field.classList.add("is-invalid");
        var errEl = field.querySelector(".field-error span");
        if (errEl && msg) errEl.textContent = msg;
        cpCurrent.focus();
      }
      function clearCurrentPwError() {
        var field = cpCurrent.closest(".field");
        if (!field) return;
        field.classList.remove("is-invalid");
        var errEl = field.querySelector(".field-error span");
        if (errEl) errEl.textContent = "Please enter your current password.";
      }

      cpCurrent.addEventListener("input", function () {
        var field = cpCurrent.closest(".field");
        if (
          field &&
          field.classList.contains("is-invalid") &&
          cpCurrent.value.length > 0
        ) {
          clearCurrentPwError();
        }
      });

      /* ---- Step indicator ---- */
      function showStep(n) {
        [cpStep1, cpStep2, cpStep3].forEach(function (f, i) {
          if (!f) return;
          f.hidden = i + 1 !== n;
        });
        if (cpSteps) {
          cpSteps.querySelectorAll(".cp-step").forEach(function (el) {
            var step = parseInt(el.getAttribute("data-step"), 10);
            el.classList.toggle("is-active", step === n);
            el.classList.toggle("is-done", step < n);
          });
        }
      }

      /* ---- Reset the whole flow ---- */
      function resetFlow() {
        if (cpStep1) cpStep1.reset();
        if (cpStep3) cpStep3.reset();
        if (cpOtpWrap) {
          cpOtpWrap.querySelectorAll(".otp-input").forEach(function (i) {
            i.value = "";
          });
        }
        if (cpOtpError) cpOtpError.classList.remove("is-visible");
        clearCurrentPwError();
        var reqsEl = cpStep3 ? cpStep3.querySelector(".pw-reqs") : null;
        var strengthEl = cpStep3 ? cpStep3.querySelector(".pw-strength") : null;
        if (reqsEl)
          reqsEl.querySelectorAll("li").forEach(function (li) {
            li.classList.remove("met");
          });
        if (strengthEl) strengthEl.setAttribute("data-level", "0");
        showStep(1);
      }

      /* Reset the flow only when the modal transitions from closed to open.
         We use a flag to avoid re-triggering on every class change. */
      var wasOpen = false;
      var observer = new MutationObserver(function () {
        var isOpen = cpModal.classList.contains("is-open");
        if (isOpen && !wasOpen) {
          wasOpen = true;
          resetFlow();
        } else if (!isOpen && wasOpen) {
          wasOpen = false;
        }
      });
      observer.observe(cpModal, {
        attributes: true,
        attributeFilter: ["class"],
      });

      /* ---- Code generation ---- */
      var currentCode = "";
      function generateCode() {
        currentCode = String(Math.floor(1000 + Math.random() * 9000));
        if (cpOtpHint) cpOtpHint.textContent = currentCode;
      }

      /* ---- OTP inputs ---- */
      if (typeof initOtpInputs === "function" && cpOtpWrap) {
        initOtpInputs(cpOtpWrap);
      }

      /* ---- Shared "send the code and go to Step 2" behaviour ---- */
      function advanceToCodeStep() {
        if (cpEmailMask) cpEmailMask.textContent = maskEmail(getSessionEmail());
        generateCode();
        Toast.info(
          "A 4-digit verification code has been sent to your email (simulated).",
          "Check your email",
        );
        showStep(2);
      }

      /* ---- STEP 1: verify current password ---- */
      if (typeof bindForm === "function") {
        bindForm(
          cpStep1,
          {
            currentPassword: [Rules.required],
          },
          function (data) {
            var entered = String(data.get("currentPassword") || "");
            var expected = expectedPassword();

            if (expected && entered !== expected) {
              flagCurrentPwError(
                "That password does not match our records. Please try again.",
              );
              Toast.error(
                "Current password is incorrect.",
                "Verification failed",
              );
              return;
            }

            advanceToCodeStep();
          },
        );
      }

      /* ---- "Forgot your password? Verify by email instead" ---- */
      if (cpForgotBtn) {
        cpForgotBtn.addEventListener("click", function (e) {
          e.preventDefault();

          /* Clear any current-password error and the field */
          clearCurrentPwError();
          if (cpCurrent) cpCurrent.value = "";

          /* Skip the password check entirely and go straight to the code step */
          advanceToCodeStep();
        });
      }

      /* ---- STEP 2: verify the code ---- */
      cpStep2.addEventListener("submit", function (e) {
        e.preventDefault();
        var entered =
          typeof getOtpValue === "function" && cpOtpWrap
            ? getOtpValue(cpOtpWrap)
            : "";

        if (entered !== currentCode) {
          if (cpOtpError) cpOtpError.classList.add("is-visible");
          Toast.error(
            "That code is not correct. Please try again.",
            "Verification failed",
          );
          return;
        }

        if (cpOtpError) cpOtpError.classList.remove("is-visible");
        Toast.success("Email verified.", "Code accepted");
        showStep(3);
      });

      if (cpResend) {
        cpResend.addEventListener("click", function (e) {
          e.preventDefault();
          generateCode();
          Toast.info(
            "A new verification code has been sent (simulated).",
            "Code resent",
          );
        });
      }

      if (cpBackTo1) {
        cpBackTo1.addEventListener("click", function (e) {
          e.preventDefault();
          resetFlow();
        });
      }

      if (cpBackTo2) {
        cpBackTo2.addEventListener("click", function (e) {
          e.preventDefault();
          showStep(2);
        });
      }

      /* ---- STEP 3: set new password ---- */
      var reqsEl = cpStep3.querySelector(".pw-reqs");
      var strengthEl = cpStep3.querySelector(".pw-strength");

      if (cpNew && typeof initPasswordFeedback === "function") {
        initPasswordFeedback(cpNew, { reqsEl: reqsEl, strengthEl: strengthEl });
      }

      if (typeof bindForm === "function") {
        bindForm(
          cpStep3,
          {
            newPassword: [Rules.required, Rules.password],
            confirmPassword: [Rules.required, Rules.match(cpNew)],
          },
          function (data) {
            var newPwValue = String(data.get("newPassword") || "");

            /* If the user came via the "forgot password" path, cpCurrent
               will be empty — skip the "must differ from current" check
               in that case, since we don't have the current password. */
            var currentValue = cpCurrent ? cpCurrent.value || "" : "";
            if (currentValue && newPwValue === currentValue) {
              var newField = cpNew.closest(".field");
              if (newField) {
                newField.classList.add("is-invalid");
                var err = newField.querySelector(".field-error span");
                if (err)
                  err.textContent =
                    "Your new password must be different from your current password.";
                cpNew.focus();
              }
              return;
            }

            /* Success */
            Toast.success(
              "Your password has been updated.",
              "Password changed",
            );
            if (typeof Modal !== "undefined")
              Modal.close("change-password-modal");

            /* Clear the form */
            if (cpStep1) cpStep1.reset();
            if (cpStep3) cpStep3.reset();
            if (reqsEl)
              reqsEl.querySelectorAll("li").forEach(function (li) {
                li.classList.remove("met");
              });
            if (strengthEl) strengthEl.setAttribute("data-level", "0");
          },
        );
      }
    }

    /* =====================================================================
       DEACTIVATE ACCOUNT
       ===================================================================== */
    var deactivateBtn = document.getElementById("deactivate-account");
    if (deactivateBtn && typeof Confirmation !== "undefined") {
      deactivateBtn.addEventListener("click", function () {
        Confirmation.confirm({
          title: "Deactivate your account?",
          message:
            "Your profile will be hidden from other students. You can request reactivation by contacting Admin. This does not delete your records.",
          confirmLabel: "Deactivate account",
          variant: "danger",
        }).then(function (ok) {
          if (!ok) return;
          if (typeof Toast !== "undefined") {
            Toast.warning(
              "Deactivation request submitted (simulated).",
              "Account deactivated",
            );
          }
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
