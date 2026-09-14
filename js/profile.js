/* ==========================================================================
   CAMPUS SPACE — profile.js
   Profile page: avatar + cover upload, edit form, avatar sync across
   the entire app (dashboard header, community posts, comments).
   ========================================================================== */
"use strict";

/* -------------------------------------------------------------------------
   Cover store — persisted in localStorage.
   ------------------------------------------------------------------------- */
const Cover = {
  KEY: "user_cover",

  get() {
    return Store.get(this.KEY, "");
  },
  set(dataUrl) {
    Store.set(this.KEY, dataUrl);
  },
  clear() {
    Store.remove(this.KEY);
  },
};

/* -------------------------------------------------------------------------
   Profile page initialisation
   ------------------------------------------------------------------------- */
function initProfilePage() {
  const root = document.getElementById("profile-root");
  if (!root) return;

  const session = Auth.current();
  if (!session) return;

  const student =
    DEMO_STUDENTS.find((s) => s.username === session.username) ||
    DEMO_STUDENTS[0];
  const fullName = [student.firstName, student.otherName, student.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = Util.initials(fullName);
  const isLeader = student.isLeader;
  const leaderInfo =
    typeof getLeaderList === "function" && isLeader
      ? getLeaderList().find((l) => l.student.id === student.id)
      : null;

  const avatarUrl = Avatar.get();
  const coverUrl = Cover.get();

  const avatarInner = avatarUrl
    ? `<img src="${avatarUrl}" alt="" class="avatar avatar-96">`
    : `<span class="avatar avatar-96 avatar-fallback">${initials}</span>`;

  const previewInner = avatarUrl
    ? `<img src="${avatarUrl}" alt="" class="avatar avatar-72">`
    : `<span class="avatar avatar-72 avatar-fallback">${initials}</span>`;

  const coverStyle = coverUrl
    ? `style="background-image:url('${coverUrl}'); background-size:cover; background-position:center;"`
    : "";

  root.innerHTML = `
    <!-- ==================================================================
         Profile hero — cover + overlapping avatar
         ================================================================== -->
    <div class="profile-hero-v2">

      <!-- Cover banner -->
      <div class="profile-cover-v2" id="profile-cover" ${coverStyle}>
        <div class="profile-cover-grain" aria-hidden="true"></div>
        <div class="profile-cover-overlay" aria-hidden="true"></div>

        <button class="btn btn-secondary btn-sm profile-cover-edit" id="profile-cover-edit" type="button" aria-label="Change cover photo">
          <i class="fa-solid fa-camera"></i>
          <span>${coverUrl ? "Change cover" : "Add cover photo"}</span>
        </button>

        ${
          coverUrl
            ? `
          <button class="btn btn-secondary btn-sm profile-cover-remove" id="profile-cover-remove" type="button" aria-label="Remove cover photo">
            <i class="fa-solid fa-trash"></i>
            <span>Remove</span>
          </button>`
            : ""
        }

        <input type="file" id="profile-cover-input" accept="image/*" hidden>
      </div>

      <!-- Overlapping avatar + name row -->
      <div class="profile-hero-body-v2">
        <div class="profile-avatar-v2">
          <div class="profile-avatar-slot">
            ${avatarInner}
          </div>
          <button class="profile-avatar-edit" id="profile-avatar-edit" type="button" aria-label="Upload profile picture" title="Upload profile picture">
            <i class="fa-solid fa-camera"></i>
          </button>
          <input type="file" id="profile-avatar-input" accept="image/*" hidden>
        </div>

        <div class="profile-hero-info">
          <div class="profile-hero-name-row">
            <h1>${Util.escape(fullName)}</h1>
            ${student.status === "active" ? '<i class="fa-solid fa-circle-check tag-verified" aria-label="Verified student"></i>' : ""}
          </div>
          <div class="profile-hero-handle">@${Util.escape(student.username)}</div>

          <div class="profile-hero-tags">
            <span class="badge badge-marine">
              <i class="fa-solid fa-building-columns"></i> ${Util.escape(student.department)}
            </span>
            <span class="badge badge-neutral">
              <i class="fa-solid fa-graduation-cap"></i> ${Util.escape(student.level)} Level
            </span>
            ${
              leaderInfo
                ? `
              <span class="badge badge-brand">
                <i class="fa-solid fa-ranking-star"></i> ${Util.escape(leaderInfo.assoc.acronym)} — ${Util.escape(leaderInfo.pos.name)}
              </span>`
                : ""
            }
            <span class="badge badge-success">
              <i class="fa-solid fa-shield-halved"></i> Verified
            </span>
          </div>

          <p class="profile-hero-bio" id="profile-bio">
            ${Util.escape(student.department)} student at OAUSTECH · Faculty of ${Util.escape(student.faculty)} · Class of ${Util.escape(student.matric.split("/")[1] || "")}
          </p>
        </div>

        <div class="profile-hero-actions">
          <button class="btn btn-primary" data-modal-open="edit-profile-modal" type="button">
            <i class="fa-solid fa-pen"></i> Edit profile
          </button>
          <a href="settings.html" class="btn btn-secondary">
            <i class="fa-solid fa-gear"></i> Settings
          </a>
        </div>
      </div>
    </div>

    <!-- ==================================================================
         Main grid — info panels
         ================================================================== -->
    <div class="profile-v2-grid">

      <div class="profile-v2-main">

        <div class="card profile-v2-card">
          <div class="card-head">
            <h3><i class="fa-solid fa-graduation-cap" style="color:var(--brand-primary); margin-right:8px;"></i> Academic Information</h3>
          </div>
          <div class="profile-v2-info-grid">
            <div class="profile-v2-info">
              <span class="label">Faculty</span>
              <span class="value">${Util.escape(student.faculty)}</span>
            </div>
            <div class="profile-v2-info">
              <span class="label">Department</span>
              <span class="value">${Util.escape(student.department)}</span>
            </div>
            <div class="profile-v2-info">
              <span class="label">Level</span>
              <span class="value">${Util.escape(student.level)} Level</span>
            </div>
            <div class="profile-v2-info">
              <span class="label">Matric number</span>
              <span class="value">
                ${Util.escape(student.matric)}
                <i class="fa-solid fa-lock" style="color:var(--text-tertiary); font-size:11px; margin-left:6px;" title="Only you and Admin can see this"></i>
              </span>
            </div>
          </div>
        </div>

        <div class="card profile-v2-card">
          <div class="card-head">
            <h3><i class="fa-solid fa-address-book" style="color:var(--brand-secondary); margin-right:8px;"></i> Contact Information</h3>
          </div>
          <div class="profile-v2-info-grid">
            <div class="profile-v2-info profile-v2-info-wide">
              <span class="label">Email</span>
              <span class="value">${Util.escape(student.email)}</span>
            </div>
            <div class="profile-v2-info">
              <span class="label">Phone</span>
              <span class="value">${Util.escape(student.phone)}</span>
            </div>
          </div>
        </div>

      </div>

      <aside class="profile-v2-side">

        <div class="card profile-v2-card">
          <div class="card-head">
            <h3><i class="fa-solid fa-user-check" style="color:var(--brand-primary); margin-right:8px;"></i> Account</h3>
          </div>
          <div class="profile-v2-side-list">
            <div class="profile-v2-side-row">
              <span class="label">Username</span>
              <span class="value">@${Util.escape(student.username)}</span>
            </div>
            <div class="profile-v2-side-row">
              <span class="label">Member since</span>
              <span class="value">${Util.formatDate(student.joined, { month: "long", year: "numeric" })}</span>
            </div>
            <div class="profile-v2-side-row">
              <span class="label">Status</span>
              <span class="badge ${student.status === "active" ? "badge-success" : "badge-warning"}">
                <i class="fa-solid fa-circle-check"></i> ${student.status === "active" ? "Active" : student.status}
              </span>
            </div>
          </div>
        </div>

        <div class="card profile-v2-card profile-v2-avatar-card">
          <div class="card-head">
            <h3><i class="fa-solid fa-image" style="color:var(--brand-secondary); margin-right:8px;"></i> Profile Picture</h3>
          </div>
          <div class="profile-v2-avatar-preview">
            <div class="avatar-preview-frame">
              ${previewInner}
            </div>
            <div class="profile-v2-avatar-actions">
              <button class="btn btn-primary btn-sm" id="upload-avatar-btn" type="button">
                <i class="fa-solid fa-upload"></i> Upload
              </button>
              ${
                avatarUrl
                  ? `
                <button class="btn btn-ghost btn-sm" id="remove-avatar-btn" type="button" style="color:var(--danger);">
                  <i class="fa-solid fa-trash"></i> Remove
                </button>`
                  : ""
              }
            </div>
          </div>
          <p class="profile-v2-avatar-hint">
            Your picture appears on your profile, the top-right header, community posts and comments.
          </p>
        </div>

      </aside>
    </div>
  `;

  /* =================================================================
     AVATAR upload flow
     ================================================================= */
  const avatarInput = document.getElementById("profile-avatar-input");
  const avatarEdit = document.getElementById("profile-avatar-edit");
  const uploadBtn = document.getElementById("upload-avatar-btn");
  const removeAvatarBtn = document.getElementById("remove-avatar-btn");

  const triggerAvatarPick = () => avatarInput && avatarInput.click();
  if (avatarEdit) avatarEdit.addEventListener("click", triggerAvatarPick);
  if (uploadBtn) uploadBtn.addEventListener("click", triggerAvatarPick);

  if (avatarInput) {
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        Toast.error("Please choose an image file.", "Invalid file");
        avatarInput.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        Toast.error(
          "Please choose an image smaller than 2 MB.",
          "File too large",
        );
        avatarInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        Avatar.set(ev.target.result);
        Toast.success(
          "Profile picture updated. It will now appear everywhere.",
          "Saved",
        );
        setTimeout(() => window.location.reload(), 500);
      };
      reader.onerror = () =>
        Toast.error(
          "Could not read that file. Please try another image.",
          "Upload failed",
        );
      reader.readAsDataURL(file);
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", async () => {
      const ok = await Confirmation.confirm({
        title: "Remove your profile picture?",
        message: "Your initials will be shown instead.",
        confirmLabel: "Remove",
        variant: "danger",
      });
      if (!ok) return;
      Avatar.clear();
      Toast.info("Profile picture removed.", "Removed");
      setTimeout(() => window.location.reload(), 500);
    });
  }

  /* =================================================================
     COVER photo upload flow
     ================================================================= */
  const coverInput = document.getElementById("profile-cover-input");
  const coverEdit = document.getElementById("profile-cover-edit");
  const coverRemove = document.getElementById("profile-cover-remove");

  const triggerCoverPick = () => coverInput && coverInput.click();
  if (coverEdit) coverEdit.addEventListener("click", triggerCoverPick);

  if (coverInput) {
    coverInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        Toast.error("Please choose an image file.", "Invalid file");
        coverInput.value = "";
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        Toast.error(
          "Please choose an image smaller than 4 MB.",
          "File too large",
        );
        coverInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        Cover.set(ev.target.result);
        Toast.success("Cover photo updated.", "Saved");
        setTimeout(() => window.location.reload(), 500);
      };
      reader.onerror = () =>
        Toast.error(
          "Could not read that file. Please try another image.",
          "Upload failed",
        );
      reader.readAsDataURL(file);
    });
  }

  if (coverRemove) {
    coverRemove.addEventListener("click", async () => {
      const ok = await Confirmation.confirm({
        title: "Remove your cover photo?",
        message: "The default banner will be shown instead.",
        confirmLabel: "Remove",
        variant: "danger",
      });
      if (!ok) return;
      Cover.clear();
      Toast.info("Cover photo removed.", "Removed");
      setTimeout(() => window.location.reload(), 500);
    });
  }

  /* =================================================================
     EDIT PROFILE form
     ================================================================= */
  const form = document.getElementById("edit-profile-form");
  if (form) {
    form.querySelector('[name="firstName"]').value = student.firstName;
    form.querySelector('[name="otherName"]').value = student.otherName || "";
    form.querySelector('[name="lastName"]').value = student.lastName;
    form.querySelector('[name="phone"]').value = student.phone;

    const bioInput = form.querySelector('[name="bio"]');
    const bioEl = document.getElementById("profile-bio");
    if (bioInput && bioEl) bioInput.value = bioEl.textContent.trim();

    bindForm(
      form,
      {
        firstName: [Rules.required, Rules.name],
        lastName: [Rules.required, Rules.name],
        phone: [Rules.required, Rules.phone],
      },
      (data) => {
        const bio = data.get("bio");
        if (bioEl && bio) bioEl.textContent = bio;

        const fullNewName = [
          data.get("firstName"),
          data.get("otherName"),
          data.get("lastName"),
        ]
          .filter(Boolean)
          .join(" ");
        const nameEl = document.querySelector(".profile-hero-name-row h1");
        if (nameEl) nameEl.textContent = fullNewName;

        Modal.close("edit-profile-modal");
        Toast.success("Profile updated successfully.", "Saved");
      },
    );
  }

  /* ---------------------------------------------------------------
     Cover remove — capture-phase fallback.
     Some Chrome features (autofill, form-fillers, extensions) swap
     the button element on mousedown, causing the click event to
     re-target the parent div. This document-level capture listener
     runs first and handles the click before the swap can happen.
     --------------------------------------------------------------- */
  if (!window._coverRemoveCapture) {
    window._coverRemoveCapture = true;
    document.addEventListener(
      "click",
      function (e) {
        const btn =
          e.target.closest && e.target.closest("#profile-cover-remove");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        // Also stop the event from bubbling to any other listener
        e.stopImmediatePropagation && e.stopImmediatePropagation();

        Confirmation.confirm({
          title: "Remove your cover photo?",
          message: "The default banner will be shown instead.",
          confirmLabel: "Remove",
          variant: "danger",
        }).then(function (ok) {
          if (!ok) return;
          Cover.clear();
          Toast.info("Cover photo removed.", "Removed");
          setTimeout(function () {
            window.location.reload();
          }, 500);
        });
      },
      true,
    ); // ← capture phase
  }

  /* Same capture-phase fallback for avatar upload + cover edit */
  if (!window._profileClickCapture) {
    window._profileClickCapture = true;
    document.addEventListener(
      "click",
      function (e) {
        const target = e.target;
        if (!target || !target.closest) return;

        // Avatar — camera button or "Upload" button
        if (
          target.closest("#profile-avatar-edit") ||
          target.closest("#upload-avatar-btn")
        ) {
          const input = document.getElementById("profile-avatar-input");
          if (input) {
            e.preventDefault();
            e.stopImmediatePropagation && e.stopImmediatePropagation();
            input.click();
          }
          return;
        }

        // Cover — "Add / Change cover photo" button
        if (target.closest("#profile-cover-edit")) {
          const input = document.getElementById("profile-cover-input");
          if (input) {
            e.preventDefault();
            e.stopImmediatePropagation && e.stopImmediatePropagation();
            input.click();
          }
          return;
        }
      },
      true,
    );
  }
}

/* -------------------------------------------------------------------------
   Sync avatars on every page load
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  syncAvatarEverywhere();
  initProfilePage();
});
