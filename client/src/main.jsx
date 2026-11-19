import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Filter,
  Download,
  CalendarDays,
  MapPin,
  Clock3,
  CheckCircle2,
  UserRound,
  LockKeyhole,
  Activity,
  Trash2,
  Edit3,
  RefreshCw,
} from "lucide-react";
import "./styles.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const statuses = ["applied", "screening", "interview", "hired", "rejected"];
const fmt = (s) => s?.charAt(0).toUpperCase() + s?.slice(1);
function App() {
  const [token, setToken] = useState(localStorage.getItem("hf_token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("hf_user") || "null"),
  );
  const [page, setPage] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Frontend Developer",
    status: "applied",
  });
  const [jobForm, setJobForm] = useState({
    title: "",
    department: "Engineering",
    location: "Chennai / Hybrid",
    type: "Full-time",
    status: "open",
    description: "",
  });
  async function api(path, opts = {}) {
    const r = await fetch(API + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    let d = {};
    try {
      d = await r.json();
    } catch {}
    if (!r.ok)
      throw Error(
        d?.error?.message || d?.message || `Request failed (${r.status})`,
      );
    return d.data ?? d;
  }
  async function load() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const [a, j, s] = await Promise.all([
        api("/applicants?limit=100"),
        api("/jobs"),
        api("/analytics"),
      ]);
      setApplicants(Array.isArray(a) ? a : a.items || a.applicants || []);
      setJobs(Array.isArray(j) ? j : j.jobs || []);
      setStats(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, [token]);
  function notify(m) {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  }
  async function submitAuth(e) {
  e.preventDefault();
  setError("");
  setBusy(true);

  try {
    if (authMode === "register") {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: auth.name,
          email: auth.email,
          password: auth.password,
        }),
      });

      notify("Account created. Please sign in.");
      setAuthMode("login");
      setAuth((prev) => ({
        ...prev,
        password: "",
      }));
    } else {
      const d = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: auth.email,
          password: auth.password,
        }),
      });

      setToken(d.token);
      setUser(d.user);
      localStorage.setItem("hf_token", d.token);
      localStorage.setItem("hf_user", JSON.stringify(d.user));
    }
  } catch (e) {
    setError(e.message);
  } finally {
    setBusy(false);
  }
  }
  function logout() {
    localStorage.removeItem("hf_token");
    localStorage.removeItem("hf_user");
    setToken("");
    setUser(null);
  }
  function openApplicant(a = null) {
    setEditing(a);
    setForm(
      a
        ? { name: a.name, email: a.email, role: a.role, status: a.status }
        : {
            name: "",
            email: "",
            role: "Frontend Developer",
            status: "applied",
          },
    );
    setModal("applicant");
  }
  async function saveApplicant(e) {
    e.preventDefault();
    try {
      await api("/applicants" + (editing ? "/" + editing._id : ""), {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setModal("");
      await load();
      notify(editing ? "Applicant updated" : "Applicant added");
    } catch (e) {
      setError(e.message);
    }
  }
  function openJob(j = null) {
    setEditing(j);
    setJobForm(
      j
        ? {
            title: j.title,
            department: j.department || "",
            location: j.location || "",
            type: j.type || "Full-time",
            status: j.status || "open",
            description: j.description || "",
          }
        : {
            title: "",
            department: "Engineering",
            location: "Chennai / Hybrid",
            type: "Full-time",
            status: "open",
            description: "",
          },
    );
    setModal("job");
  }
  async function saveJob(e) {
    e.preventDefault();
    try {
      await api("/jobs" + (editing ? "/" + editing._id : ""), {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(jobForm),
      });
      setModal("");
      await load();
      notify(editing ? "Job updated" : "Job published");
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeApplicant(a) {
    if (!confirm(`Delete ${a.name}?`)) return;
    try {
      await api("/applicants/" + a._id, { method: "DELETE" });
      await load();
      notify("Applicant deleted");
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeJob(j) {
    if (!confirm(`Delete ${j.title}?`)) return;
    try {
      await api("/jobs/" + j._id, { method: "DELETE" });
      await load();
      notify("Job deleted");
    } catch (e) {
      setError(e.message);
    }
  }
  const filtered = useMemo(
    () =>
      applicants.filter(
        (a) =>
          (filter === "all" || a.status === filter) &&
          [a.name, a.email, a.role]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [applicants, filter, search],
  );
  function exportCSV() {
    const rows = [
      ["Name", "Email", "Role", "Status", "Applied"],
      ...filtered.map((a) => [
        a.name,
        a.email,
        a.role,
        a.status,
        new Date(a.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "hireflow-applicants.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (!token)
    return (
      <div className="auth-page">
        <div className="auth-visual">
          <div className="brand">
            <div className="brand-mark">H</div>
            <span>
              hireflow<span className="dot">.</span>
            </span>
          </div>
          <div className="auth-copy">
            <span className="eyebrow">
              <span className="live-dot" /> TALENT OPERATIONS PLATFORM
            </span>
            <h1>
              Find the people
              <br />
              who <em>move you forward.</em>
            </h1>
            <p>
              One clear workspace for your entire hiring pipeline. Less admin,
              more human connection.
            </p>
            <div className="mini-stats">
              <div>
                <strong>2.4k+</strong>
                <span>Profiles managed</span>
              </div>
              <div>
                <strong>38%</strong>
                <span>Faster hiring</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Recruiter rating</span>
              </div>
            </div>
          </div>
          <div className="auth-foot">
            © 2026 HireFlow · Built for teams that build the future
          </div>
        </div>
        <div className="auth-form-wrap">
          <form className="auth-form" onSubmit={submitAuth}>
            <div className="mobile-brand brand">
              <div className="brand-mark">H</div>
              <span>
                hireflow<span className="dot">.</span>
              </span>
            </div>
            <span className="eyebrow">
              WELCOME {authMode === "login" ? "BACK" : "ABOARD"}
            </span>
            <h2>
              {authMode === "login"
                ? "Sign in to HireFlow"
                : "Create your account"}
            </h2>
            <p className="muted">
              {authMode === "login"
                ? "Your hiring workspace is waiting."
                : "Start organizing your recruitment workflow."}
            </p>
            {authMode === "register" && (
              <label>
                Full name
                <input
                  required
                  value={auth.name}
                  onChange={(e) => setAuth({ ...auth, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Work email
              <input
                type="email"
                required
                value={auth.email}
                onChange={(e) => setAuth({ ...auth, email: e.target.value })}
                placeholder="you@company.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength="8"
                required
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                placeholder="Enter your password"
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="primary full" disabled={busy}>
              {busy
                ? "Please wait…"
                : authMode === "login"
                  ? "Sign in securely"
                  : "Create account"}{" "}
              <ArrowUpRight size={16} />
            </button>
            <p className="switch-auth">
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setError("");
                }}
              >
                {authMode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
            <div className="security-note">
              <LockKeyhole size={15} /> Secure authentication · JWT protected
              API
            </div>
          </form>
        </div>
      </div>
    );
  const nav = [
    ["Overview", LayoutDashboard],
    ["Applicants", Users],
    ["Jobs", BriefcaseBusiness],
    ["Analytics", ChartNoAxesCombined],
  ];
  const counts = stats?.byStatus || {};
  const total = stats?.totalApplicants ?? applicants.length;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "show" : ""}`}>
        <div className="brand">
          <div className="brand-mark">H</div>
          <span>
            hireflow<span className="dot">.</span>
          </span>
          <button
            className="mobile-close icon-btn"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace">
          <div className="workspace-icon">N</div>
          <div>
            <strong>Northstar Labs</strong>
            <small>Talent workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => {
                setPage(name);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Applicants" && (
                <span className="nav-count">{total}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Activity size={17} />
            </div>
            <strong>Hiring, in sync.</strong>
            <p>Keep every candidate moving forward.</p>
            <button onClick={() => setPage("Analytics")}>
              View insights <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="nav-item"
            onClick={() => notify("Settings are coming soon")}
          >
            <Settings size={18} />
            Settings
          </button>
          <div className="profile">
            <div className="avatar">
              {(user?.name || "R").slice(0, 1).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{user?.name || "Recruiter"}</strong>
              <small>{user?.role || "team member"}</small>
            </div>
            <button className="icon-btn" title="Sign out" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu icon-btn"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div className="crumb">
            Workspace <span>/</span> <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <div className="system-status">
              <span className="live-dot" /> System operational
            </div>
            <button
              className="icon-btn notification"
              onClick={() => notify("You’re all caught up")}
            >
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">
              {(user?.name || "R").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                FRIDAY, OCTOBER 23, 2026 <span className="heading-dot">·</span>{" "}
                YOUR TALENT OVERVIEW
              </div>
              <h1>
                {page === "Overview" ? "Good morning" : page}
                <span className="heading-period">
                  {page === "Overview" ? ", team." : ""}
                </span>
              </h1>
              <p>
                {page === "Overview"
                  ? "Here’s what’s happening across your hiring pipeline today."
                  : page === "Applicants"
                    ? "Manage candidates, track progress, and keep your pipeline moving."
                    : page === "Jobs"
                      ? "Create openings and connect candidates to the right opportunities."
                      : "Understand your hiring funnel and team performance at a glance."}
              </p>
            </div>
            <div className="heading-actions">
              <button className="secondary" onClick={load}>
                <RefreshCw size={15} /> Refresh
              </button>
              {page === "Applicants" ? (
                <button className="primary" onClick={() => openApplicant()}>
                  <Plus size={17} /> Add applicant
                </button>
              ) : page === "Jobs" ? (
                <button className="primary" onClick={() => openJob()}>
                  <Plus size={17} /> Create job
                </button>
              ) : page === "Overview" ? (
                <button className="primary" onClick={() => openApplicant()}>
                  <Plus size={17} /> Add applicant
                </button>
              ) : (
                <button className="secondary" onClick={exportCSV}>
                  <Download size={16} /> Export report
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError("")}>
                <X size={15} />
              </button>
            </div>
          )}
          {page === "Overview" && (
            <>
              <div className="metric-grid">
                <Metric
                  title="Total applicants"
                  value={total}
                  note="Across all open roles"
                  icon={Users}
                  color="blue"
                />
                <Metric
                  title="Open positions"
                  value={
                    stats?.openJobs ??
                    jobs.filter((j) => j.status === "open").length
                  }
                  note="Actively hiring"
                  icon={BriefcaseBusiness}
                  color="purple"
                />
                <Metric
                  title="Interviews"
                  value={stats?.interviews ?? counts.interview ?? 0}
                  note="In interview stage"
                  icon={CalendarDays}
                  color="orange"
                />
                <Metric
                  title="Hired"
                  value={stats?.hired ?? counts.hired ?? 0}
                  note="Successfully placed"
                  icon={CheckCircle2}
                  color="green"
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel pipeline-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Hiring pipeline</h3>
                      <p>Candidate distribution by stage</p>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => setPage("Analytics")}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="pipeline-total">
                    <strong>{total}</strong>
                    <span>total candidates</span>
                  </div>
                  <div className="pipeline-bar">
                    {statuses.map((s, i) => (
                      <div
                        key={s}
                        className={`seg s-${s}`}
                        style={{
                          width: `${total ? Math.max(((counts[s] || 0) / total) * 100, 1) : 20}%`,
                        }}
                        title={`${fmt(s)}: ${counts[s] || 0}`}
                      />
                    ))}
                  </div>
                  <div className="pipeline-legend">
                    {statuses.map((s) => (
                      <div key={s}>
                        <span className={`legend-dot s-${s}`} />
                        <span>{fmt(s)}</span>
                        <strong>{counts[s] || 0}</strong>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel activity-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Quick actions</h3>
                      <p>Keep your hiring moving</p>
                    </div>
                    <Activity size={18} className="muted-icon" />
                  </div>
                  <button
                    className="quick-action"
                    onClick={() => openApplicant()}
                  >
                    <div className="quick-icon qi-blue">
                      <UserRound size={18} />
                    </div>
                    <div>
                      <strong>Add a candidate</strong>
                      <small>Create an applicant profile</small>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>
                  <button className="quick-action" onClick={() => openJob()}>
                    <div className="quick-icon qi-purple">
                      <BriefcaseBusiness size={18} />
                    </div>
                    <div>
                      <strong>Publish a job</strong>
                      <small>Open a new position</small>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>
                  <button
                    className="quick-action"
                    onClick={() => setPage("Analytics")}
                  >
                    <div className="quick-icon qi-green">
                      <ChartNoAxesCombined size={18} />
                    </div>
                    <div>
                      <strong>View analytics</strong>
                      <small>Explore hiring performance</small>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>
                </section>
              </div>
              <section className="panel table-panel">
                <div className="panel-head">
                  <div>
                    <h3>Recent applicants</h3>
                    <p>Your latest candidate activity</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("Applicants")}
                  >
                    View all applicants <ArrowUpRight size={15} />
                  </button>
                </div>
                <ApplicantTable
                  list={applicants.slice(0, 5)}
                  onEdit={openApplicant}
                />
              </section>
            </>
          )}
          {page === "Applicants" && (
            <section className="panel table-panel">
              <div className="toolbar">
                <div className="searchbox">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email or role…"
                  />
                </div>
                <div className="toolbar-right">
                  <div className="filterbox">
                    <Filter size={15} />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {fmt(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="secondary" onClick={exportCSV}>
                    <Download size={15} /> Export CSV
                  </button>
                </div>
              </div>
              <div className="table-meta">
                Showing <strong>{filtered.length}</strong> of{" "}
                {applicants.length} candidates
              </div>
              <ApplicantTable
                list={filtered}
                onEdit={openApplicant}
                onDelete={removeApplicant}
              />
            </section>
          )}
          {page === "Jobs" && (
            <section className="jobs-grid">
              {jobs.length === 0 ? (
                <div className="panel empty-state">
                  <div className="empty-icon">
                    <BriefcaseBusiness />
                  </div>
                  <h3>No jobs yet</h3>
                  <p>
                    Create your first opening to start organizing your hiring
                    pipeline.
                  </p>
                  <button className="primary" onClick={() => openJob()}>
                    <Plus size={16} /> Create your first job
                  </button>
                </div>
              ) : (
                jobs.map((j) => (
                  <article className="panel job-card" key={j._id}>
                    <div className="job-card-top">
                      <div className="job-symbol">
                        <BriefcaseBusiness size={20} />
                      </div>
                      <button className="icon-btn" onClick={() => openJob(j)}>
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <span className={`status-badge ${j.status}`}>
                      {fmt(j.status)}
                    </span>
                    <h3>{j.title}</h3>
                    <p>
                      {j.department || "General"} · {j.type || "Full-time"}
                    </p>
                    <div className="job-location">
                      <MapPin size={14} />
                      {j.location || "Remote"}
                    </div>
                    {j.description && (
                      <p className="job-description">{j.description}</p>
                    )}
                    <div className="job-card-foot">
                      <span>
                        <CalendarDays size={14} />{" "}
                        {new Date(j.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        className="danger-text"
                        onClick={() => removeJob(j)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}
          {page === "Analytics" && (
            <>
              <div className="metric-grid">
                <Metric
                  title="Total applicants"
                  value={total}
                  note="All-time candidate volume"
                  icon={Users}
                  color="blue"
                />
                <Metric
                  title="Open jobs"
                  value={stats?.openJobs ?? 0}
                  note={`${stats?.totalJobs ?? jobs.length} total positions`}
                  icon={BriefcaseBusiness}
                  color="purple"
                />
                <Metric
                  title="Interviewing"
                  value={counts.interview || 0}
                  note="Candidates in interviews"
                  icon={CalendarDays}
                  color="orange"
                />
                <Metric
                  title="Hired"
                  value={counts.hired || 0}
                  note="Successful outcomes"
                  icon={CheckCircle2}
                  color="green"
                />
              </div>
              <div className="analytics-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Pipeline breakdown</h3>
                      <p>Candidate count by current status</p>
                    </div>
                  </div>
                  <div className="bars">
                    {statuses.map((s) => (
                      <div className="bar-row" key={s}>
                        <span>{fmt(s)}</span>
                        <div className="bar-track">
                          <div
                            className={`bar-fill s-${s}`}
                            style={{
                              width: `${total ? ((counts[s] || 0) / total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <strong>{counts[s] || 0}</strong>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel insights">
                  <div className="panel-head">
                    <div>
                      <h3>Hiring insights</h3>
                      <p>Based on current pipeline data</p>
                    </div>
                  </div>
                  <div className="insight-row">
                    <span className="insight-icon qi-green">
                      <CheckCircle2 size={17} />
                    </span>
                    <div>
                      <strong>Hiring conversion</strong>
                      <p>
                        {total
                          ? Math.round(((counts.hired || 0) / total) * 100)
                          : 0}
                        % of applicants are hired
                      </p>
                    </div>
                  </div>
                  <div className="insight-row">
                    <span className="insight-icon qi-purple">
                      <CalendarDays size={17} />
                    </span>
                    <div>
                      <strong>Interview pipeline</strong>
                      <p>
                        {counts.interview || 0} candidate(s) currently
                        interviewing
                      </p>
                    </div>
                  </div>
                  <div className="insight-row">
                    <span className="insight-icon qi-blue">
                      <BriefcaseBusiness size={17} />
                    </span>
                    <div>
                      <strong>Active opportunities</strong>
                      <p>{stats?.openJobs ?? 0} open position(s) to fill</p>
                    </div>
                  </div>
                  <button className="secondary full" onClick={exportCSV}>
                    <Download size={15} /> Export candidate data
                  </button>
                </section>
              </div>
            </>
          )}
          <div className="footer">
            <span>© 2026 HireFlow</span>
            <span>
              <span className="live-dot" />{" "}
              {busy ? "Syncing data" : "Connected to workspace API"}
            </span>
            <span>
              Made for better hiring <span className="heart">✳</span>
            </span>
          </div>
        </div>
      </main>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal("");
          }}
        >
          <form
            className="modal"
            onSubmit={modal === "applicant" ? saveApplicant : saveJob}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">HIREFLOW WORKSPACE</span>
                <h2>
                  {modal === "applicant"
                    ? editing
                      ? "Edit applicant"
                      : "Add applicant"
                    : editing
                      ? "Edit job"
                      : "Create a job"}
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setModal("")}
              >
                <X />
              </button>
            </div>
            {modal === "applicant" ? (
              <>
                <label>
                  Full name
                  <input
                    required
                    minLength="2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Aisha Rahman"
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="candidate@email.com"
                  />
                </label>
                <label>
                  Position / role
                  <input
                    required
                    minLength="2"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Product Designer"
                    list="job-titles"
                  />
                  <datalist id="job-titles">
                    {jobs.map((j) => (
                      <option key={j._id} value={j.title} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Pipeline status
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {fmt(s)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label>
                  Job title
                  <input
                    required
                    minLength="2"
                    value={jobForm.title}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, title: e.target.value })
                    }
                    placeholder="e.g. Full Stack Developer"
                  />
                </label>
                <div className="form-two">
                  <label>
                    Department
                    <input
                      value={jobForm.department}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, department: e.target.value })
                      }
                      placeholder="Engineering"
                    />
                  </label>
                  <label>
                    Location
                    <input
                      value={jobForm.location}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, location: e.target.value })
                      }
                      placeholder="Chennai / Hybrid"
                    />
                  </label>
                </div>
                <div className="form-two">
                  <label>
                    Employment type
                    <select
                      value={jobForm.type}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, type: e.target.value })
                      }
                    >
                      {["Full-time", "Part-time", "Contract", "Internship"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={jobForm.status}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, status: e.target.value })
                      }
                    >
                      {["open", "paused", "closed"].map((x) => (
                        <option key={x} value={x}>
                          {fmt(x)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Description
                  <textarea
                    rows="3"
                    value={jobForm.description}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, description: e.target.value })
                    }
                    placeholder="Responsibilities, requirements, and role details…"
                  />
                </label>
              </>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal("")}
              >
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {editing
                  ? "Save changes"
                  : modal === "applicant"
                    ? "Add applicant"
                    : "Create job"}{" "}
                <ArrowUpRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Metric({ title, value, note, icon: Icon, color }) {
  return (
    <div className="panel metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <span className={`metric-icon ${color}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="metric-value">{value ?? "—"}</div>
      <div className="metric-note">
        <span className="note-dot" />
        {note}
      </div>
    </div>
  );
}
function ApplicantTable({ list, onEdit, onDelete }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Applied for</th>
            <th>Status</th>
            <th>Date added</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan="5">
                <div className="table-empty">
                  No applicants found. Add a candidate to get started.
                </div>
              </td>
            </tr>
          ) : (
            list.map((a, i) => (
              <tr key={a._id || a.email}>
                <td>
                  <div className="candidate-cell">
                    <div className={`candidate-avatar av-${i % 5}`}>
                      {a.name
                        ?.split(/\s+/)
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong>{a.name}</strong>
                      <small>{a.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="role-text">{a.role}</span>
                </td>
                <td>
                  <span className={`status-badge ${a.status}`}>
                    {fmt(a.status)}
                  </span>
                </td>
                <td className="date-cell">
                  {a.createdAt
                    ? new Date(a.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="Edit"
                      onClick={() => onEdit(a)}
                    >
                      <Edit3 size={15} />
                    </button>
                    {onDelete && (
                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => onDelete(a)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
