/* ==========================================================================
   CAMPUS SPACE — groups.js
   Study Groups module: group data, membership, join requests,
   messages (text / image / file / voice note), creator controls,
   and delete-with-history-retention.

   Persistence: localStorage under `cs_study_groups`.
   Seeds are merged with stored state on every load — the stored
   state overrides the seed for any group with the same id.

   Notifications emitted (each fires only when the underlying state
   ACTUALLY changes — idempotent against repeated calls):
     - On requestJoin()    → the group creator gets "New join request"
     - On acceptRequest()  → the accepted student gets "Request accepted"
   ========================================================================== */
"use strict";

const Groups = (() => {
  const KEY = "study_groups";

  /* ------------------------------------------------------------------
     Notifications helper — safe to call even if Notifications.js is not
     loaded on the current page. Silently skips instead of throwing.
     ------------------------------------------------------------------ */
  function emitNotification(payload) {
    try {
      if (
        typeof Notifications !== "undefined" &&
        typeof Notifications.emit === "function"
      ) {
        return Notifications.emit(payload);
      }
    } catch (e) {
      /* swallow — notifications must never break group actions */
    }
    return null;
  }

  /* ------------------------------------------------------------------
     Seed groups
     ------------------------------------------------------------------ */
  const SEED_GROUPS = [
    {
      id: "grp-seed-csc401",
      name: "CSC 401 Study Circle",
      course: "CSC 401",
      description:
        "Weekly revision for Software Engineering. Bring your tutorial sheet.",
      department: "Computer Science",
      level: "400",
      location: "Library — Group Room B",
      time: "Tue & Thu · 6pm",
      createdBy: "akinola",
      createdAt: 1737000000000,
      members: ["akinola", "chiamaka"],
      joinRequests: [],
      messages: [
        {
          id: "msg-seed-1",
          author: "akinola",
          type: "text",
          text: "Welcome everyone. Let's meet Tuesday at 6pm in Group Room B.",
          at: 1737000600000,
        },
        {
          id: "msg-seed-2",
          author: "chiamaka",
          type: "text",
          text: "Got it. I'll bring the CSC 403 past questions too.",
          at: 1737001200000,
        },
      ],
      deleted: false,
    },
    {
      id: "grp-seed-csc403",
      name: "Compiler Construction Mentoring",
      course: "CSC 403",
      description: "Peer mentoring for CSC 403. Open to 400L CS students.",
      department: "Computer Science",
      level: "400",
      location: "Faculty Auditorium",
      time: "Sun · 2pm",
      createdBy: "oluwaseun",
      createdAt: 1737000000001,
      members: ["oluwaseun"],
      joinRequests: [],
      messages: [],
      deleted: false,
    },
    {
      id: "grp-seed-cyb201",
      name: "CYB 201 Foundations",
      course: "CYB 201",
      description: "Introduction to cybersecurity concepts. Group study.",
      department: "Cyber Security",
      level: "200",
      location: "ICT Lab 3",
      time: "Wed · 4pm",
      createdBy: "oluwaseun",
      createdAt: 1737000000002,
      members: ["oluwaseun"],
      joinRequests: [],
      messages: [],
      deleted: false,
    },
    {
      id: "grp-seed-eee305",
      name: "EEE 305 Tutorial Group",
      course: "EEE 305",
      description: "Signals and Systems — tutorial problem solving.",
      department: "Electrical and Electronics Engineering",
      level: "300",
      location: "Engineering Block C",
      time: "Mon · 5pm",
      createdBy: "chiamaka",
      createdAt: 1737000000003,
      members: ["chiamaka"],
      joinRequests: [],
      messages: [],
      deleted: false,
    },
    {
      id: "grp-seed-bch201",
      name: "BCH 201 Revision Squad",
      course: "BCH 201",
      description: "General Biochemistry I revision — Saturday mornings.",
      department: "Biochemistry",
      level: "200",
      location: "Science Library",
      time: "Sat · 10am",
      createdBy: "ibrahim",
      createdAt: 1737000000004,
      members: ["ibrahim", "grace"],
      joinRequests: [],
      messages: [],
      deleted: false,
    },
    {
      id: "grp-seed-acc401",
      name: "ACC 401 Problem Solving",
      course: "ACC 401",
      description: "Advanced Financial Accounting — group problem sets.",
      department: "Accounting",
      level: "400",
      location: "Management Building",
      time: "Wed · 4pm",
      createdBy: "temilade",
      createdAt: 1737000000005,
      members: ["temilade"],
      joinRequests: [],
      messages: [],
      deleted: false,
    },
    {
      id: "grp-seed-nsc501",
      name: "NSC 501 Clinical Prep",
      course: "NSC 501",
      description: "Clinical preparation group for 500L Nursing Science.",
      department: "Nursing Science",
      level: "500",
      location: "Nursing Hall — Room 2",
      time: "Tue · 6pm",
      createdBy: "emeka",
      createdAt: 1737000000006,
      members: ["emeka"],
      joinRequests: [],
      messages: [],
      deleted: false,
    },
  ];

  /* ------------------------------------------------------------------
     Load / save
     ------------------------------------------------------------------ */
  function load() {
    let stored = Store.get(KEY, null);
    if (!stored) {
      stored = SEED_GROUPS.map((g) => JSON.parse(JSON.stringify(g)));
      Store.set(KEY, stored);
      return stored;
    }
    SEED_GROUPS.forEach((seed) => {
      if (!stored.some((g) => g.id === seed.id)) {
        stored.push(JSON.parse(JSON.stringify(seed)));
      }
    });
    return stored;
  }

  function save(groups) {
    Store.set(KEY, groups);
  }

  function all(includeDeleted) {
    const list = load();
    return includeDeleted ? list : list.filter((g) => !g.deleted);
  }

  function get(id) {
    return load().find((g) => g.id === id) || null;
  }

  function update(id, patch) {
    const list = load();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch);
    save(list);
    return list[idx];
  }

  /* ------------------------------------------------------------------
     Create
     ------------------------------------------------------------------ */
  function create({ name, course, description, department, level, creator }) {
    const list = load();
    const group = {
      id: "grp-" + Date.now(),
      name: name.trim(),
      course: course,
      description: (description || "").trim(),
      department: department,
      level: level,
      location: "TBD",
      time: "To be scheduled",
      createdBy: creator.username,
      createdAt: Date.now(),
      members: [creator.username],
      joinRequests: [],
      messages: [],
      deleted: false,
    };
    list.unshift(group);
    save(list);
    return group;
  }

  /* ------------------------------------------------------------------
     Membership
     ------------------------------------------------------------------ */
  function isMember(group, username) {
    return (
      Array.isArray(group.members) && group.members.indexOf(username) !== -1
    );
  }

  function hasRequested(group, username) {
    return (
      Array.isArray(group.joinRequests) &&
      group.joinRequests.indexOf(username) !== -1
    );
  }

  function isCreator(group, username) {
    return group.createdBy === username;
  }

  function membershipState(group, username) {
    if (isMember(group, username)) return "member";
    if (hasRequested(group, username)) return "requested";
    return "none";
  }

  /* ------------------------------------------------------------------
     Request to join — notify the group creator.

     Idempotent: if the username is already in joinRequests, this is a
     no-op and does NOT emit a new notification. Only a genuinely new
     request produces a notification.
     ------------------------------------------------------------------ */
  function requestJoin(groupId, username) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g) return null;

    if (!Array.isArray(g.joinRequests)) g.joinRequests = [];

    /* Was this actually a new request? If not, no-op and no emit. */
    const alreadyRequested = g.joinRequests.indexOf(username) !== -1;
    if (alreadyRequested) {
      return g;
    }

    g.joinRequests.push(username);
    save(list);

    /* Notify the group creator (unless they're requesting their own group) */
    const creatorUsername = g.createdBy;
    if (creatorUsername && creatorUsername !== username) {
      const requesterName = displayName(username) || username;
      emitNotification({
        type: "group_join_request",
        icon: "fa-user-plus",
        tone: "brand",
        title: "New join request",
        body:
          requesterName +
          ' wants to join "' +
          g.name +
          '". Open the group card to accept or reject.',
        link: "study-groups.html",
        audience: { usernames: [creatorUsername], roles: [] },
        actorUsername: username,
      });
    }

    return g;
  }

  function cancelRequest(groupId, username) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g) return null;
    g.joinRequests = (g.joinRequests || []).filter((u) => u !== username);
    save(list);
    return g;
  }

  /* ------------------------------------------------------------------
     Accept request — notify the requester that they've been added.

     Idempotent: if the username is NOT in joinRequests (already accepted
     or never requested), this is a no-op and does NOT emit a notification.
     Clicking Accept 20,000 times produces exactly one notification.
     ------------------------------------------------------------------ */
  function acceptRequest(groupId, username) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g) return null;

    if (!Array.isArray(g.joinRequests)) g.joinRequests = [];
    if (!Array.isArray(g.members)) g.members = [];

    /* Was this actually a pending request? If not, no-op and no emit. */
    const wasPending = g.joinRequests.indexOf(username) !== -1;
    if (!wasPending) {
      return g;
    }

    /* Do the mutation */
    g.joinRequests = g.joinRequests.filter((u) => u !== username);
    if (g.members.indexOf(username) === -1) g.members.push(username);
    save(list);

    /* Notify the accepted student — link them straight into the chat */
    emitNotification({
      type: "group_join_accepted",
      icon: "fa-circle-check",
      tone: "success",
      title: "Request accepted",
      body:
        "You've been added to \"" +
        g.name +
        '". Open the group chat to say hi.',
      link: "group-chat.html?id=" + encodeURIComponent(g.id),
      audience: { usernames: [username], roles: [] },
      actorUsername: g.createdBy,
    });

    return g;
  }

  function rejectRequest(groupId, username) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g) return null;
    g.joinRequests = (g.joinRequests || []).filter((u) => u !== username);
    save(list);
    return g;
  }

  function leave(groupId, username) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g) return null;
    if (g.createdBy === username) return null; /* creator cannot leave */
    g.members = (g.members || []).filter((u) => u !== username);
    save(list);
    return g;
  }

  /* ------------------------------------------------------------------
     Delete
     ------------------------------------------------------------------ */
  function softDelete(groupId, username) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g) return null;
    if (g.createdBy !== username) return null;
    g.deleted = true;
    g.deletedAt = Date.now();
    g.deletedBy = username;
    save(list);
    return g;
  }

  /* ------------------------------------------------------------------
     Messages
     ------------------------------------------------------------------ */
  function addMessage(groupId, message) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g) return null;
    if (!Array.isArray(g.messages)) g.messages = [];
    g.messages.push(message);
    save(list);
    return g;
  }

  function messages(groupId) {
    const g = get(groupId);
    return g && Array.isArray(g.messages) ? g.messages : [];
  }

  function editMessage(groupId, messageId, newText) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g || !Array.isArray(g.messages)) return null;
    const m = g.messages.find((x) => x.id === messageId);
    if (!m) return null;
    if (m.type !== "text") return null;
    if (!m.edited) {
      m.originalText = m.text;
    }
    m.text = newText;
    m.edited = true;
    m.editedAt = Date.now();
    save(list);
    return m;
  }

  function deleteMessage(groupId, messageId, username) {
    const list = load();
    const g = list.find((x) => x.id === groupId);
    if (!g || !Array.isArray(g.messages)) return null;
    const m = g.messages.find((x) => x.id === messageId);
    if (!m) return null;
    if (m.author !== username) return null;
    m.deleted = true;
    m.deletedAt = Date.now();
    m.deletedBy = username;
    save(list);
    return m;
  }

  function visibleMessages(groupId) {
    const g = get(groupId);
    if (!g || !Array.isArray(g.messages)) return [];
    return g.messages.filter((m) => !m.deleted);
  }

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function getStudent(username) {
    if (typeof DEMO_STUDENTS === "undefined") return null;
    return DEMO_STUDENTS.find((s) => s.username === username) || null;
  }

  function displayName(username) {
    const s = getStudent(username);
    if (!s) return username;
    return [s.firstName, s.otherName, s.lastName].filter(Boolean).join(" ");
  }

  return {
    KEY: KEY,
    all: all,
    get: get,
    create: create,
    update: update,
    membershipState: membershipState,
    isMember: isMember,
    hasRequested: hasRequested,
    isCreator: isCreator,
    requestJoin: requestJoin,
    cancelRequest: cancelRequest,
    acceptRequest: acceptRequest,
    rejectRequest: rejectRequest,
    leave: leave,
    softDelete: softDelete,
    addMessage: addMessage,
    messages: messages,
    editMessage: editMessage,
    deleteMessage: deleteMessage,
    visibleMessages: visibleMessages,
    getStudent: getStudent,
    displayName: displayName,
  };
})();
