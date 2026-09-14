/* ==========================================================================
   CAMPUS SPACE — settings.js
   Settings toggles, persistence, session, deactivation flow.
   ========================================================================== */
"use strict";

function initSettingsPage() {
  const root = document.getElementById("settings-root");
  if (!root) return;

  // ---- Toggles ----
  document.querySelectorAll(".toggle").forEach((t) => {
    const key = t.getAttribute("data-setting");
    const stored = Store.get(key, null);
    const initial =
      stored === null ? t.getAttribute("aria-checked") === "true" : !!stored;
    t.setAttribute("aria-checked", String(initial));
    t.addEventListener("click", () => {
      const next = t.getAttribute("aria-checked") !== "true";
      t.setAttribute("aria-checked", String(next));
      Store.set(key, next);
      Toast.success("Preference updated.", "Saved");
    });
    t.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        t.click();
      }
    });
  });

  // ---- Change password form ----
  const pwForm = document.getElementById("change-password-form");
  if (pwForm) {
    const newPw = pwForm.querySelector('[name="newPassword"]');
    const reqsEl = pwForm.querySelector(".pw-reqs");
    const strengthEl = pwForm.querySelector(".pw-strength");
    initPasswordFeedback(newPw, { reqsEl, strengthEl });

    bindForm(
      pwForm,
      {
        currentPassword: [Rules.required],
        newPassword: [Rules.required, Rules.password],
        confirmPassword: [Rules.required, Rules.match(newPw)],
      },
      () => {
        Toast.success("Your password has been updated.", "Password changed");
        pwForm.reset();
        if (reqsEl)
          reqsEl
            .querySelectorAll("li")
            .forEach((li) => li.classList.remove("met"));
        if (strengthEl) strengthEl.setAttribute("data-level", "0");
      },
    );
  }

  // ---- Deactivate account ----
  const deactivateBtn = document.getElementById("deactivate-account");
  if (deactivateBtn) {
    deactivateBtn.addEventListener("click", async () => {
      const ok = await Confirmation.confirm({
        title: "Deactivate your account?",
        message:
          "Your profile will be hidden from other students. You can request reactivation by contacting Admin. This does not delete your records.",
        confirmLabel: "Deactivate account",
        variant: "danger",
      });
      if (!ok) return;
      Toast.warning(
        "Deactivation request submitted (simulated).",
        "Account deactivated",
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", initSettingsPage);
