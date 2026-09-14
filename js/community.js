/* ==========================================================================
   CAMPUS SPACE — community.js
   Community feed: posts, comments, likes, reports.
   ========================================================================== */
"use strict";

const Community = (() => {
  const KEY = "community_posts";

  const SEED = [
    {
      id: "p1",
      author: "Chiamaka Okafor",
      handle: "chiamaka",
      tag: "NESA",
      initials: "CO",
      time: Date.now() - 3600000,
      isLeader: true,
      text: "Reminder: the EEE 305 tutorial sheet is now available in the course materials section. Please attempt questions 1–8 before Friday's class.",
      likes: 12,
      liked: false,
      replies: 3,
      reported: false,
      hidden: false,
    },
    {
      id: "p2",
      author: "Temilade Balogun",
      handle: "temilade",
      tag: "NASMS",
      initials: "TB",
      time: Date.now() - 7200000,
      isLeader: true,
      text: "Anyone interested in forming a study group for ACC 401? We can meet at the library on Tuesday and Thursday evenings. Reply here if you want to join.",
      likes: 24,
      liked: false,
      replies: 8,
      reported: false,
      hidden: false,
    },
    {
      id: "p3",
      author: "Space Admin",
      handle: "admin.folake",
      tag: "ADMIN",
      initials: "SA",
      time: Date.now() - 86400000,
      isAdmin: true,
      text: "The first semester examination timetable has been published. Please check the Academic Resources section for the full timetable and confirm your venues.",
      likes: 45,
      liked: false,
      replies: 2,
      reported: false,
      hidden: false,
    },
    {
      id: "p4",
      author: "Ibrahim Suleiman",
      handle: "ibrahim",
      tag: "",
      initials: "IS",
      time: Date.now() - 2 * 86400000,
      text: "Does anyone have last year's BCH 201 notes they can share? I missed a few lectures and would appreciate the help.",
      likes: 5,
      liked: false,
      replies: 4,
      reported: false,
      hidden: false,
    },
    {
      id: "p5",
      author: "Zainab Abdulrahman",
      handle: "zainab",
      tag: "",
      initials: "ZA",
      time: Date.now() - 3 * 86400000,
      text: "Sharing: the new library portal has a great list of curated reading materials per department. Definitely worth checking out.",
      likes: 18,
      liked: false,
      replies: 1,
      reported: false,
      hidden: false,
    },
  ];

  function all() {
    let posts = Store.get(KEY, null);
    if (!posts) {
      posts = SEED.slice();
      Store.set(KEY, posts);
    }
    return posts;
  }
  function save(posts) {
    Store.set(KEY, posts);
  }

  function add(text, session) {
    const posts = all();
    posts.unshift({
      id: "p" + Date.now(),
      author: session.name || session.username,
      handle: session.username,
      tag: "",
      initials: Util.initials(session.name || session.username),
      time: Date.now(),
      text,
      likes: 0,
      liked: false,
      replies: 0,
      reported: false,
      hidden: false,
    });
    save(posts);
  }

  function toggleLike(id) {
    const posts = all();
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    p.liked = !p.liked;
    p.likes += p.liked ? 1 : -1;
    save(posts);
  }

  function report(id, reason) {
    const posts = all();
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    p.reported = true;
    p.reportReason = reason;
    save(posts);
  }

  return { all, add, toggleLike, report, save };
})();

/* -------------------------------------------------------------------------
   Post renderer — reuses markup used in dashboard preview
   ------------------------------------------------------------------------- */
function renderPost(post, { linkToDetails = true } = {}) {
  const el = document.createElement("article");
  el.className = "post-card";
  el.dataset.postId = post.id;

  const tagHtml =
    post.tag === "ADMIN"
      ? '<span class="tag-admin"><i class="fa-solid fa-shield-halved"></i> Admin</span>'
      : post.tag
        ? `<span class="tag-leader">${Util.escape(post.tag)}</span>`
        : "";

  const currentSession = Auth.current();
  const isOwnPost = currentSession && post.handle === currentSession.username;
  const savedAvatar = typeof Avatar !== "undefined" ? Avatar.get() : "";

  const avatarHtml =
    isOwnPost && savedAvatar
      ? `<img src="${savedAvatar}" alt="" class="avatar avatar-40">`
      : post.avatar
        ? `<img src="${post.avatar}" alt="" class="avatar avatar-40" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'avatar avatar-40 avatar-fallback',textContent:'${post.initials}'}))">`
        : `<span class="avatar avatar-40 avatar-fallback">${post.initials}</span>`;

  el.innerHTML = `
    <div class="post-head">
      ${avatarHtml}
      <div class="post-author">
        <div class="post-author-name">${Util.escape(post.author)} ${tagHtml}</div>
        <div class="post-author-handle">@${Util.escape(post.handle)} · ${Util.relativeTime(post.time)}</div>
      </div>
      <div class="dropdown">
        <button class="btn-icon" data-dropdown aria-label="Post options" aria-haspopup="true">
          <i class="fa-solid fa-ellipsis"></i>
        </button>
        <div class="dropdown-menu">
          ${linkToDetails ? `<a class="dropdown-item" href="post-details.html?id=${post.id}"><i class="fa-solid fa-link"></i> Open post</a>` : ""}
          <button class="dropdown-item" data-action="copy"><i class="fa-solid fa-copy"></i> Copy link</button>
          <button class="dropdown-item is-danger" data-action="report"><i class="fa-solid fa-flag"></i> Report post</button>
        </div>
      </div>
    </div>
    <div class="post-body${linkToDetails ? "" : ""}">${Util.escape(post.text)}</div>
    <div class="post-actions">
      <button class="post-action${post.liked ? " is-liked" : ""}" data-action="like" aria-label="Like post">
        <i class="fa-${post.liked ? "solid" : "regular"} fa-heart"></i>
        <span>${post.likes}</span>
      </button>
      <a class="post-action" href="post-details.html?id=${post.id}" aria-label="View comments">
        <i class="fa-regular fa-comment"></i>
        <span>${post.replies}</span>
      </a>
      <button class="post-action" data-action="share" aria-label="Share post">
        <i class="fa-solid fa-share-nodes"></i>
        <span>Share</span>
      </button>
    </div>`;

  // Actions
  el.querySelector('[data-action="like"]').addEventListener("click", (e) => {
    Community.toggleLike(post.id);
    e.currentTarget.classList.toggle("is-liked");
    const icon = e.currentTarget.querySelector("i");
    const liked = e.currentTarget.classList.contains("is-liked");
    icon.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const span = e.currentTarget.querySelector("span");
    span.textContent = liked
      ? parseInt(span.textContent, 10) + 1
      : parseInt(span.textContent, 10) - 1;
  });

  el.querySelector('[data-action="share"]').addEventListener("click", () => {
    Toast.success("Post link copied to clipboard (simulated).", "Copied");
  });

  el.querySelector('[data-action="copy"]').addEventListener("click", () => {
    Toast.success("Post link copied (simulated).", "Copied");
  });

  el.querySelector('[data-action="report"]').addEventListener("click", () => {
    openReportModal(post.id);
  });

  return el;
}

/* -------------------------------------------------------------------------
   Report modal
   ------------------------------------------------------------------------- */
function openReportModal(postId) {
  let modal = document.getElementById("report-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "report-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-head">
          <h3>Report this post</h3>
          <button class="btn-icon" data-modal-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p style="font-size:var(--fs-sm); color:var(--text-secondary); margin-bottom:16px;">Your report will be reviewed by Admin. Please select a reason.</p>
          <div class="stack">
            ${[
              "Spam",
              "Harassment / bullying",
              "Inappropriate content",
              "False / misleading",
              "Hate speech",
              "Scam / fraud",
              "Other",
            ]
              .map(
                (r) => `
              <label class="checkbox">
                <input type="radio" name="report-reason" value="${r}">
                <span>${r}</span>
              </label>
            `,
              )
              .join("")}
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" data-modal-close>Cancel</button>
          <button class="btn btn-danger" id="submit-report">Submit report</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector("#submit-report").addEventListener("click", () => {
      const reason = modal.querySelector('input[name="report-reason"]:checked');
      if (!reason) {
        Toast.warning("Please select a reason.", "Select a reason");
        return;
      }
      Community.report(postId, reason.value);
      Modal.close("report-modal");
      Toast.success("Report submitted. Admin will review it.", "Report sent");
    });
  }
  Modal.open("report-modal");
}
