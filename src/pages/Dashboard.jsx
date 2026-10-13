
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileImage,
  FolderOpen,
  ImagePlus,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { analyzeImageDemo } from "../lib/demoImageAnalyzer";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 4 * 1024 * 1024;

function getToolName(type) {
  const names = {
    image_analyzer: "Image Analyzer",
    image_analyzer_demo: "Image Analyzer (Demo)",
  };

  return names[type] || "Image Analyzer";
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [projects, setProjects] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadProjects = useCallback(async (userId) => {
    if (!userId) return;

    const { data, error: fetchError } = await supabase
      .from("vision_projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    setProjects(data || []);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
        setAuthReady(true);
        return;
      }

      const currentUser = data.session?.user;

      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);

      try {
        await loadProjects(currentUser.id);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Projects load nahi ho sake.");
        }
      }

      if (mounted) setAuthReady(true);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        navigate("/login", { replace: true });
      } else {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, loadProjects]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file) => {
    setError("");
    setNotice("");

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WEBP ya GIF image select karo.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image 4 MB se chhoti honi chahiye.");
      return;
    }

    const newPreview = URL.createObjectURL(file);

    setPreview((oldPreview) => {
      if (oldPreview) URL.revokeObjectURL(oldPreview);
      return newPreview;
    });

    setSelectedFile(file);
    setTitle((oldTitle) => oldTitle || file.name.replace(/\.[^/.]+$/, ""));
    setResult(null);
    setActiveProjectId(null);
  };

  const removeSelectedFile = () => {
    if (preview) URL.revokeObjectURL(preview);

    setPreview("");
    setSelectedFile(null);
    setResult(null);
    setActiveProjectId(null);
    setNotice("");
    setError("");
  };

  const handleAnalyzeDemo = async () => {
    if (!selectedFile) {
      setError("Pehle image upload karo.");
      return;
    }

    setError("");
    setNotice("");
    setResult(null);
    setLoading(true);

    try {
      const report = await analyzeImageDemo(selectedFile);

      setResult(report);
      setNotice("Demo analysis complete! Result neeche diya gaya hai.");

      window.setTimeout(() => {
        document
          .getElementById("analysis-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err.message || "Image analysis nahi ho saki.");
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!user) {
      setError("Session expire ho gaya. Dobara login karo.");
      return;
    }

    if (!result) {
      setError("Pehle image analyze karo, phir project save karo.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const projectTitle =
      title.trim() || selectedFile?.name || "Untitled project";

    const projectData = {
      user_id: user.id,
      title: projectTitle,
      tool_type: "image_analyzer_demo",
      image_name: selectedFile?.name || "Previously analyzed image",
      result: JSON.stringify(result),
    };

    try {
      if (activeProjectId) {
        const { error: updateError } = await supabase
          .from("vision_projects")
          .update(projectData)
          .eq("id", activeProjectId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        setNotice("Project successfully update ho gaya.");
      } else {
        const { data, error: insertError } = await supabase
          .from("vision_projects")
          .insert(projectData)
          .select()
          .single();

        if (insertError) throw insertError;

        setActiveProjectId(data.id);
        setNotice("Project Activity History mein save ho gaya.");
      }

      await loadProjects(user.id);
    } catch (err) {
      setError(
        err.message ||
          "Project save nahi hua. Supabase table aur RLS policies check karo."
      );
    } finally {
      setSaving(false);
    }
  };

  const openProject = (project) => {
    setError("");
    setNotice("");
    setActiveProjectId(project.id);
    setTitle(project.title || "");
    setResult(null);

    try {
      const parsedResult =
        typeof project.result === "string"
          ? JSON.parse(project.result)
          : project.result;

      setResult(parsedResult);
    } catch {
      setResult({
        heading: "Saved project",
        summary: project.result || "Is project mein readable result nahi hai.",
        details: [],
        observations: [],
      });
    }

    // Saved projects mein actual image file nahi hai.
    setSelectedFile(null);

    setPreview((oldPreview) => {
      if (oldPreview) URL.revokeObjectURL(oldPreview);
      return "";
    });

    setActiveNav("dashboard");

    window.setTimeout(() => {
      document
        .getElementById("analysis-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const deleteProject = async (projectId) => {
    if (!user) return;

    const confirmed = window.confirm(
      "Kya tum is project ko permanently delete karna chahte ho?"
    );

    if (!confirmed) return;

    setDeletingId(projectId);
    setError("");
    setNotice("");

    try {
      const { error: deleteError } = await supabase
        .from("vision_projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setProjects((current) =>
        current.filter((project) => project.id !== projectId)
      );

      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }

      setNotice("Project delete ho gaya.");
    } catch (err) {
      setError(err.message || "Project delete nahi hua.");
    } finally {
      setDeletingId(null);
    }
  };

  const logout = async () => {
    setError("");

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    navigate("/login", { replace: true });
  };

  const goTo = (section) => {
    setActiveNav(section);

    if (section === "dashboard") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const ids = {
      history: "activity-history",
      settings: "dashboard-settings",
    };

    document
      .getElementById(ids[section])
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!authReady) {
    return (
      <div className="dashboard-loading-screen">
        <LoaderCircle className="spin" size={32} />
        <p>VisionAI Studio load ho raha hai...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="vision-dashboard">
      <aside className="dashboard-sidebar">
        <a
          className="dashboard-brand"
          href="#dashboard-home"
          onClick={(event) => {
            event.preventDefault();
            goTo("dashboard");
          }}
        >
          <span className="dashboard-brand-icon">
            <WandSparkles size={22} />
          </span>
          <span>
            <strong>VisionAI</strong>
            <small>STUDIO</small>
          </span>
        </a>

        <div className="dashboard-sidebar-label">WORKSPACE</div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className={activeNav === "dashboard" ? "active" : ""}
            onClick={() => goTo("dashboard")}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={activeNav === "history" ? "active" : ""}
            onClick={() => goTo("history")}
          >
            <Activity size={18} />
            <span>Activity History</span>
            <span className="dashboard-nav-count">{projects.length}</span>
          </button>

          <button
            type="button"
            className={activeNav === "settings" ? "active" : ""}
            onClick={() => goTo("settings")}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-card">
            <div className="dashboard-avatar">
              <UserRound size={19} />
            </div>
            <div className="dashboard-user-copy">
              <strong>{user.email?.split("@")[0] || "User"}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-logout-button"
            onClick={logout}
          >
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            Workspace <span>/</span> {activeNav === "history"
              ? "Activity History"
              : activeNav === "settings"
                ? "Settings"
                : "Dashboard"}
          </div>

          <div className="dashboard-topbar-status">
            <span className="dashboard-status-dot" />
            Demo workspace
          </div>
        </header>

        <div className="dashboard-content" id="dashboard-home">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow">
                <WandSparkles size={14} />
                YOUR CREATIVE WORKSPACE
              </div>
              <h1>Welcome back!</h1>
              <p>
                Upload an image, generate a demo report, and manage your projects.
              </p>
            </div>

            <button
              type="button"
              className="dashboard-primary-button"
              onClick={() => goTo("dashboard")}
            >
              <ImagePlus size={17} />
              New analysis
            </button>
          </section>

          {error && (
            <div className="dashboard-alert dashboard-alert-error" role="alert">
              <X size={18} />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}

          {notice && (
            <div className="dashboard-alert dashboard-alert-success" role="status">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">
                <X size={16} />
              </button>
            </div>
          )}

          <section className="dashboard-stats">
            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon purple">
                <FolderOpen size={21} />
              </div>
              <div>
                <span>Saved projects</span>
                <strong>{projects.length}</strong>
                <small>Your project library</small>
              </div>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon blue">
                <FileImage size={21} />
              </div>
              <div>
                <span>Current image</span>
                <strong>{selectedFile ? "1" : "0"}</strong>
                <small>Image selected</small>
              </div>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon green">
                <BarChart3 size={21} />
              </div>
              <div>
                <span>Analysis status</span>
                <strong className="dashboard-stat-status">
                  {result ? "Ready" : "Waiting"}
                </strong>
                <small>Demo analysis mode</small>
              </div>
            </article>
          </section>

          <section className="dashboard-section" id="project-editor">
            <div className="dashboard-section-heading">
              <div>
                <div className="dashboard-eyebrow">IMAGE WORKSPACE</div>
                <h2>Image Analyzer</h2>
                <p>Upload an image to generate its demo report.</p>
              </div>
              <span className="dashboard-demo-pill">DEMO MODE</span>
            </div>

            <div className="dashboard-editor-grid">
              <div className="dashboard-upload-panel">
                <label className="dashboard-field-label" htmlFor="project-title">
                  Project name
                </label>

                <input
                  id="project-title"
                  className="dashboard-text-input"
                  type="text"
                  placeholder="e.g. My image analysis"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                />

                <div
                  className={`dashboard-upload-box ${dragging ? "is-dragging" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    handleFile(event.dataTransfer.files?.[0]);
                  }}
                >
                  <input
                    id="dashboard-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => {
                      handleFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    hidden
                  />

                  <div className="dashboard-upload-icon">
                    <Upload size={25} />
                  </div>

                  <h3>Upload your image</h3>
                  <p>Drag and drop an image here, or choose a file.</p>
                  <label
                    htmlFor="dashboard-image-upload"
                    className="dashboard-secondary-button"
                  >
                    <ImagePlus size={17} />
                    Choose image
                  </label>
                  <small>JPG, PNG, WEBP or GIF · Maximum 4 MB</small>
                </div>

                <div className="dashboard-action-row">
                  <button
                    type="button"
                    className="dashboard-primary-button"
                    onClick={handleAnalyzeDemo}
                    disabled={loading || !selectedFile}
                  >
                    {loading ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <WandSparkles size={17} />
                    )}
                    {loading ? "Analyzing..." : "Analyze image"}
                  </button>

                  <button
                    type="button"
                    className="dashboard-secondary-button"
                    onClick={saveProject}
                    disabled={saving || !result}
                  >
                    {saving ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <Save size={17} />
                    )}
                    {saving ? "Saving..." : "Save project"}
                  </button>
                </div>

                <p className="dashboard-helper-text">
                  Analysis is a demo. No AI model is connected.
                </p>
              </div>

              <div className="dashboard-preview-panel">
                <div className="dashboard-preview-heading">
                  <h3>Image preview</h3>
                  {selectedFile && (
                    <button
                      type="button"
                      className="dashboard-icon-button"
                      onClick={removeSelectedFile}
                      aria-label="Remove selected image"
                      title="Remove image"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                {preview ? (
                  <div className="dashboard-image-preview">
                    <img src={preview} alt="Selected image preview" />
                    <div className="dashboard-image-caption">
                      <FileImage size={17} />
                      <span>{selectedFile?.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-preview-empty">
                    <ImagePlus size={35} />
                    <strong>No image selected</strong>
                    <span>Your image preview will appear here.</span>
                  </div>
                )}

                {selectedFile && (
                  <div className="dashboard-file-details">
                    <div>
                      <span>Format</span>
                      <strong>{selectedFile.type.split("/")[1]?.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span>File size</span>
                      <strong>{(selectedFile.size / 1024).toFixed(1)} KB</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            className="dashboard-section dashboard-result-section"
            id="analysis-result"
          >
            <div className="dashboard-section-heading">
              <div>
                <div className="dashboard-eyebrow">YOUR OUTPUT</div>
                <h2>Analysis Result</h2>
                <p>Your report appears here after you click Analyze image.</p>
              </div>
              {result && (
                <span className="dashboard-demo-pill">
                  <CheckCircle2 size={14} />
                  REPORT READY
                </span>
              )}
            </div>

            {!result ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon">
                  <BarChart3 size={27} />
                </div>
                <h3>No result yet</h3>
                <p>
                  Upload an image and click <strong>Analyze image</strong>.
                  Your demo report will show up in this section.
                </p>
              </div>
            ) : (
              <div className="dashboard-result-content">
                <div className="dashboard-result-notice">
                  <ShieldCheck size={19} />
                  <div>
                    <strong>Demo analysis completed</strong>
                    <p>
                      This report contains file information only. Real AI image
                      recognition is not enabled.
                    </p>
                  </div>
                </div>

                <div className="dashboard-result-card">
                  <h3>{result.heading || "Image analysis report"}</h3>
                  <p className="dashboard-result-summary">
                    {result.summary || "Demo report generated."}
                  </p>

                  {result.details?.length > 0 && (
                    <div className="dashboard-report-block">
                      <h4>Image details</h4>
                      <ul>
                        {result.details.map((detail, index) => (
                          <li key={`${index}-${detail}`}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.observations?.length > 0 && (
                    <div className="dashboard-report-block">
                      <h4>Observations</h4>
                      <ul>
                        {result.observations.map((item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <details className="dashboard-raw-result">
                    <summary>View report data</summary>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </details>
                </div>

                <div className="dashboard-result-actions">
                  <button
                    type="button"
                    className="dashboard-primary-button"
                    onClick={saveProject}
                    disabled={saving}
                  >
                    <Save size={17} />
                    {saving ? "Saving..." : activeProjectId ? "Update saved project" : "Save this project"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="dashboard-section" id="activity-history">
            <div className="dashboard-section-heading">
              <div>
                <div className="dashboard-eyebrow">YOUR WORK</div>
                <h2>Activity History</h2>
                <p>Open or delete projects saved to your account.</p>
              </div>
              <span className="dashboard-project-count">
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon">
                  <Clock3 size={27} />
                </div>
                <h3>No saved projects yet</h3>
                <p>
                  Your saved analysis projects will appear here after you
                  analyze an image and save the report.
                </p>
                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={() => goTo("dashboard")}
                >
                  Start analyzing
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <div className="dashboard-history-list">
                {projects.map((project) => (
                  <article
                    className="dashboard-history-item"
                    key={project.id}
                  >
                    <div className="dashboard-project-icon">
                      <FileImage size={22} />
                    </div>

                    <div className="dashboard-history-details">
                      <strong>{project.title || "Untitled project"}</strong>
                      <span>{project.image_name || "Image file"}</span>
                      <small>
                        {getToolName(project.tool_type)} ·{" "}
                        {formatDate(project.created_at)}
                      </small>
                    </div>

                    <div className="dashboard-history-actions">
                      <button
                        type="button"
                        className="dashboard-history-open"
                        onClick={() => openProject(project)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="dashboard-delete-button"
                        onClick={() => deleteProject(project.id)}
                        disabled={deletingId === project.id}
                        aria-label={`Delete ${project.title || "project"}`}
                        title="Delete project"
                      >
                        {deletingId === project.id ? (
                          <LoaderCircle className="spin" size={17} />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section" id="dashboard-settings">
            <div className="dashboard-section-heading">
              <div>
                <div className="dashboard-eyebrow">PREFERENCES</div>
                <h2>Settings</h2>
                <p>View your account details and workspace information.</p>
              </div>
            </div>

            <div className="dashboard-settings-card">
              <div className="dashboard-settings-icon">
                <UserRound size={22} />
              </div>
              <div className="dashboard-settings-info">
                <h3>Account information</h3>
                <p>Your currently signed-in account.</p>
                <label htmlFor="dashboard-user-email">Email address</label>
                <input
                  id="dashboard-user-email"
                  className="dashboard-text-input"
                  type="email"
                  value={user.email || ""}
                  readOnly
                />
              </div>
            </div>

            <div className="dashboard-settings-card">
              <div className="dashboard-settings-icon">
                <ShieldCheck size={22} />
              </div>
              <div className="dashboard-settings-info">
                <h3>Workspace and privacy</h3>
                <p>
                  Projects are stored in your Supabase account and access is
                  governed by your database security policies.
                </p>
                <span className="dashboard-demo-pill">
                  Demo analysis enabled
                </span>
              </div>
            </div>

            <div className="dashboard-settings-card">
              <div className="dashboard-settings-icon">
                <LogOut size={22} />
              </div>
              <div className="dashboard-settings-info">
                <h3>Sign out</h3>
                <p>Sign out of your current VisionAI Studio account.</p>
                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={logout}
                >
                  <LogOut size={17} />
                  Log out
                </button>
              </div>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>VisionAI Studio</span>
            <span>Image Analyzer · Demo mode</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
