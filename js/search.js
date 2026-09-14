/* ==========================================================================
   CAMPUS SPACE — search.js
   Global search across posts, students, courses, resources, opportunities,
   news, announcements and leaders.
   ========================================================================== */
"use strict";

function globalSearch(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const groups = [];

  // Courses
  const courses = DEMO_COURSES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
  ).slice(0, 5);
  if (courses.length)
    groups.push({
      title: "Courses",
      icon: "fa-book",
      items: courses.map((c) => ({
        href: "course-details.html?id=" + c.id,
        title: c.code + " — " + c.title,
        meta: c.lecturer + " · " + c.units + " units",
        excerpt: c.description,
      })),
    });

  // Resources
  const resources = DEMO_RESOURCES.filter(
    (r) =>
      r.name.toLowerCase().includes(q) || r.course.toLowerCase().includes(q),
  ).slice(0, 5);
  if (resources.length)
    groups.push({
      title: "Academic Resources",
      icon: "fa-file-lines",
      items: resources.map((r) => ({
        href: "course-materials.html",
        title: r.name,
        meta: r.category + " · " + r.size,
        excerpt: r.faculty + " · " + r.department,
      })),
    });

  // Opportunities
  const opps = DEMO_OPPORTUNITIES.filter(
    (o) =>
      o.title.toLowerCase().includes(q) ||
      o.organization.toLowerCase().includes(q) ||
      o.summary.toLowerCase().includes(q),
  ).slice(0, 5);
  if (opps.length)
    groups.push({
      title: "Opportunities",
      icon: "fa-briefcase",
      items: opps.map((o) => ({
        href: "opportunity-details.html?id=" + o.id,
        title: o.title,
        meta: o.category + " · " + o.organization,
        excerpt: o.summary,
      })),
    });

  // News
  const news = DEMO_NEWS.filter(
    (n) =>
      n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q),
  ).slice(0, 5);
  if (news.length)
    groups.push({
      title: "News",
      icon: "fa-newspaper",
      items: news.map((n) => ({
        href: "news-details.html?id=" + n.id,
        title: n.title,
        meta: n.category + " · " + Util.formatDate(n.date),
        excerpt: n.excerpt,
      })),
    });

  // Announcements
  const anns = DEMO_ANNOUNCEMENTS.filter(
    (a) =>
      a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q),
  ).slice(0, 5);
  if (anns.length)
    groups.push({
      title: "Announcements",
      icon: "fa-bullhorn",
      items: anns.map((a) => ({
        href: "announcements.html",
        title: a.title,
        meta: Util.formatDate(a.date),
        excerpt: a.body.split("\n")[0],
      })),
    });

  // Students
  const students = DEMO_STUDENTS.filter(
    (s) =>
      (s.firstName + " " + s.lastName).toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.matric && s.matric.toLowerCase().includes(q)),
  ).slice(0, 5);
  if (students.length)
    groups.push({
      title: "Students",
      icon: "fa-user",
      items: students.map((s) => ({
        href: "leader-profile.html?id=" + s.id,
        title: s.firstName + " " + s.lastName,
        meta: "@" + s.username + " · " + s.department,
        excerpt: s.faculty + " · " + s.level + " Level",
      })),
    });

  // Leaders
  const leaders = (typeof getLeaderList === "function" ? getLeaderList() : [])
    .filter(
      (l) =>
        (l.student.firstName + " " + l.student.lastName)
          .toLowerCase()
          .includes(q) ||
        l.pos.name.toLowerCase().includes(q) ||
        l.assoc.acronym.toLowerCase().includes(q),
    )
    .slice(0, 5);
  if (leaders.length)
    groups.push({
      title: "Student Leaders",
      icon: "fa-user-tie",
      items: leaders.map((l) => ({
        href: "leader-profile.html?id=" + l.student.id,
        title: l.student.firstName + " " + l.student.lastName,
        meta: l.pos.name,
        excerpt: l.assoc.name + " · " + l.assoc.acronym,
      })),
    });

  // Community posts
  const posts = (typeof Community !== "undefined" ? Community.all() : [])
    .filter(
      (p) =>
        p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q),
    )
    .slice(0, 5);
  if (posts.length)
    groups.push({
      title: "Community Posts",
      icon: "fa-comments",
      items: posts.map((p) => ({
        href: "post-details.html?id=" + p.id,
        title: p.author,
        meta: "@" + p.handle + " · " + Util.relativeTime(p.time),
        excerpt: p.text.slice(0, 160),
      })),
    });

  return groups;
}
