/* ==========================================================================
   CAMPUS SPACE — community.js
   Community feed: posts, comments, likes, reports.

   Leader tags are resolved LIVE at render time — a newly-assigned leader's
   old posts and comments automatically pick up their association acronym
   without needing any data migration.
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
      image: "",
      reported: false,
      hidden: false,
      comments: [
        {
          id: "c1",
          author: "Ibrahim Suleiman",
          handle: "ibrahim",
          tag: "",
          time: Date.now() - 3000000,
          text: "Thanks for the reminder. I'll check the materials section.",
        },
        {
          id: "c2",
          author: "Grace Oladipo",
          handle: "grace",
          tag: "",
          time: Date.now() - 2400000,
          text: "Very helpful. Any chance we can also get a revision session?",
        },
        {
          id: "c3",
          author: "Oluwaseun Ogundipe",
          handle: "seun",
          tag: "NACOS",
          time: Date.now() - 1800000,
          text: "I'll organise a session on Saturday morning. I'll post the details.",
        },
      ],
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
      image: "",
      reported: false,
      hidden: false,
      comments: [
        {
          id: "c4",
          author: "Ibrahim Suleiman",
          handle: "ibrahim",
          tag: "",
          time: Date.now() - 6000000,
          text: "I'm interested. Tuesday works for me.",
        },
        {
          id: "c5",
          author: "Zainab Abdulrahman",
          handle: "zainab",
          tag: "",
          time: Date.now() - 5400000,
          text: "Count me in.",
        },
      ],
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
      image: "",
      reported: false,
      hidden: false,
      comments: [
        {
          id: "c6",
          author: "Chiamaka Okafor",
          handle: "chiamaka",
          tag: "NESA",
          time: Date.now() - 80000000,
          text: "Thank you. The venue information is really helpful.",
        },
      ],
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
      image: "",
      reported: false,
      hidden: false,
      comments: [
        {
          id: "c7",
          author: "Grace Oladipo",
          handle: "grace",
          tag: "",
          time: Date.now() - 1.8 * 86400000,
          text: "I'll send them to you on the class group chat.",
        },
        {
          id: "c8",
          author: "Zainab Abdulrahman",
          handle: "zainab",
          tag: "",
          time: Date.now() - 1.7 * 86400000,
          text: "I have them too if you still need.",
        },
      ],
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
      image: "",
      reported: false,
      hidden: false,
      comments: [
        {
          id: "c9",
          author: "Temilade Balogun",
          handle: "temilade",
          tag: "NASMS",
          time: Date.now() - 2.9 * 86400000,
          text: "Good find. The curated lists are really useful.",
        },
      ],
    },
    {
      id: "p6",
      author: "Grace Oladipo",
      handle: "grace",
      tag: "",
      initials: "GO",
      time: Date.now() - 4 * 3600000,
      text: "🔥 MASSIVE DISCOUNT! Buy original FUTA past questions and handouts at half price! DM me on WhatsApp 080-X-XXX-XXXX to order NOW. Limited time offer!",
      likes: 0,
      liked: false,
      image: "",
      reported: true,
      reportReason: "Spam",
      reportedAt: Date.now() - 3 * 3600000,
      reportedBy: "Ibrahim Suleiman",
      reportedById: "STU003",
      hidden: false,
      comments: [],
    },
    {
      id: "p7",
      author: "Oluwaseun Ogundipe",
      handle: "seun",
      tag: "NACOS",
      initials: "OO",
      time: Date.now() - 8 * 3600000,
      text: "Anybody who fails CSC 401 this semester is just lazy. If you can't handle the workload you shouldn't be in this department. Simple.",
      likes: 3,
      liked: false,
      image: "",
      reported: true,
      reportReason: "Harassment / bullying",
      reportedAt: Date.now() - 6 * 3600000,
      reportedBy: "Zainab Abdulrahman",
      reportedById: "STU006",
      hidden: false,
      comments: [],
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

  function add(text, session, opts) {
    opts = opts || {};
    const posts = all();
    posts.unshift({
      id: "p" + Date.now(),
      author: session.name || session.username,
      handle: session.username,
      tag: "" /* tag resolved live at render — no longer stored */,
      initials: Util.initials(session.name || session.username),
      time: Date.now(),
      text: text || "",
      likes: 0,
      liked: false,
      commentCount: 0,
      comments: [],
      image: opts.image || "",
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
    p.reportedAt = Date.now();
    save(posts);
  }

  function countComments(post) {
    if (Array.isArray(post.comments))
      return post.comments.length || post.commentCount || 0;
    return post.commentCount || 0;
  }

  function edit(id, newText) {
    const posts = all();
    const p = posts.find((x) => x.id === id);
    if (!p) return false;
    p.text = newText;
    p.editedAt = Date.now();
    save(posts);
    return true;
  }

  function remove(id) {
    const posts = all().filter((x) => x.id !== id);
    save(posts);
    return true;
  }

  function reported() {
    return all()
      .filter(function (p) {
        return p.reported === true;
      })
      .sort(function (a, b) {
        return (b.reportedAt || b.time || 0) - (a.reportedAt || a.time || 0);
      });
  }

  function resolveReport(id, resolution) {
    const posts = all();
    const p = posts.find((x) => x.id === id);
    if (!p) return false;
    p.reportStatus = resolution;
    p.reportResolvedAt = Date.now();
    save(posts);
    return true;
  }

  function hide(id) {
    const posts = all();
    const p = posts.find((x) => x.id === id);
    if (!p) return false;
    p.hidden = true;
    save(posts);
    return true;
  }

  return {
    all,
    add,
    edit,
    remove,
    toggleLike,
    report,
    reported,
    resolveReport,
    hide,
    save,
    countComments,
  };
})();

/* -------------------------------------------------------------------------
   LIVE LEADER TAG RESOLVER

   Returns the public tag that should appear next to a given author's
   name. Uses the LIVE leaders store so a newly-assigned leader's old
   posts and comments immediately pick up their association acronym.

   Order of precedence:
     1. Admin handles → "ADMIN"
     2. Live leaders   → association acronym (e.g. "NACOS")
     3. Everyone else  → ""
   ------------------------------------------------------------------------- */
function resolveTagForAuthor(handle, fallbackTag) {
  if (!handle) return fallbackTag || "";

  /* Admin detection — admin handles are prefixed "admin." or are "superadmin" */
  var isAdminHandle =
    handle === "superadmin" ||
    handle === "admin" ||
    handle.indexOf("admin.") === 0;
  if (isAdminHandle) return "ADMIN";

  /* Live leader lookup — overrides any stored tag */
  if (typeof getLeaderList === "function") {
    try {
      var leaders = getLeaderList();
      var match = leaders.find(function (l) {
        return l.student && l.student.username === handle;
      });
      if (match && match.assoc && match.assoc.acronym) {
        return match.assoc.acronym;
      }
    } catch (e) {
      /* fall through to stored tag if the leaders module hiccups */
    }
  }

  /* Nothing live matched — fall back to the stored tag if present */
  return fallbackTag || "";
}

/* -------------------------------------------------------------------------
   Post renderer
   ------------------------------------------------------------------------- */
function renderPost(post, { linkToDetails = true } = {}) {
  const el = document.createElement("article");
  el.className = "post-card";
  el.dataset.postId = post.id;

  /* Resolve the author's tag live — a new leader's old posts update instantly */
  const liveTag = resolveTagForAuthor(post.handle, post.tag);
  const tagHtml =
    liveTag === "ADMIN"
      ? '<span class="tag-admin"><i class="fa-solid fa-shield-halved"></i> Admin</span>'
      : liveTag
        ? `<span class="tag-leader">${Util.escape(liveTag)}</span>`
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

  const imageHtml = post.image
    ? `<div class="post-media"><img src="${post.image}" alt="" style="width:100%; display:block; border-radius:10px;"></div>`
    : "";

  const commentCount = Community.countComments(post);

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
        ${
          isOwnPost
            ? `<button class="dropdown-item" data-action="edit"><i class="fa-solid fa-pen"></i> Edit post</button>
             <hr class="dropdown-divider">
             <button class="dropdown-item is-danger" data-action="delete"><i class="fa-solid fa-trash"></i> Delete post</button>`
            : `<button class="dropdown-item is-danger" data-action="report"><i class="fa-solid fa-flag"></i> Report post</button>`
        }
      </div>
    </div>
    </div>
    ${post.text ? `<div class="post-body">${Util.escape(post.text)}</div>` : ""}
    ${imageHtml}
    <div class="post-actions">
      <button class="post-action${post.liked ? " is-liked" : ""}" data-action="like" aria-label="Like post">
        <i class="fa-${post.liked ? "solid" : "regular"} fa-heart"></i>
        <span>${post.likes}</span>
      </button>
      <a class="post-action" href="post-details.html?id=${post.id}" aria-label="View comments">
        <i class="fa-regular fa-comment"></i>
        <span>${commentCount}</span>
      </a>
      <button class="post-action" data-action="share" aria-label="Share post">
        <i class="fa-solid fa-share-nodes"></i>
        <span>Share</span>
      </button>
    </div>`;

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

  function copyPostLink() {
    const url = new URL(
      "post-details.html?id=" + encodeURIComponent(post.id),
      location.href,
    ).href;
    const done = () =>
      Toast.success("Post link copied to clipboard.", "Copied");
    const failed = () =>
      Toast.info("Copy failed. The link is: " + url, "Copy manually");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(failed);
    } else {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (err) {
        failed();
      }
      document.body.removeChild(ta);
    }
  }

  el.querySelector('[data-action="share"]').addEventListener(
    "click",
    copyPostLink,
  );
  el.querySelector('[data-action="copy"]').addEventListener(
    "click",
    copyPostLink,
  );

  const reportBtn = el.querySelector('[data-action="report"]');
  if (reportBtn) {
    reportBtn.addEventListener("click", () => {
      openReportModal(post.id);
    });
  }

  el.querySelector('[data-action="edit"]')?.addEventListener("click", () => {
    openEditModal(post.id, post.text);
  });

  el.querySelector('[data-action="delete"]')?.addEventListener("click", () => {
    Confirmation.confirm({
      title: "Delete this post?",
      message: "This will permanently remove the post and its comments.",
      confirmLabel: "Delete",
      variant: "danger",
    }).then((ok) => {
      if (!ok) return;
      Community.remove(post.id);
      el.remove();
      Toast.success("Post deleted.", "Deleted");
      document.dispatchEvent(
        new CustomEvent("community:post-deleted", {
          detail: { id: post.id },
        }),
      );
    });
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
                </label>`,
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

/* -------------------------------------------------------------------------
   Edit-post modal
   ------------------------------------------------------------------------- */
function openEditModal(postId, currentText) {
  let modal = document.getElementById("edit-post-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "edit-post-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-head">
          <h3>Edit post</h3>
          <button class="btn-icon" data-modal-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="edit-post-form" novalidate>
          <div class="modal-body">
            <div class="field">
              <label class="label" for="edit-post-text">Post text <span class="req">*</span></label>
              <textarea class="textarea" id="edit-post-text" name="text" style="min-height:180px;"></textarea>
              <div class="field-help">Only the text can be edited. Images cannot be changed after posting.</div>
              <div class="field-error"><i class="fa-solid fa-circle-exclamation"></i><span>Please write something.</span></div>
            </div>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Save changes</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);

    bindForm(
      modal.querySelector("#edit-post-form"),
      {
        text: [Rules.required, Rules.minLen(2)],
      },
      (data) => {
        Community.edit(postId, data.get("text"));
        Modal.close("edit-post-modal");

        const card = document.querySelector('[data-post-id="' + postId + '"]');
        if (card) {
          const body = card.querySelector(".post-body");
          if (body) body.textContent = data.get("text");
        }

        Toast.success("Post updated.", "Saved");
      },
    );
  }

  const textarea = modal.querySelector("#edit-post-text");
  if (textarea) textarea.value = currentText || "";

  Modal.open("edit-post-modal");
}
