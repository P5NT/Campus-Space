/* ==========================================================================
   CAMPUS SPACE — validation.js
   Reusable, self-clearing form validation for all Campus Space forms.
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   Validators — individual rule functions returning true/false
   ------------------------------------------------------------------------- */
const Rules = {
  required: (v) => v != null && String(v).trim().length > 0,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""),
  phone: (v) => /^[0-9+\-\s()]{7,17}$/.test((v || "").trim()),
  username: (v) => /^[a-zA-Z0-9_]{3,20}$/.test(v || ""),
  name: (v) => /^[a-zA-Z'\- ]{2,40}$/.test((v || "").trim()),
  matric: (v) => /^[A-Za-z0-9/\-]{4,20}$/.test((v || "").trim()),
  minLen: (n) => (v) => (v || "").length >= n,
  maxLen: (n) => (v) => (v || "").length <= n,
  password: (v) =>
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(v || ""),
  match: (otherEl) => (v) => v === otherEl.value,
  numeric: (v) => /^\d+(\.\d+)?$/.test(String(v || "").trim()),
  selected: (v) => v && v !== "",
};

/* -------------------------------------------------------------------------
   validateField
   ------------------------------------------------------------------------- */
function validateField(fieldEl, ruleFns, customMessage) {
  if (!fieldEl) return true;
  const input = fieldEl.querySelector("input, select, textarea");
  if (!input) return true;

  const value = input.type === "checkbox" ? input.checked : input.value;
  const ruleList = Array.isArray(ruleFns) ? ruleFns : [ruleFns];
  const passed = ruleList.every((fn) => fn(value));

  fieldEl.classList.toggle("is-invalid", !passed);
  fieldEl.classList.toggle("is-valid", passed && String(value).length > 0);

  const errEl = fieldEl.querySelector(".field-error span");
  const target = errEl || fieldEl.querySelector(".field-error");
  if (target && customMessage && !passed) target.textContent = customMessage;

  return passed;
}

/* -------------------------------------------------------------------------
   bindForm
   Attaches submit handling, live validation, and — critically — prevents
   the native browser form submission (page reload) on every page.
   ------------------------------------------------------------------------- */
function bindForm(formEl, config, onSubmit) {
  if (!formEl) return;

  // --- GUARANTEED preventDefault (capture phase) ---------------------------
  formEl.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
    },
    true,
  );

  const fieldFor = (input) => input.closest(".field") || input.parentElement;

  // --- Live per-field validation ------------------------------------------
  Object.keys(config).forEach((name) => {
    const input = formEl.querySelector(`[name="${name}"]`);
    if (!input) return;
    const field = fieldFor(input);
    const rules = config[name];

    const run = () => {
      const msg = input.getAttribute("data-error") || "";
      validateField(field, rules, msg);
    };

    input.addEventListener("input", run);
    input.addEventListener("blur", run);
    input.addEventListener("change", run);

    if (input.value) run();
  });

  // --- Submit handling -----------------------------------------------------
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();

    let ok = true;
    Object.keys(config).forEach((name) => {
      const input = formEl.querySelector(`[name="${name}"]`);
      if (!input) return;
      const field = fieldFor(input);
      const msg = input.getAttribute("data-error") || "";
      if (!validateField(field, config[name], msg)) ok = false;
    });

    if (!ok) {
      const firstInvalid = formEl.querySelector(
        ".field.is-invalid input, .field.is-invalid select, .field.is-invalid textarea",
      );
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    try {
      if (typeof onSubmit === "function") onSubmit(new FormData(formEl));
    } catch (err) {
      console.error("[bindForm] submit callback error:", err);
      if (typeof Toast !== "undefined") {
        Toast.error("Something went wrong. Please try again.", "Error");
      }
    }
  });
}

/* -------------------------------------------------------------------------
   initPasswordFeedback — live strength bar + requirement list
   ------------------------------------------------------------------------- */
function initPasswordFeedback(inputEl, { reqsEl, strengthEl } = {}) {
  if (!inputEl) return;

  const update = () => {
    const { checks, level } = scorePassword(inputEl.value);

    if (reqsEl) {
      const map = {
        length: checks.length,
        upper: checks.upper,
        lower: checks.lower,
        number: checks.number,
        special: checks.special,
      };
      Object.entries(map).forEach(([key, met]) => {
        const li = reqsEl.querySelector(`[data-req="${key}"]`);
        if (li) li.classList.toggle("met", met);
      });
    }

    if (strengthEl) strengthEl.setAttribute("data-level", String(level));
  };

  inputEl.addEventListener("input", update);
  update();
}

/* -------------------------------------------------------------------------
   OTP input group
   ------------------------------------------------------------------------- */
function initOtpInputs(container) {
  if (!container) return;
  const inputs = Array.from(container.querySelectorAll(".otp-input"));

  inputs.forEach((inp, i) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
    });
    inp.addEventListener("paste", (e) => {
      const text = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/\D/g, "");
      if (!text) return;
      e.preventDefault();
      inputs.forEach((box, j) => {
        box.value = text[j] || "";
      });
      inputs[Math.min(text.length, inputs.length - 1)].focus();
    });
  });

  if (inputs[0]) inputs[0].focus();
}

function getOtpValue(container) {
  return Array.from(container.querySelectorAll(".otp-input"))
    .map((i) => i.value)
    .join("");
}
