const STATUS_LABELS = {
  SAVED: "Saved",
  APPLIED: "Applied",
  ONLINE_ASSESSMENT: "Assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn"
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "applications", label: "Applications", icon: "▤" },
  { id: "drives", label: "Company drives", icon: "⌂" },
  { id: "interviews", label: "Interviews", icon: "◷" },
  { id: "documents", label: "My documents", icon: "▱", studentOnly: true },
  { id: "profile", label: "My profile", icon: "◎" }
];

const state = {
  token: localStorage.getItem("placement-token"),
  user: null,
  page: "overview",
  applications: [],
  drives: [],
  eligibleDriveIds: new Set(),
  interviews: [],
  documents: [],
  profile: null,
  search: "",
  statusFilter: "ALL",
  driveFilter: "ALL",
  authMode: "login",
  loading: false
};

const root = document.querySelector("#app");
const modal = document.querySelector("#modal");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function initials(value) {
  return String(value || "Student").trim().split(/\s+/).slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "").join("") || "S";
}

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "Not set";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? "Not set" : new Intl.DateTimeFormat(undefined, options).format(date);
}

function formatTime(value) {
  if (!value) return "Time not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time not set" : new Intl.DateTimeFormat(undefined, {
    hour: "numeric", minute: "2-digit"
  }).format(date);
}

function formatBytes(size) {
  if (!Number.isFinite(Number(size))) return "";
  if (Number(size) < 1024) return `${size} B`;
  return `${(Number(size) / 1024 / 1024 >= 1
    ? Number(size) / 1024 / 1024
    : Number(size) / 1024).toFixed(1)} ${Number(size) / 1024 / 1024 >= 1 ? "MB" : "KB"}`;
}

function currentDate() {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}

function companyBadge(name, extraClass = "") {
  return `<span class="company-badge ${extraClass}" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
}

function statusPill(status) {
  const normalized = String(status || "SAVED").toLowerCase();
  return `<span class="status-pill status-${escapeHtml(normalized)}">${escapeHtml(STATUS_LABELS[status] || status || "Saved")}</span>`;
}

function toast(message, type = "success") {
  const region = document.querySelector("#toast-region");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  region.append(item);
  window.setTimeout(() => item.remove(), 4200);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new Error("Can't reach the server. Check that the app is running and try again.");
  }

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401 && state.token) {
      clearSession();
      renderAuth();
      throw new Error("Your session expired. Please sign in again.");
    }
    const message = typeof result === "object" && result !== null
      ? result.error || result.message || "Something went wrong. Please try again."
      : result || "Something went wrong. Please try again.";
    throw new Error(message);
  }
  return result;
}

function clearSession() {
  localStorage.removeItem("placement-token");
  state.token = null;
  state.user = null;
  state.profile = null;
}

function renderAuth() {
  const registering = state.authMode === "register";
  root.innerHTML = `
    <section class="auth-page">
      <div class="auth-layout">
        <aside class="auth-story">
          <div class="auth-logo"><span class="brand-mark">p</span><span>pathway</span></div>
          <div class="story-copy">
            <span class="eyebrow">Your next chapter starts here</span>
            <h1>Make your next move a little more yours.</h1>
            <p>One thoughtful workspace for every application, interview, and opportunity ahead.</p>
            <ul class="story-points">
              <li>Keep every application in one clear place</li>
              <li>Find campus drives that fit your profile</li>
              <li>Show up ready for every interview</li>
            </ul>
          </div>
          <div class="story-foot">A calmer way to move your career forward.</div>
        </aside>
        <section class="auth-panel">
          <span class="eyebrow" style="color:var(--violet)">${registering ? "Create your free account" : "Welcome to Pathway"}</span>
          <h2>${registering ? "Start your journey" : "Good to see you"}</h2>
          <p>${registering ? "Make a profile and bring your job search together." : "Sign in to pick up right where you left off."}</p>
          <div id="auth-error" class="error-box" role="alert"></div>
          <form id="auth-form" class="form-stack" novalidate>
            ${registering ? `
              <div class="field">
                <label for="auth-name">Full name</label>
                <input id="auth-name" name="fullName" autocomplete="name" placeholder="e.g. Asha Sharma" required maxlength="120">
              </div>` : ""}
            <div class="field">
              <label for="auth-email">Email address</label>
              <input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="255">
            </div>
            <div class="field">
              <label for="auth-password">Password</label>
              <input id="auth-password" name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" placeholder="${registering ? "At least 8 characters" : "Enter your password"}" required minlength="${registering ? 8 : 1}" maxlength="72">
            </div>
            ${registering ? `
              <div class="field-grid">
                <div class="field">
                  <label for="auth-degree">Degree <span class="field-hint">(optional)</span></label>
                  <input id="auth-degree" name="degree" placeholder="Computer Science" maxlength="120">
                </div>
                <div class="field">
                  <label for="auth-year">Graduation year <span class="field-hint">(optional)</span></label>
                  <input id="auth-year" name="graduationYear" type="number" min="2000" max="2100" placeholder="2027">
                </div>
                <div class="field">
                  <label for="auth-cgpa">CGPA <span class="field-hint">(optional)</span></label>
                  <input id="auth-cgpa" name="cgpa" type="number" min="0" max="10" step="0.01" placeholder="8.2">
                </div>
                <div class="field">
                  <label for="auth-phone">Phone <span class="field-hint">(optional)</span></label>
                  <input id="auth-phone" name="phone" type="tel" maxlength="30" placeholder="+1 555 0100">
                </div>
              </div>` : ""}
            <button class="btn btn-primary" type="submit">${registering ? "Create my account" : "Sign in to workspace"} <span aria-hidden="true">→</span></button>
          </form>
          <p class="auth-switch">${registering ? "Already have an account?" : "New to Pathway?"}
            <button class="text-button" type="button" data-action="auth-switch">${registering ? "Sign in" : "Create an account"}</button>
          </p>
          <div class="auth-foot">By continuing, you agree to use this workspace responsibly.</div>
        </section>
      </div>
    </section>`;
}

function renderShell() {
  const officer = state.user?.role === "PLACEMENT_OFFICER";
  const items = NAV_ITEMS.filter(item => !item.studentOnly || !officer);
  const selected = items.find(item => item.id === state.page) || items[0];
  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="app-logo"><span class="brand-mark">p</span><span>pathway</span></div>
        <div class="nav-label">Workspace</div>
        <nav class="nav-list" aria-label="Main navigation">
          ${items.map(item => `<button class="nav-item ${item.id === selected.id ? "active" : ""}" type="button" data-page="${item.id}">
            <span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span>
          </button>`).join("")}
        </nav>
        <div class="sidebar-bottom">
          <div class="sidebar-note"><strong>One step at a time</strong><p>Your next opportunity may be closer than it feels. Keep showing up.</p></div>
          <div class="user-chip">
            <span class="avatar">${escapeHtml(initials(state.user?.fullName))}</span>
            <span class="user-meta"><strong>${escapeHtml(state.user?.fullName)}</strong><small>${officer ? "Placement officer" : "Student account"}</small></span>
            <button class="icon-button" type="button" data-action="logout" title="Sign out" aria-label="Sign out">↪</button>
          </div>
        </div>
      </aside>
      <div class="main-column">
        <header class="topbar">
          <button class="mobile-menu" type="button" data-action="menu" aria-label="Open navigation">☰</button>
          <div class="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>${escapeHtml(selected.label)}</strong></div>
          <div class="topbar-right"><span class="date-label">${escapeHtml(currentDate())}</span><span class="avatar">${escapeHtml(initials(state.user?.fullName))}</span></div>
        </header>
        <main id="page-content" class="content"></main>
      </div>
    </div>`;
}

function setContent(html) {
  const content = document.querySelector("#page-content");
  if (content) content.innerHTML = html;
}

function heading(title, description, actions = "") {
  return `<div class="page-heading"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div><div class="heading-actions">${actions}</div></div>`;
}

function emptyState(icon, title, message, action = "") {
  return `<div class="empty-state"><span class="empty-icon">${icon}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p>${action ? `<div style="margin-top:16px">${action}</div>` : ""}</div>`;
}

function renderLoading(title = "Loading your workspace…") {
  renderShell();
  setContent(`<div class="empty-state"><span class="empty-icon">✦</span><h3>${escapeHtml(title)}</h3><p>Just a moment while we gather everything.</p></div>`);
}

function renderLoadError(error) {
  setContent(`${heading("We couldn’t load this page", "The request did not complete.")}<section class="panel">${emptyState("!", "Something needs attention", error.message, '<button class="btn btn-primary" data-action="retry">Try again</button>')}</section>`);
}

async function navigate(page) {
  state.page = page;
  state.search = "";
  state.statusFilter = "ALL";
  state.driveFilter = "ALL";
  renderLoading();
  await loadPage();
}

async function loadPage() {
  try {
    switch (state.page) {
      case "overview": await loadOverview(); break;
      case "applications": await loadApplications(); break;
      case "drives": await loadDrives(); break;
      case "interviews": await loadInterviews(); break;
      case "documents": await loadDocuments(); break;
      case "profile": await loadProfile(); break;
      default: state.page = "overview"; await loadOverview();
    }
  } catch (error) {
    renderLoadError(error);
  }
}

async function loadOverview() {
  const [stats, applications, drives, interviews] = await Promise.all([
    api("/api/dashboard/stats"),
    api("/api/applications"),
    api("/api/drives"),
    api("/api/interviews")
  ]);
  state.applications = applications;
  state.drives = drives;
  state.interviews = interviews;
  if (state.user?.role === "STUDENT") {
    const eligible = await api("/api/drives/eligible");
    state.eligibleDriveIds = new Set(eligible.map(drive => drive.id));
  }
  renderOverview(stats);
}

function renderOverview(stats) {
  const applications = state.applications;
  const byStatus = stats.applicationsByStatus || {};
  const total = Number(stats.totalApplications || 0);
  const maxValue = Math.max(1, ...Object.values(byStatus).map(Number));
  const statusRows = Object.entries(STATUS_LABELS).map(([key, label]) => `
    <div class="status-row"><span class="status-name">${escapeHtml(label)}</span>
      <span class="status-track"><span class="status-fill" style="display:block;width:${Math.max(0, Number(byStatus[key] || 0) / maxValue * 100)}%"></span></span>
      <span class="status-number">${Number(byStatus[key] || 0)}</span></div>`).join("");
  const recent = applications.slice(0, 4);
  const nextInterviews = [...state.interviews].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .filter(item => new Date(item.scheduledAt) >= new Date()).slice(0, 3);
  const studentDrives = state.user?.role === "STUDENT"
    ? state.drives.filter(drive => state.eligibleDriveIds.has(drive.id)).slice(0, 3)
    : state.drives.filter(drive => drive.active).slice(0, 3);
  const firstName = state.user?.fullName?.trim().split(/\s+/)[0] || "there";
  setContent(`
    <section class="welcome-banner">
      <div class="welcome-copy"><span class="eyebrow">Your career, in one place</span><h2>Good ${greeting()}, ${escapeHtml(firstName)}.</h2><p>Little by little, you’re building something great.</p></div>
      <div class="banner-date"><span>Today is</span><strong>${escapeHtml(currentDate())}</strong></div>
    </section>
    <section class="stat-grid" aria-label="Placement statistics">
      ${statCard("Applications", total, "Your opportunities, organized", "▤", "")}
      ${statCard("Offers", stats.offers || 0, "One step closer to your next chapter", "✧", "green")}
      ${statCard("Interviews", stats.interviews || 0, "Conversations on your calendar", "◷", "blue")}
      ${statCard("Open drives", stats.activeDrives || 0, "Fresh opportunities to explore", "⌂", "amber")}
    </section>
    <div class="dashboard-grid">
      <div>
        <section class="panel">
          <div class="panel-head"><div><h3>Your application journey</h3><p>A quick look at where things stand</p></div><button class="link-button" data-page="applications">All applications →</button></div>
          <div class="panel-body">${total ? `<div class="status-bars">${statusRows}</div>` : emptyState("▤", "Your journey starts here", "Add a job application to keep your search organized.", state.user?.role === "STUDENT" ? '<button class="btn btn-primary" data-action="new-application">Add an application</button>' : "")}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h3>Recent applications</h3><p>Your latest activity</p></div><button class="link-button" data-page="applications">View all →</button></div>
          <div class="panel-body">${recent.length ? `<div class="mini-list">${recent.map(app => miniApplication(app)).join("")}</div>` : emptyState("✦", "Nothing to show yet", "Your saved applications will appear right here.")}</div>
        </section>
      </div>
      <div>
        <section class="panel">
          <div class="panel-head"><div><h3>Coming up</h3><p>Interviews worth looking forward to</p></div><button class="link-button" data-page="interviews">See all →</button></div>
          <div class="panel-body">${nextInterviews.length ? `<div class="mini-list">${nextInterviews.map(miniInterview).join("")}</div>` : emptyState("◷", "A little breathing room", "Your scheduled interviews will appear here.")}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h3>${state.user?.role === "STUDENT" ? "Made for you" : "Open opportunities"}</h3><p>${state.user?.role === "STUDENT" ? "Drives that match your profile" : "Currently active company drives"}</p></div><button class="link-button" data-page="drives">Explore →</button></div>
          <div class="panel-body">${studentDrives.length ? `<div class="mini-list">${studentDrives.map(drive => miniDrive(drive)).join("")}</div>` : emptyState("⌂", "New doors are on the way", "Company drives will show here when they're available.")}</div>
        </section>
      </div>
    </div>`);
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

function statCard(label, value, caption, icon, color) {
  return `<article class="stat-card"><div class="stat-top"><span>${escapeHtml(label)}</span><span class="stat-icon ${color}">${icon}</span></div><div class="stat-value">${Number(value) || 0}</div><div class="stat-caption">${escapeHtml(caption)}</div></article>`;
}

function miniApplication(app) {
  const student = app.student?.fullName;
  return `<div class="mini-row">${companyBadge(app.companyName)}<span class="mini-info"><strong>${escapeHtml(app.companyName || "Company")}${student ? ` · ${escapeHtml(student)}` : ""}</strong><small>${escapeHtml(app.jobTitle || "Role")} · ${escapeHtml(formatDate(app.appliedDate))}</small></span>${statusPill(app.status)}</div>`;
}

function miniInterview(interview) {
  const app = interview.application || {};
  return `<div class="mini-row"><span class="stat-icon blue">◷</span><span class="mini-info"><strong>${escapeHtml(app.companyName || "Interview")}</strong><small>${escapeHtml(app.jobTitle || "")} · ${escapeHtml(formatDate(interview.scheduledAt))}</small></span><span class="mini-right">${escapeHtml(formatTime(interview.scheduledAt))}</span></div>`;
}

function miniDrive(drive) {
  return `<div class="mini-row">${companyBadge(drive.companyName)}<span class="mini-info"><strong>${escapeHtml(drive.companyName)}</strong><small>${escapeHtml(drive.jobTitle)}${drive.packageLpa ? ` · ${escapeHtml(drive.packageLpa)} LPA` : ""}</small></span><span class="mini-right">${escapeHtml(formatDate(drive.applicationDeadline, { month: "short", day: "numeric" }))}</span></div>`;
}

async function loadApplications() {
  state.applications = await api("/api/applications");
  renderApplications();
}

function renderApplications() {
  const officer = state.user?.role === "PLACEMENT_OFFICER";
  const actions = officer ? "" : '<button class="btn btn-primary" data-action="new-application">＋ Add application</button>';
  const filtered = state.applications.filter(app => {
    const matchesStatus = state.statusFilter === "ALL" || app.status === state.statusFilter;
    const haystack = `${app.companyName} ${app.jobTitle} ${app.student?.fullName || ""} ${app.recruiterName || ""}`.toLowerCase();
    return matchesStatus && haystack.includes(state.search.toLowerCase());
  });
  const rows = filtered.map(app => `
    <tr>
      <td><div class="row-company">${companyBadge(app.companyName)}<span><strong>${escapeHtml(app.companyName)}</strong><small>${escapeHtml(app.jobTitle)}</small></span></div></td>
      ${officer ? `<td>${escapeHtml(app.student?.fullName || app.student?.email || "Student")}</td>` : ""}
      <td>${escapeHtml(formatDate(app.appliedDate))}</td>
      <td>${statusPill(app.status)}</td>
      <td><div class="action-row">
        <button class="tiny-action" data-action="edit-application" data-id="${app.id}">Edit</button>
        <button class="tiny-action" data-action="schedule-interview" data-id="${app.id}">Interview</button>
        <button class="tiny-action danger" data-action="delete-application" data-id="${app.id}">Remove</button>
      </div></td>
    </tr>`).join("");
  setContent(`${heading("Applications", officer ? "A shared view of student application activity." : "Keep every opportunity, update, and next step close at hand.", actions)}
    <div class="toolbar"><label class="search-box"><input id="application-search" type="search" placeholder="Search companies or roles…" value="${escapeHtml(state.search)}" aria-label="Search applications"></label>
      <select id="application-filter" aria-label="Filter by status"><option value="ALL">All statuses</option>${Object.entries(STATUS_LABELS).map(([key, label]) => `<option value="${key}" ${state.statusFilter === key ? "selected" : ""}>${label}</option>`).join("")}</select>
      <span class="field-hint">${filtered.length} ${filtered.length === 1 ? "application" : "applications"}</span></div>
    <section class="panel">${filtered.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Company & role</th>${officer ? "<th>Student</th>" : ""}<th>Applied</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState("▤", state.applications.length ? "No matching applications" : "Your list is a blank canvas", state.applications.length ? "Try a different search or status." : "Add the roles you’re interested in and track your progress.", !officer && !state.applications.length ? '<button class="btn btn-primary" data-action="new-application">Add an application</button>' : "")}</section>`);
}

async function loadDrives() {
  state.drives = await api("/api/drives");
  state.eligibleDriveIds = new Set();
  if (state.user?.role === "STUDENT") {
    const eligible = await api("/api/drives/eligible");
    state.eligibleDriveIds = new Set(eligible.map(drive => drive.id));
  }
  renderDrives();
}

function renderDrives() {
  const officer = state.user?.role === "PLACEMENT_OFFICER";
  const actions = officer ? '<button class="btn btn-primary" data-action="new-drive">＋ Create a drive</button>' : "";
  const drives = state.drives.filter(drive => {
    if (!officer && drive.applicationDeadline && drive.applicationDeadline < new Date().toISOString().slice(0, 10)) return false;
    if (!officer && !drive.active) return false;
    if (state.driveFilter === "ELIGIBLE" && !state.eligibleDriveIds.has(drive.id)) return false;
    if (state.driveFilter === "ACTIVE" && !drive.active) return false;
    if (state.driveFilter === "CLOSED" && drive.active) return false;
    const text = `${drive.companyName} ${drive.jobTitle} ${drive.location || ""}`.toLowerCase();
    return text.includes(state.search.toLowerCase());
  });
  const cards = drives.map(drive => {
    const eligible = state.eligibleDriveIds.has(drive.id);
    return `<article class="drive-card">
      <div class="drive-card-top">${companyBadge(drive.companyName)}<div class="drive-main"><h3>${escapeHtml(drive.jobTitle)}</h3><p>${escapeHtml(drive.companyName)}</p></div>
        ${officer ? `<span class="status-pill ${drive.active ? "status-offer" : "status-withdrawn"}">${drive.active ? "Open" : "Closed"}</span>` : ""}
      </div>
      <div class="drive-tags">
        ${drive.location ? `<span class="tag">⌖ ${escapeHtml(drive.location)}</span>` : ""}
        ${drive.packageLpa ? `<span class="tag">↗ ${escapeHtml(drive.packageLpa)} LPA</span>` : ""}
        ${drive.minimumCgpa ? `<span class="tag">CGPA ${escapeHtml(drive.minimumCgpa)}+</span>` : ""}
        ${drive.requiredDegree ? `<span class="tag">${escapeHtml(drive.requiredDegree)}</span>` : ""}
        ${!officer ? `<span class="tag ${eligible ? "eligible" : "not-eligible"}">${eligible ? "✓ Eligible" : "Profile criteria not met"}</span>` : ""}
      </div>
      <p class="drive-description">${escapeHtml(drive.description || "A new opportunity to take the next step in your career.")}</p>
      <div class="drive-footer"><span class="deadline">${drive.applicationDeadline ? `Apply by ${escapeHtml(formatDate(drive.applicationDeadline))}` : "Deadline not specified"}</span>
        ${officer ? `<span class="action-row"><button class="tiny-action" data-action="edit-drive" data-id="${drive.id}">Edit</button><button class="tiny-action" data-action="toggle-drive" data-id="${drive.id}" data-active="${!drive.active}">${drive.active ? "Close" : "Reopen"}</button></span>` :
          `<button class="btn ${eligible ? "btn-primary" : "btn-secondary"}" data-action="track-drive" data-id="${drive.id}" ${eligible ? "" : "disabled"}>${eligible ? "Track application →" : "Not eligible"}</button>`}
      </div>
    </article>`;
  }).join("");
  setContent(`${heading(officer ? "Company drives" : "Find your next opportunity", officer ? "Create and manage placement opportunities for students." : "Explore campus opportunities matched to your profile.", actions)}
    <div class="toolbar"><label class="search-box"><input id="drive-search" type="search" placeholder="Search companies or roles…" value="${escapeHtml(state.search)}" aria-label="Search company drives"></label>
      <select id="drive-filter" aria-label="Filter company drives">${officer ? `<option value="ALL" ${state.driveFilter === "ALL" ? "selected" : ""}>All drives</option><option value="ACTIVE" ${state.driveFilter === "ACTIVE" ? "selected" : ""}>Open drives</option><option value="CLOSED" ${state.driveFilter === "CLOSED" ? "selected" : ""}>Closed drives</option>` : `<option value="ALL">All opportunities</option><option value="ELIGIBLE" ${state.driveFilter === "ELIGIBLE" ? "selected" : ""}>Eligible for me</option>`}</select>
      <span class="field-hint">${drives.length} ${drives.length === 1 ? "opportunity" : "opportunities"}</span></div>
    ${drives.length ? `<div class="drive-grid">${cards}</div>` : `<section class="panel">${emptyState("⌂", state.drives.length ? "No matching opportunities" : "The next opportunity is on its way", state.drives.length ? "Try changing your search or filter." : officer ? "Create a company drive when a new opportunity comes in." : "Check back soon or try updating your profile.")}</section>`}`);
}

async function loadInterviews() {
  state.interviews = await api("/api/interviews");
  renderInterviews();
}

function renderInterviews() {
  const upcoming = state.interviews.filter(item => new Date(item.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const past = state.interviews.filter(item => new Date(item.scheduledAt) < new Date())
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
  const cards = upcoming.map(interviewCard).join("");
  const previous = past.length ? `<section class="panel" style="margin-top:22px"><div class="panel-head"><div><h3>Past interviews</h3><p>Every conversation is progress</p></div></div><div class="panel-body"><div class="timeline">${past.slice(0, 8).map(interviewCard).join("")}</div></div></section>` : "";
  setContent(`${heading("Interviews", "A little preparation goes a long way. Here are your scheduled conversations.", state.user?.role === "STUDENT" ? '<button class="btn btn-primary" data-action="schedule-from-list">＋ Schedule interview</button>' : "")}
    ${cards ? `<div class="timeline">${cards}</div>` : `<section class="panel">${emptyState("◷", "Nothing on the calendar just yet", "When an interview is scheduled, you’ll see the details right here.", state.applications.length ? '<button class="btn btn-primary" data-action="schedule-from-list">Schedule an interview</button>' : "")}</section>`}
    ${previous}`);
}

function interviewCard(interview) {
  const date = new Date(interview.scheduledAt);
  const dateParts = Number.isNaN(date.getTime()) ? ["—", "TBD"] : [
    new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(date),
    new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)
  ];
  const app = interview.application || {};
  return `<article class="interview-card">
    <div class="interview-date"><strong>${escapeHtml(dateParts[0])}</strong><small>${escapeHtml(dateParts[1])}</small></div>
    <div class="interview-copy"><h3>${escapeHtml(app.companyName || "Interview")} · ${escapeHtml(app.jobTitle || "Role")}</h3><p>${escapeHtml(interview.locationOrLink || "Location or meeting link to be confirmed")}${interview.notes ? ` · ${escapeHtml(interview.notes)}` : ""}</p></div>
    <div class="interview-time">${escapeHtml(formatDate(interview.scheduledAt, { weekday: "short", month: "short", day: "numeric" }))}<br><strong>${escapeHtml(formatTime(interview.scheduledAt))}</strong></div>
  </article>`;
}

async function loadDocuments() {
  state.documents = await api("/api/documents");
  renderDocuments();
}

function renderDocuments() {
  const docs = state.documents.map(doc => {
    const extension = (doc.originalName || "").split(".").pop().toUpperCase().slice(0, 4) || "FILE";
    return `<article class="document-card">
      <span class="file-icon">${escapeHtml(extension)}</span>
      <span class="document-info"><strong title="${escapeHtml(doc.originalName)}">${escapeHtml(doc.originalName)}</strong><small>${escapeHtml(formatBytes(doc.size))} · Added ${escapeHtml(formatDate(doc.uploadedAt))}</small></span>
      <button class="tiny-action" data-action="download-document" data-id="${doc.id}">Download</button>
      <button class="icon-button" data-action="delete-document" data-id="${doc.id}" aria-label="Delete ${escapeHtml(doc.originalName)}" title="Delete document">×</button>
    </article>`;
  }).join("");
  setContent(`${heading("My documents", "Keep your resume and application documents together.", '<button class="btn btn-primary" data-action="upload-document">＋ Upload a document</button>')}
    <div class="panel"><div class="panel-head"><div><h3>Resume & documents</h3><p>PDF, DOC, or DOCX · maximum 10 MB per file</p></div><span class="field-hint">${state.documents.length} files</span></div><div class="panel-body">
      ${state.documents.length ? `<div class="documents-grid">${docs}</div>` : emptyState("▱", "Your documents live here", "Upload a resume so it’s always close when a new opportunity appears.", '<button class="btn btn-primary" data-action="upload-document">Upload your first document</button>')}
    </div></div>`);
}

async function loadProfile() {
  state.profile = await api("/api/accounts/me");
  state.user = { ...state.user, ...state.profile };
  renderProfile();
}

function renderProfile() {
  const profile = state.profile;
  setContent(`${heading("My profile", "A little context helps us find opportunities that fit.", "")}
    <div class="profile-grid">
      <section class="panel profile-intro"><span class="avatar">${escapeHtml(initials(profile.fullName))}</span><h3>${escapeHtml(profile.fullName)}</h3><p>${escapeHtml(profile.email)}</p><span class="role-tag">${profile.role === "PLACEMENT_OFFICER" ? "Placement officer" : "Student account"}</span></section>
      <section class="panel profile-form"><h3>Personal & academic details</h3>
        <form id="profile-form">
          <div class="field-grid">
            <div class="field full"><label for="profile-name">Full name</label><input id="profile-name" name="fullName" value="${escapeHtml(profile.fullName)}" required maxlength="120"></div>
            <div class="field"><label for="profile-degree">Degree</label><input id="profile-degree" name="degree" value="${escapeHtml(profile.degree)}" maxlength="120" placeholder="e.g. Computer Science"></div>
            <div class="field"><label for="profile-year">Graduation year</label><input id="profile-year" name="graduationYear" type="number" min="2000" max="2100" value="${escapeHtml(profile.graduationYear)}" placeholder="2027"></div>
            <div class="field"><label for="profile-cgpa">CGPA (out of 10)</label><input id="profile-cgpa" name="cgpa" type="number" min="0" max="10" step="0.01" value="${escapeHtml(profile.cgpa)}" placeholder="8.2"></div>
            <div class="field"><label for="profile-phone">Phone</label><input id="profile-phone" name="phone" type="tel" maxlength="30" value="${escapeHtml(profile.phone)}" placeholder="+1 555 0100"></div>
          </div>
          <button class="btn btn-primary" type="submit">Save profile</button>
        </form>
      </section>
    </div>`);
}

function optionalNumber(value) {
  return value.trim() === "" ? null : Number(value);
}

function applicationForm(app = {}) {
  const options = Object.entries(STATUS_LABELS).map(([key, label]) =>
    `<option value="${key}" ${app.status === key ? "selected" : ""}>${label}</option>`).join("");
  return `<div class="modal-head"><div><h2>${app.id ? "Update application" : "Add an application"}</h2><p>Capture the details now; you can update the status anytime.</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="modal-body"><form id="application-form" data-id="${app.id || ""}">
      <div class="field-grid">
        <div class="field"><label for="app-company">Company</label><input id="app-company" name="companyName" required maxlength="150" value="${escapeHtml(app.companyName)}" placeholder="Company name"></div>
        <div class="field"><label for="app-role">Job title</label><input id="app-role" name="jobTitle" required maxlength="150" value="${escapeHtml(app.jobTitle)}" placeholder="Role you applied for"></div>
        <div class="field"><label for="app-date">Applied on</label><input id="app-date" name="appliedDate" type="date" value="${escapeHtml(app.appliedDate || new Date().toISOString().slice(0, 10))}"></div>
        <div class="field"><label for="app-status">Status</label><select id="app-status" name="status">${options}</select></div>
        <div class="field"><label for="app-recruiter">Recruiter name</label><input id="app-recruiter" name="recruiterName" maxlength="120" value="${escapeHtml(app.recruiterName)}" placeholder="Optional"></div>
        <div class="field"><label for="app-email">Recruiter email</label><input id="app-email" name="recruiterEmail" type="email" maxlength="255" value="${escapeHtml(app.recruiterEmail)}" placeholder="Optional"></div>
        <div class="field full"><label for="app-url">Job portal link</label><input id="app-url" name="portalUrl" type="url" maxlength="2048" value="${escapeHtml(app.portalUrl)}" placeholder="https://"></div>
        <div class="field full"><label for="app-notes">Notes</label><textarea id="app-notes" name="notes" maxlength="2000" placeholder="Anything you want to remember…">${escapeHtml(app.notes)}</textarea></div>
      </div>
      <div id="modal-error" class="error-box" role="alert"></div>
      <div class="modal-actions"><button class="btn btn-secondary" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${app.id ? "Save changes" : "Add application"}</button></div>
    </form></div>`;
}

function driveForm(drive = {}) {
  return `<div class="modal-head"><div><h2>${drive.id ? "Edit company drive" : "Create a company drive"}</h2><p>Share the opportunity and who it’s right for.</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="modal-body"><form id="drive-form" data-id="${drive.id || ""}">
      <div class="field-grid">
        <div class="field"><label for="drive-company">Company</label><input id="drive-company" name="companyName" required maxlength="150" value="${escapeHtml(drive.companyName)}"></div>
        <div class="field"><label for="drive-role">Job title</label><input id="drive-role" name="jobTitle" required maxlength="150" value="${escapeHtml(drive.jobTitle)}"></div>
        <div class="field"><label for="drive-location">Location</label><input id="drive-location" name="location" maxlength="200" value="${escapeHtml(drive.location)}" placeholder="Remote or city"></div>
        <div class="field"><label for="drive-package">Package (LPA)</label><input id="drive-package" name="packageLpa" type="number" min="0" step="0.01" value="${escapeHtml(drive.packageLpa)}" placeholder="Optional"></div>
        <div class="field"><label for="drive-cgpa">Minimum CGPA</label><input id="drive-cgpa" name="minimumCgpa" type="number" min="0" max="10" step="0.01" value="${escapeHtml(drive.minimumCgpa)}" placeholder="Optional"></div>
        <div class="field"><label for="drive-degree">Required degree</label><input id="drive-degree" name="requiredDegree" maxlength="120" value="${escapeHtml(drive.requiredDegree)}" placeholder="Optional"></div>
        <div class="field"><label for="drive-year-from">Graduation year from</label><input id="drive-year-from" name="graduationYearFrom" type="number" min="2000" max="2100" value="${escapeHtml(drive.graduationYearFrom)}" placeholder="Optional"></div>
        <div class="field"><label for="drive-year-to">Graduation year to</label><input id="drive-year-to" name="graduationYearTo" type="number" min="2000" max="2100" value="${escapeHtml(drive.graduationYearTo)}" placeholder="Optional"></div>
        <div class="field full"><label for="drive-deadline">Application deadline</label><input id="drive-deadline" name="applicationDeadline" type="date" value="${escapeHtml(drive.applicationDeadline)}"></div>
        <div class="field full"><label for="drive-description">About the opportunity</label><textarea id="drive-description" name="description" maxlength="4000" placeholder="Share a few details about the role…">${escapeHtml(drive.description)}</textarea></div>
      </div>
      <div id="modal-error" class="error-box" role="alert"></div>
      <div class="modal-actions"><button class="btn btn-secondary" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${drive.id ? "Save changes" : "Create drive"}</button></div>
    </form></div>`;
}

function interviewForm(selectedApplicationId = "") {
  const applications = state.applications.filter(app =>
    state.user?.role === "PLACEMENT_OFFICER" || app.student?.email?.toLowerCase() === state.user?.email?.toLowerCase());
  return `<div class="modal-head"><div><h2>Schedule an interview</h2><p>Add the time and details so it’s easy to find later.</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="modal-body"><form id="interview-form">
      <div class="form-stack">
        <div class="field"><label for="interview-application">Application</label><select id="interview-application" name="applicationId" required>${applications.map(app => `<option value="${app.id}" ${String(selectedApplicationId) === String(app.id) ? "selected" : ""}>${escapeHtml(app.companyName)} — ${escapeHtml(app.jobTitle)}</option>`).join("")}</select></div>
        <div class="field"><label for="interview-time">Date & time</label><input id="interview-time" name="scheduledAt" type="datetime-local" required></div>
        <div class="field"><label for="interview-location">Location or meeting link</label><input id="interview-location" name="locationOrLink" maxlength="2048" placeholder="Office address or video call link"></div>
        <div class="field"><label for="interview-notes">Notes</label><textarea id="interview-notes" name="notes" maxlength="2000" placeholder="Round, topics to prepare, or other details…"></textarea></div>
      </div>
      <div id="modal-error" class="error-box" role="alert"></div>
      <div class="modal-actions"><button class="btn btn-secondary" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" ${applications.length ? "" : "disabled"}>Save interview</button></div>
    </form></div>`;
}

function showModal(html) {
  modal.innerHTML = html;
  modal.showModal();
  modal.querySelector("input:not([type=hidden]), select, textarea")?.focus();
}

function showModalError(error) {
  const target = document.querySelector("#modal-error");
  if (target) {
    target.textContent = error.message;
    target.classList.add("visible");
  } else {
    toast(error.message, "error");
  }
}

async function startSession(authResult) {
  state.token = authResult.token;
  state.user = {
    id: authResult.userId,
    fullName: authResult.fullName,
    email: authResult.email,
    role: authResult.role
  };
  localStorage.setItem("placement-token", state.token);
  state.page = "overview";
  renderLoading("Welcome in…");
  await loadPage();
}

async function submitAuth(form) {
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const register = state.authMode === "register";
  const payload = { email, password };
  let path = "/api/auth/login";
  if (register) {
    path = "/api/auth/register";
    payload.fullName = String(data.get("fullName") || "").trim();
    payload.degree = String(data.get("degree") || "").trim() || null;
    payload.graduationYear = optionalNumber(String(data.get("graduationYear") || ""));
    payload.cgpa = optionalNumber(String(data.get("cgpa") || ""));
    payload.phone = String(data.get("phone") || "").trim() || null;
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = register ? "Creating your account…" : "Signing you in…";
  const errorBox = document.querySelector("#auth-error");
  errorBox.classList.remove("visible");
  try {
    await startSession(await api(path, { method: "POST", body: JSON.stringify(payload) }));
    toast(register ? "Your workspace is ready." : "Welcome back.");
  } catch (error) {
    if (!state.token) {
      errorBox.textContent = error.message;
      errorBox.classList.add("visible");
      button.disabled = false;
      button.textContent = register ? "Create my account" : "Sign in to workspace →";
    }
  }
}

async function handleApplicationSubmit(form) {
  const data = Object.fromEntries(new FormData(form));
  const id = form.dataset.id;
  const payload = {
    ...data,
    appliedDate: data.appliedDate || null,
    recruiterName: data.recruiterName || null,
    recruiterEmail: data.recruiterEmail || null,
    portalUrl: data.portalUrl || null,
    notes: data.notes || null
  };
  try {
    await api(id ? `/api/applications/${id}` : "/api/applications", {
      method: id ? "PUT" : "POST", body: JSON.stringify(payload)
    });
    modal.close();
    toast(id ? "Application updated." : "Application added.");
    await loadPage();
  } catch (error) { showModalError(error); }
}

async function handleDriveSubmit(form) {
  const data = Object.fromEntries(new FormData(form));
  const id = form.dataset.id;
  const payload = {
    ...data,
    packageLpa: optionalNumber(data.packageLpa),
    minimumCgpa: optionalNumber(data.minimumCgpa),
    graduationYearFrom: optionalNumber(data.graduationYearFrom),
    graduationYearTo: optionalNumber(data.graduationYearTo),
    applicationDeadline: data.applicationDeadline || null,
    description: data.description || null,
    location: data.location || null,
    requiredDegree: data.requiredDegree || null
  };
  try {
    await api(id ? `/api/drives/${id}` : "/api/drives", {
      method: id ? "PUT" : "POST", body: JSON.stringify(payload)
    });
    modal.close();
    toast(id ? "Company drive updated." : "Company drive created.");
    await loadPage();
  } catch (error) { showModalError(error); }
}

async function handleInterviewSubmit(form) {
  const data = Object.fromEntries(new FormData(form));
  const scheduledAt = new Date(data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    showModalError(new Error("Choose a date and time in the future."));
    return;
  }
  try {
    await api(`/api/applications/${data.applicationId}/interviews`, {
      method: "POST",
      body: JSON.stringify({
        scheduledAt: scheduledAt.toISOString(),
        locationOrLink: data.locationOrLink || null,
        notes: data.notes || null
      })
    });
    modal.close();
    toast("Interview scheduled.");
    await loadPage();
  } catch (error) { showModalError(error); }
}

async function handleProfileSubmit(form) {
  const data = Object.fromEntries(new FormData(form));
  try {
    state.profile = await api("/api/accounts/me", {
      method: "PATCH",
      body: JSON.stringify({
        fullName: data.fullName.trim(),
        degree: data.degree || null,
        graduationYear: optionalNumber(data.graduationYear),
        cgpa: optionalNumber(data.cgpa),
        phone: data.phone || null
      })
    });
    state.user = { ...state.user, ...state.profile };
    renderShell();
    await loadProfile();
    toast("Profile saved.");
  } catch (error) { toast(error.message, "error"); }
}

async function handleDocumentUpload() {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast("That file is larger than 10 MB.", "error");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      await api("/api/documents", { method: "POST", body: form });
      toast("Document uploaded.");
      await loadDocuments();
    } catch (error) { toast(error.message, "error"); }
  });
  picker.click();
}

async function downloadDocument(id) {
  try {
    const response = await fetch(`/api/documents/${id}/download`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        renderAuth();
      }
      throw new Error(response.status === 404 ? "Document file not found." : "Could not download this document.");
    }
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const name = encodedName ? decodeURIComponent(encodedName) : plainName || "document";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) { toast(error.message, "error"); }
}

async function handleClick(event) {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    document.querySelector("#sidebar")?.classList.remove("open");
    await navigate(pageButton.dataset.page);
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  try {
    switch (action) {
      case "auth-switch":
        state.authMode = state.authMode === "login" ? "register" : "login";
        renderAuth();
        break;
      case "logout":
        clearSession();
        state.authMode = "login";
        state.page = "overview";
        renderAuth();
        toast("You’ve signed out.");
        break;
      case "menu":
        document.querySelector("#sidebar")?.classList.toggle("open");
        break;
      case "retry":
        renderLoading();
        await loadPage();
        break;
      case "new-application":
        showModal(applicationForm());
        break;
      case "edit-application":
        showModal(applicationForm(state.applications.find(item => String(item.id) === id)));
        break;
      case "delete-application":
        if (window.confirm("Remove this application and its scheduled interviews?")) {
          await api(`/api/applications/${id}`, { method: "DELETE" });
          toast("Application removed.");
          await loadPage();
        }
        break;
      case "schedule-interview":
        showModal(interviewForm(id));
        break;
      case "schedule-from-list":
        await api("/api/applications").then(applications => { state.applications = applications; });
        showModal(interviewForm());
        break;
      case "new-drive":
        showModal(driveForm());
        break;
      case "edit-drive":
        showModal(driveForm(state.drives.find(item => String(item.id) === id)));
        break;
      case "toggle-drive": {
        const active = button.dataset.active === "true";
        await api(`/api/drives/${id}/active?active=${active}`, { method: "PATCH" });
        toast(active ? "Drive reopened." : "Drive closed.");
        await loadPage();
        break;
      }
      case "track-drive": {
        const drive = state.drives.find(item => String(item.id) === id);
        if (!drive || !state.eligibleDriveIds.has(drive.id)) {
          toast("This drive doesn’t currently match your eligibility profile.", "error");
          break;
        }
        await api("/api/applications", {
          method: "POST",
          body: JSON.stringify({
            companyName: drive.companyName,
            jobTitle: drive.jobTitle,
            appliedDate: new Date().toISOString().slice(0, 10),
            status: "APPLIED",
            notes: `Campus placement drive${drive.applicationDeadline ? ` · Deadline ${drive.applicationDeadline}` : ""}`
          })
        });
        toast("Added to your application tracker.");
        await loadDrives();
        break;
      }
      case "upload-document":
        await handleDocumentUpload();
        break;
      case "download-document":
        await downloadDocument(id);
        break;
      case "delete-document":
        if (window.confirm("Delete this document?")) {
          await api(`/api/documents/${id}`, { method: "DELETE" });
          toast("Document deleted.");
          await loadDocuments();
        }
        break;
      case "close-modal":
        modal.close();
        break;
    }
  } catch (error) {
    toast(error.message, "error");
  }
}

document.addEventListener("click", handleClick);

document.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (!form.reportValidity()) return;
  switch (form.id) {
    case "auth-form": await submitAuth(form); break;
    case "application-form": await handleApplicationSubmit(form); break;
    case "drive-form": await handleDriveSubmit(form); break;
    case "interview-form": await handleInterviewSubmit(form); break;
    case "profile-form": await handleProfileSubmit(form); break;
  }
});

document.addEventListener("input", event => {
  if (event.target.id === "application-search") {
    state.search = event.target.value;
    renderApplications();
    document.querySelector("#application-search")?.focus();
  } else if (event.target.id === "drive-search") {
    state.search = event.target.value;
    renderDrives();
    const input = document.querySelector("#drive-search");
    input?.focus();
    input?.setSelectionRange(state.search.length, state.search.length);
  }
});

document.addEventListener("change", event => {
  if (event.target.id === "application-filter") {
    state.statusFilter = event.target.value;
    renderApplications();
  } else if (event.target.id === "drive-filter") {
    state.driveFilter = event.target.value;
    renderDrives();
  }
});

modal.addEventListener("click", event => {
  if (event.target === modal) modal.close();
});

async function initialize() {
  if (!state.token) {
    renderAuth();
    return;
  }
  try {
    state.profile = await api("/api/accounts/me");
    state.user = {
      id: state.profile.id,
      fullName: state.profile.fullName,
      email: state.profile.email,
      role: state.profile.role,
      ...state.profile
    };
    renderLoading();
    await loadPage();
  } catch (error) {
    if (!state.token) return;
    clearSession();
    renderAuth();
    toast(error.message, "error");
  }
}

initialize();
