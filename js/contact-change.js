/* ==========================================================================
   CAMPUS SPACE — contact-change.js
   Manages changes to a student's email or phone number.

   Flow:
     1. Student clicks Change on Settings → modal opens
     2. Enters new value → code generated → stored as pending
     3. Settings row shows "Pending" with Resend + Cancel
     4. Student verifies code → new value replaces old
     5. Old value moves into student.previousContacts (audit)

   Storage:
     cs_student_overrides.edits[studentId].pendingContactChange = {
       field: "email" | "phone",
       newValue: "...",
       code: "1234" | "123456",
       requestedAt: 1737...
     }
     cs_student_overrides.edits[studentId].previousContacts = [
       { field, value, replacedAt }
     ]

   The pending change does NOT update the student's email/phone until verified.
   Login continues to work with the old email/phone.
   ========================================================================== */
"use strict";

const ContactChange = (() => {
  const STORAGE_KEY = "student_overrides";

  function loadOverrides() {
    return Store.get(STORAGE_KEY, {}) || {};
  }
  function saveOverrides(o) {
    Store.set(STORAGE_KEY, o);
  }

  function editFor(studentId) {
    const o = loadOverrides();
    return (o.edits && o.edits[studentId]) || {};
  }

  function patchEdit(studentId, patch) {
    const o = loadOverrides();
    o.edits = o.edits || {};
    o.edits[studentId] = Object.assign({}, o.edits[studentId] || {}, patch);
    saveOverrides(o);
  }

  /* Returns the pending change for a student, or null */
  function getPending(studentId) {
    const e = editFor(studentId);
    return e.pendingContactChange || null;
  }

  /* Create a pending change — generates a code matching the field type */
  function startChange(studentId, field, newValue) {
    const code =
      field === "email"
        ? String(Math.floor(1000 + Math.random() * 9000))
        : String(Math.floor(100000 + Math.random() * 900000));

    patchEdit(studentId, {
      pendingContactChange: {
        field: field,
        newValue: newValue,
        code: code,
        requestedAt: Date.now(),
      },
    });
    return code;
  }

  /* Cancel a pending change */
  function cancelChange(studentId) {
    const o = loadOverrides();
    if (o.edits && o.edits[studentId]) {
      delete o.edits[studentId].pendingContactChange;
      saveOverrides(o);
    }
  }

  /* Apply the pending change — moves old value into previousContacts */
  function applyChange(studentId, currentStudent) {
    const pending = getPending(studentId);
    if (!pending) return null;

    const o = loadOverrides();
    const prev =
      (o.edits[studentId] && o.edits[studentId].previousContacts) || [];
    prev.push({
      field: pending.field,
      value: currentStudent[pending.field],
      replacedAt: Date.now(),
    });

    o.edits[studentId] = Object.assign({}, o.edits[studentId], {
      [pending.field]: pending.newValue,
      previousContacts: prev,
    });
    delete o.edits[studentId].pendingContactChange;
    saveOverrides(o);
    return pending.newValue;
  }

  return {
    getPending,
    startChange,
    cancelChange,
    applyChange,
  };
})();

/* ==========================================================================
   UI INITIALIZATION — runs on Settings page
   ========================================================================== */
function initContactChange(session, student) {
  if (!student) return;

  const body = document.getElementById("contact-body");
  if (!body) return;

  const changeModal = document.getElementById("change-contact-modal");
  const verifyModal = document.getElementById("verify-contact-modal");
  const changeForm = document.getElementById("change-contact-form");
  const verifyForm = document.getElementById("verify-contact-form");
  const ccTitle = document.getElementById("cc-title");
  const ccValueLabel = changeForm.querySelector("label[for='cc-value']");
  const ccValueInput = document.getElementById("cc-value");
  const vcTitle = document.getElementById("vc-title");
  const vcTarget = document.getElementById("vc-target");
  const vcHint = document.getElementById("vc-hint");
  const vcOtpContainer = document.getElementById("vc-otp-container");

  let currentField = "email"; /* which field we're changing */
  let currentOtpLength = 4;

  /* ------------------------------------------------------------------
     RENDER — display the Email and Phone rows with pending state
     ------------------------------------------------------------------ */
  function render() {
    /* Resolve effective values (overrides may have changed them) */
    const o = Store.get("student_overrides", {}) || {};
    const edit = (o.edits && o.edits[student.id]) || {};
    const effEmail = edit.email || student.email;
    const effPhone = edit.phone || student.phone;
    const pending = ContactChange.getPending(student.id);

    const emailRow = renderContactRow({
      field: "email",
      icon: "fa-envelope",
      label: "Email",
      value: effEmail,
      isPending: pending && pending.field === "email",
      newValue: pending && pending.field === "email" ? pending.newValue : null,
    });

    const phoneRow = renderContactRow({
      field: "phone",
      icon: "fa-phone",
      label: "Phone",
      value: effPhone,
      isPending: pending && pending.field === "phone",
      newValue: pending && pending.field === "phone" ? pending.newValue : null,
    });

    body.innerHTML = emailRow + phoneRow;

    /* Wire buttons */
    body.querySelectorAll("[data-change]").forEach((btn) => {
      btn.addEventListener("click", () =>
        openChangeModal(btn.getAttribute("data-change")),
      );
    });
    body.querySelectorAll("[data-verify-pending]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = ContactChange.getPending(student.id);
        if (!p) return;
        openVerifyModal(p.field, p.newValue, p.code);
      });
    });
    body.querySelectorAll("[data-cancel-pending]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const p = ContactChange.getPending(student.id);
        if (!p) return;
        const ok = await Confirmation.confirm({
          title: "Cancel this change?",
          message: "Your " + p.field + " will stay as it is currently.",
          confirmLabel: "Cancel change",
          variant: "danger",
        });
        if (!ok) return;
        ContactChange.cancelChange(student.id);
        render();
        Toast.info("Change cancelled.", "Cancelled");
      });
    });
  }

  function renderContactRow(opts) {
    if (opts.isPending) {
      return (
        '<div class="contact-pending-block">' +
        '<div class="contact-pending-head">' +
        '<i class="fa-solid ' +
        opts.icon +
        '"></i>' +
        '<span class="contact-pending-label">' +
        opts.label +
        "</span>" +
        '<span class="badge badge-warning contact-pending-badge">' +
        '<i class="fa-solid fa-hourglass-half"></i> Pending' +
        "</span>" +
        "</div>" +
        '<div class="contact-pending-values">' +
        '<div class="contact-pending-value">' +
        '<span class="contact-pending-tag">Current</span>' +
        '<span class="contact-pending-text">' +
        Util.escape(opts.value) +
        "</span>" +
        "</div>" +
        '<div class="contact-pending-arrow"><i class="fa-solid fa-arrow-right"></i></div>' +
        '<div class="contact-pending-value is-new">' +
        '<span class="contact-pending-tag is-new">New</span>' +
        '<span class="contact-pending-text">' +
        Util.escape(opts.newValue) +
        "</span>" +
        "</div>" +
        "</div>" +
        '<div class="contact-pending-actions">' +
        '<button class="btn btn-primary btn-sm" data-verify-pending type="button">' +
        '<i class="fa-solid fa-check"></i> Verify' +
        "</button>" +
        '<button class="btn btn-ghost btn-sm" data-cancel-pending type="button">' +
        '<i class="fa-solid fa-xmark"></i> Cancel' +
        "</button>" +
        "</div>" +
        "</div>"
      );
    }
    return (
      '<div class="setting-row">' +
      '<div class="setting-row-info">' +
      '<div class="contact-row-head">' +
      '<i class="fa-solid ' +
      opts.icon +
      '"></i>' +
      '<span class="contact-row-label">' +
      opts.label +
      "</span>" +
      "</div>" +
      '<div class="contact-row-value">' +
      Util.escape(opts.value) +
      "</div>" +
      "</div>" +
      '<button class="btn btn-secondary btn-sm" data-change="' +
      opts.field +
      '" type="button">' +
      '<i class="fa-solid fa-pen"></i> Change' +
      "</button>" +
      "</div>"
    );
  }

  /* ------------------------------------------------------------------
     CHANGE MODAL
     ------------------------------------------------------------------ */
  function openChangeModal(field) {
    currentField = field;
    const isEmail = field === "email";
    ccTitle.textContent = "Change " + field;
    ccValueLabel.innerHTML = "New " + field + ' <span class="req">*</span>';
    ccValueInput.type = isEmail ? "email" : "tel";
    ccValueInput.placeholder = isEmail
      ? "you@example.com"
      : "+234 800 000 0000";
    ccValueInput.value = "";
    changeForm
      .querySelectorAll(".field")
      .forEach((f) => f.classList.remove("is-invalid", "is-valid"));
    Modal.open("change-contact-modal");
  }

  bindForm(
    changeForm,
    {
      value: (function () {
        /* Rules depend on currentField — evaluated at validation time */
        return function (v) {
          return currentField === "email"
            ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "")
            : /^[0-9+\-\s()]{7,17}$/.test((v || "").trim());
        };
      })(),
    },
    function (data) {
      const newValue = String(data.get("value")).trim();
      const code = ContactChange.startChange(
        student.id,
        currentField,
        newValue,
      );
      Modal.close("change-contact-modal");
      Toast.info(
        "A verification code has been sent to the new " +
          currentField +
          " (simulated).",
        "Check your new " + currentField,
      );
      render();
      /* Immediately open the verify modal so the student can complete the flow */
      setTimeout(() => openVerifyModal(currentField, newValue, code), 300);
    },
  );

  /* ------------------------------------------------------------------
     VERIFY MODAL
     ------------------------------------------------------------------ */
  function openVerifyModal(field, newValue, code) {
    currentField = field;
    currentOtpLength = field === "email" ? 4 : 6;

    vcTitle.textContent = "Verify your new " + field;
    vcTarget.textContent = newValue;
    vcHint.textContent = code;

    /* Build OTP inputs dynamically */
    vcOtpContainer.innerHTML = "";
    for (let i = 0; i < currentOtpLength; i++) {
      const inp = document.createElement("input");
      inp.className = "otp-input";
      inp.type = "text";
      inp.inputMode = "numeric";
      inp.maxLength = 1;
      inp.setAttribute("aria-label", "Digit " + (i + 1));
      vcOtpContainer.appendChild(inp);
    }

    /* Re-init the OTP behaviors on the new inputs */
    if (typeof initOtpInputs === "function") initOtpInputs(vcOtpContainer);

    Modal.open("verify-contact-modal");
  }

  verifyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const pending = ContactChange.getPending(student.id);
    if (!pending) {
      Toast.error("No pending change found.", "Error");
      return;
    }

    const entered =
      typeof getOtpValue === "function"
        ? getOtpValue(vcOtpContainer)
        : Array.from(vcOtpContainer.querySelectorAll(".otp-input"))
            .map((i) => i.value)
            .join("");

    const btn = document.getElementById("vc-submit");
    btn.classList.add("is-loading");
    btn.disabled = true;

    setTimeout(() => {
      btn.classList.remove("is-loading");
      btn.disabled = false;

      if (entered !== pending.code) {
        Toast.error(
          "The code you entered doesn't match.",
          "Verification failed",
        );
        return;
      }

      /* Apply the change */
      const updated = ContactChange.applyChange(student.id, {
        [pending.field]: student[pending.field],
      });

      /* Sync the student record in localStorage so login uses the new value */
      syncStudentRecord(student.id, pending.field, updated);

      Modal.close("verify-contact-modal");
      Toast.success("Your " + pending.field + " has been updated.", "Verified");
      render();
    }, 500);
  });

  /* Helper — persist the new value to registered_students and student_overrides */
  function syncStudentRecord(studentId, field, newValue) {
    /* registered_students array holds real signups */
    const registered = Store.get("registered_students", []) || [];
    let changed = false;
    registered.forEach((s) => {
      if (s.id === studentId) {
        s[field] = newValue;
        changed = true;
      }
    });
    if (changed) Store.set("registered_students", registered);

    /* Demo students are read-only in code, but the override makes the
       new value take effect at lookup time (see auth.js). */
  }

  /* Initial render */
  render();
}
