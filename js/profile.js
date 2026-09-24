/* ==========================================================================
   CAMPUS SPACE — profile.js
   Renders the signed-in student's own profile.

   If the student is a leader (assigned by Admin), the profile is
   rendered in the same layout as the public leader-profile page:
     - Cover + avatar hero (with avatar-edit and cover-edit affordances)
     - Verified checkmark next to name
     - Association acronym + position chips in the tags row
     - "Leadership Role" card in the main grid column
     - Bio reads "<Position> of the <Association Full Name> · <Faculty>"
   Otherwise, the standard student profile layout is used.
   ========================================================================== */
"use strict";

function renderProfilePage() {
  var root = document.getElementById("profile-root");
  if (!root) return;

  var session = Auth.current();
  if (!session) return;

  var student =
    DEMO_STUDENTS.find(function (s) {
      return s.username === session.username;
    }) || DEMO_STUDENTS[0];

  var fullName = [student.firstName, student.otherName, student.lastName]
    .filter(Boolean)
    .join(" ");
  var initials = Util.initials(fullName);

  /* ---- Leadership detection (live, not seed-based) ---- */
  var leaderInfo = null;
  if (typeof getLeaderById === "function") {
    leaderInfo = getLeaderById(student.id, { includeInactive: false });
  }
  if (!leaderInfo && typeof getLeaderList === "function") {
    /* Fallback if getLeaderById isn't available — older builds */
    leaderInfo =
      getLeaderList().find(function (l) {
        return l.student.id === student.id;
      }) || null;
  }
  var isLeader = !!leaderInfo;

  var phoneVisible = isLeader || student.phoneVisible === true;

  var phoneRow;
  if (phoneVisible) {
    phoneRow =
      '<div class="profile-v2-info">' +
      '<span class="label">Phone</span>' +
      '<span class="value">' +
      Util.escape(student.phone) +
      "</span>" +
      "</div>";
  } else {
    phoneRow =
      '<div class="profile-v2-info">' +
      '<span class="label">Phone</span>' +
      '<span class="value" style="color:var(--text-tertiary); display:inline-flex; align-items:center; gap:6px; font-weight:500;">' +
      '<i class="fa-solid fa-eye-slash" style="font-size:11px;"></i> Hidden — visit Settings to show' +
      "</span>" +
      "</div>";
  }

  var avatarUrl = Avatar.get();
  var coverUrl = Cover.get();

  var avatarInner = avatarUrl
    ? '<img src="' + avatarUrl + '" alt="" class="avatar avatar-96">'
    : '<span class="avatar avatar-96 avatar-fallback">' + initials + "</span>";

  var previewInner = avatarUrl
    ? '<img src="' + avatarUrl + '" alt="" class="avatar avatar-72">'
    : '<span class="avatar avatar-72 avatar-fallback">' + initials + "</span>";

  var coverStyle = coverUrl
    ? 'style="background-image:url(' +
      coverUrl +
      '); background-size:cover; background-position:center;"'
    : "";

  /* ---- Leader chip in tags row ---- */
  var leaderTag = "";
  if (isLeader && leaderInfo) {
    leaderTag =
      '<span class="badge badge-brand"><i class="fa-solid fa-ranking-star"></i> ' +
      Util.escape(leaderInfo.assoc.acronym) +
      " \u00b7 " +
      Util.escape(leaderInfo.pos.name) +
      "</span>";
  }

  /* ---- Bio — leader-aware ---- */
  var bioText =
    isLeader && leaderInfo
      ? Util.escape(leaderInfo.pos.name) +
        " of the " +
        Util.escape(leaderInfo.assoc.name) +
        " \u00b7 " +
        Util.escape(student.faculty)
      : Util.escape(student.department) +
        " student at OAUSTECH \u00b7 Faculty of " +
        Util.escape(student.faculty);

  /* ---- Leadership Role card (main column, above Academic Information) ---- */
  var leaderSection = "";
  if (isLeader && leaderInfo) {
    leaderSection =
      '<div class="card profile-v2-card">' +
      '<div class="card-head">' +
      '<h3><i class="fa-solid fa-ranking-star" style="color:var(--brand-primary); margin-right:8px;"></i> Leadership Role</h3>' +
      "</div>" +
      '<div class="profile-v2-info-grid">' +
      '<div class="profile-v2-info">' +
      '<span class="label">Association</span>' +
      '<span class="value">' +
      Util.escape(leaderInfo.assoc.name) +
      "</span>" +
      "</div>" +
      '<div class="profile-v2-info">' +
      '<span class="label">Public tag</span>' +
      '<span class="value">' +
      Util.escape(leaderInfo.assoc.acronym) +
      "</span>" +
      "</div>" +
      '<div class="profile-v2-info profile-v2-info-wide">' +
      '<span class="label">Position</span>' +
      '<span class="value">' +
      Util.escape(leaderInfo.pos.name) +
      "</span>" +
      "</div>" +
      "</div>" +
      "</div>";
  }

  var html = "";
  html += '<div class="profile-hero-v2">';

  html +=
    '<div class="profile-cover-v2" id="profile-cover" ' + coverStyle + ">";
  html += '<div class="profile-cover-grain" aria-hidden="true"></div>';
  html += '<div class="profile-cover-overlay" aria-hidden="true"></div>';
  html +=
    '<button class="btn btn-secondary btn-sm profile-cover-edit" id="profile-cover-edit" type="button">';
  html +=
    '<i class="fa-solid fa-camera"></i><span>' +
    (coverUrl ? "Change cover" : "Add cover photo") +
    "</span>";
  html += "</button>";
  if (coverUrl) {
    html +=
      '<button class="btn btn-secondary btn-sm profile-cover-remove" id="profile-cover-remove" type="button">';
    html += '<i class="fa-solid fa-trash"></i><span>Remove</span></button>';
  }
  html +=
    '<input type="file" id="profile-cover-input" accept="image/*" hidden>';
  html += "</div>";

  html += '<div class="profile-hero-body-v2">';
  html += '<div class="profile-avatar-v2">';
  html += '<div class="profile-avatar-slot">' + avatarInner + "</div>";
  html +=
    '<button class="profile-avatar-edit" id="profile-avatar-edit" type="button"><i class="fa-solid fa-camera"></i></button>';
  html +=
    '<input type="file" id="profile-avatar-input" accept="image/*" hidden>';
  html += "</div>";

  html += '<div class="profile-hero-info">';
  html +=
    '<div class="profile-hero-name-row"><h1>' + Util.escape(fullName) + "</h1>";
  /* Verified checkmark — always shown when the account is active.
     For leaders the checkmark also implies "verified leader". */
  if (student.status === "active")
    html += '<i class="fa-solid fa-circle-check tag-verified"></i>';
  html += "</div>";
  html +=
    '<div class="profile-hero-handle">@' +
    Util.escape(student.username) +
    "</div>";
  html += '<div class="profile-hero-tags">' + leaderTag;
  html +=
    '<span class="badge badge-marine"><i class="fa-solid fa-building-columns"></i> ' +
    Util.escape(student.department) +
    "</span>";
  html +=
    '<span class="badge badge-neutral"><i class="fa-solid fa-graduation-cap"></i> ' +
    Util.escape(student.level) +
    " Level</span>";
  html +=
    '<span class="badge badge-success"><i class="fa-solid fa-shield-halved"></i> Verified</span>';
  html += "</div>";
  html += '<p class="profile-hero-bio" id="profile-bio">' + bioText + "</p>";
  html += "</div>";

  html += '<div class="profile-hero-actions">';
  html +=
    '<button class="btn btn-primary" data-modal-open="edit-profile-modal" type="button"><i class="fa-solid fa-pen"></i> Edit profile</button>';
  html +=
    '<a href="settings.html" class="btn btn-secondary"><i class="fa-solid fa-gear"></i> Settings</a>';
  html += "</div>";

  html += "</div></div>";

  html += '<div class="profile-v2-grid">';
  html += '<div class="profile-v2-main">';

  /* Leadership card goes first if the student is a leader */
  html += leaderSection;

  html += '<div class="card profile-v2-card">';
  html +=
    '<div class="card-head"><h3><i class="fa-solid fa-graduation-cap" style="color:var(--brand-primary); margin-right:8px;"></i> Academic Information</h3></div>';
  html += '<div class="profile-v2-info-grid">';
  html +=
    '<div class="profile-v2-info"><span class="label">Faculty</span><span class="value">' +
    Util.escape(student.faculty) +
    "</span></div>";
  html +=
    '<div class="profile-v2-info"><span class="label">Department</span><span class="value">' +
    Util.escape(student.department) +
    "</span></div>";
  html +=
    '<div class="profile-v2-info"><span class="label">Level</span><span class="value">' +
    Util.escape(student.level) +
    " Level</span></div>";
  html +=
    '<div class="profile-v2-info"><span class="label">Matric number</span><span class="value">' +
    Util.escape(student.matric) +
    "</span></div>";
  html += "</div></div>";

  html += '<div class="card profile-v2-card">';
  html +=
    '<div class="card-head"><h3><i class="fa-solid fa-address-book" style="color:var(--brand-secondary); margin-right:8px;"></i> Contact Information</h3></div>';
  html += '<div class="profile-v2-info-grid">';
  html +=
    '<div class="profile-v2-info profile-v2-info-wide"><span class="label">Email</span><span class="value">' +
    Util.escape(student.email) +
    "</span></div>";
  html += phoneRow;
  html += "</div></div>";

  html += "</div>";

  html += '<aside class="profile-v2-side">';

  html += '<div class="card profile-v2-card">';
  html +=
    '<div class="card-head"><h3><i class="fa-solid fa-user-check" style="color:var(--brand-primary); margin-right:8px;"></i> Account</h3></div>';
  html += '<div class="profile-v2-side-list">';
  html +=
    '<div class="profile-v2-side-row"><span class="label">Username</span><span class="value">@' +
    Util.escape(student.username) +
    "</span></div>";
  html +=
    '<div class="profile-v2-side-row"><span class="label">Member since</span><span class="value">' +
    Util.formatDate(student.joined, { month: "long", year: "numeric" }) +
    "</span></div>";
  html +=
    '<div class="profile-v2-side-row"><span class="label">Status</span><span class="badge ' +
    (student.status === "active" ? "badge-success" : "badge-warning") +
    '"><i class="fa-solid fa-circle-check"></i> ' +
    (student.status === "active" ? "Active" : student.status) +
    "</span></div>";
  html += "</div></div>";

  html += '<div class="card profile-v2-card profile-v2-avatar-card">';
  html +=
    '<div class="card-head"><h3><i class="fa-solid fa-image" style="color:var(--brand-secondary); margin-right:8px;"></i> Profile Picture</h3></div>';
  html += '<div class="profile-v2-avatar-preview">';
  html += '<div class="avatar-preview-frame">' + previewInner + "</div>";
  html += '<div class="profile-v2-avatar-actions">';
  html +=
    '<button class="btn btn-primary btn-sm" id="upload-avatar-btn" type="button"><i class="fa-solid fa-upload"></i> Upload</button>';
  if (avatarUrl) {
    html +=
      '<button class="btn btn-ghost btn-sm" id="remove-avatar-btn" type="button" style="color:var(--danger);"><i class="fa-solid fa-trash"></i> Remove</button>';
  }
  html += "</div></div>";
  html +=
    '<p class="profile-v2-avatar-hint">Your picture appears on your profile, the top-right header, community posts and comments.</p>';
  html += "</div>";

  html += "</aside>";
  html += "</div>";

  root.innerHTML = html;

  /* ---- Wire avatar / cover / edit form ---- */
  var avatarInput = document.getElementById("profile-avatar-input");
  var avatarEdit = document.getElementById("profile-avatar-edit");
  var uploadBtn = document.getElementById("upload-avatar-btn");
  var removeAvatarBtn = document.getElementById("remove-avatar-btn");

  var openAvatarPicker = function () {
    if (avatarInput) avatarInput.click();
  };
  if (avatarEdit) avatarEdit.addEventListener("click", openAvatarPicker);
  if (uploadBtn) uploadBtn.addEventListener("click", openAvatarPicker);

  if (avatarInput) {
    avatarInput.addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
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
      var reader = new FileReader();
      reader.onload = function (ev) {
        Avatar.set(ev.target.result);
        Toast.success("Profile picture updated.", "Saved");
        setTimeout(function () {
          window.location.reload();
        }, 500);
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", function () {
      Confirmation.confirm({
        title: "Remove your profile picture?",
        message: "Your initials will be shown instead.",
        confirmLabel: "Remove",
        variant: "danger",
      }).then(function (ok) {
        if (!ok) return;
        Avatar.clear();
        Toast.info("Profile picture removed.", "Removed");
        setTimeout(function () {
          window.location.reload();
        }, 500);
      });
    });
  }

  var coverInput = document.getElementById("profile-cover-input");
  var coverEdit = document.getElementById("profile-cover-edit");
  var coverRemove = document.getElementById("profile-cover-remove");

  var openCoverPicker = function () {
    if (coverInput) coverInput.click();
  };
  if (coverEdit) coverEdit.addEventListener("click", openCoverPicker);

  if (coverInput) {
    coverInput.addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
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
      var reader = new FileReader();
      reader.onload = function (ev) {
        Cover.set(ev.target.result);
        Toast.success("Cover photo updated.", "Saved");
        setTimeout(function () {
          window.location.reload();
        }, 500);
      };
      reader.readAsDataURL(file);
    });
  }

  if (coverRemove) {
    coverRemove.addEventListener("click", function () {
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
    });
  }

  /* ---- Edit profile form ---- */
  var form = document.getElementById("edit-profile-form");
  if (form) {
    form.querySelector('[name="firstName"]').value = student.firstName;
    form.querySelector('[name="otherName"]').value = student.otherName || "";
    form.querySelector('[name="lastName"]').value = student.lastName;
    form.querySelector('[name="phone"]').value = student.phone;

    var bioInput = form.querySelector('[name="bio"]');
    var bioEl = document.getElementById("profile-bio");
    if (bioInput && bioEl) bioInput.value = bioEl.textContent.trim();

    bindForm(
      form,
      {
        firstName: [Rules.required, Rules.name],
        lastName: [Rules.required, Rules.name],
        phone: [Rules.required, Rules.phone],
      },
      function (data) {
        /* For leaders, the bio is derived from the association + position
           — don't let the student overwrite it. For non-leaders, allow edits. */
        if (!isLeader) {
          var bio = data.get("bio");
          if (bioEl && bio) bioEl.textContent = bio;
        }
        var newName = [
          data.get("firstName"),
          data.get("otherName"),
          data.get("lastName"),
        ]
          .filter(Boolean)
          .join(" ");
        var nameEl = document.querySelector(".profile-hero-name-row h1");
        if (nameEl) nameEl.textContent = newName;
        Modal.close("edit-profile-modal");
        Toast.success("Profile updated successfully.", "Saved");
      },
    );
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (window._profileBooted) return;
  window._profileBooted = true;
  syncAvatarEverywhere();
  renderProfilePage();
});
