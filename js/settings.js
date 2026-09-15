/* ==========================================================================
   CAMPUS SPACE — settings.js
   Settings page: toggle persistence, leader phone override, password change,
   account deactivation.

   Toggle keys:
   - privacy_show_phone
   - privacy_show_matric
   - privacy_searchable
   - notif_admin
   - notif_replies
   - notif_resources
   - notif_complaints
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

    /* ---------- Wire all toggles ---------- */
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

          /* Phone visibility also writes back to the student record */
          if (key === "privacy_show_phone" && student) {
            student.phoneVisible = next;
          }

          /* Searchability also writes back to the student record */
          if (key === "privacy_searchable" && student) {
            student.searchable = next;
          }

          if (typeof Toast !== "undefined") {
            Toast.success("Preference updated.", "Saved");
          }
        });

        /* Keyboard support */
        toggle.addEventListener("keydown", function (e) {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggle.click();
          }
        });
      });

    /* ---------- Leader overrides ----------
       Leaders cannot disable:
       - privacy_show_phone       (contactability is required)
       - privacy_searchable       (leaders must always be findable)
       - notif_complaints         (must respond to complaints) */
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

        // Force to on
        toggle.setAttribute("aria-checked", "true");
        toggle.setAttribute("disabled", "true");
        toggle.style.opacity = "0.55";
        toggle.style.cursor = "not-allowed";
        toggle.setAttribute("title", leaderMessages[key]);

        // Force the storage value
        Store.set(key, true);

        // Update the description paragraph next to it
        var row = toggle.closest(".setting-row");
        if (row) {
          var desc = row.querySelector(".setting-row-info p");
          if (desc) {
            // Preserve any existing description, then append a note
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
      /* Regular student — reflect their actual state for the phone toggle */
      var phoneToggle = document.querySelector(
        '[data-setting="privacy_show_phone"]',
      );
      if (phoneToggle) {
        var visible = student.phoneVisible === true;
        phoneToggle.setAttribute("aria-checked", String(visible));
        Store.set("privacy_show_phone", visible);
      }
    }

    /* ---------- Settings navigation scroll & active ---------- */
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

    /* ---------- Change password form ---------- */
    var pwForm = document.getElementById("change-password-form");
    if (pwForm && typeof bindForm === "function") {
      var newPw = pwForm.querySelector('[name="newPassword"]');
      var reqsEl = pwForm.querySelector(".pw-reqs");
      var strengthEl = pwForm.querySelector(".pw-strength");

      if (newPw && typeof initPasswordFeedback === "function") {
        initPasswordFeedback(newPw, { reqsEl: reqsEl, strengthEl: strengthEl });
      }

      bindForm(
        pwForm,
        {
          currentPassword: [Rules.required],
          newPassword: [Rules.required, Rules.password],
          confirmPassword: [Rules.required, Rules.match(newPw)],
        },
        function () {
          if (typeof Toast !== "undefined") {
            Toast.success(
              "Your password has been updated.",
              "Password changed",
            );
          }
          pwForm.reset();
          if (reqsEl)
            reqsEl.querySelectorAll("li").forEach(function (li) {
              li.classList.remove("met");
            });
          if (strengthEl) strengthEl.setAttribute("data-level", "0");
        },
      );
    }

    /* ---------- Deactivate account ---------- */
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
