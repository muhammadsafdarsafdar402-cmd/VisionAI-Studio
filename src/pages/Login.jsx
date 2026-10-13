
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) throw loginError;

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login nahi ho saka.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Pehle apna email address enter karein.");
      return;
    }

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim());

      if (resetError) throw resetError;

      setMessage("Password reset instructions ke liye apni email check karein.");
    } catch (err) {
      setError(err.message || "Password reset email nahi bheji ja saki.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">
            <Sparkles size={23} />
          </span>
          <span>VisionAI <b>Studio</b></span>
        </Link>

        <div className="auth-hero">
          <span className="auth-tag">YOUR CREATIVE AI WORKSPACE</span>

          <h1>
            See beyond
            <br />
            the <span>ordinary.</span>
          </h1>

          <p>
            Discover a smarter way to explore your images with
            AI-powered image intelligence.
          </p>

          <div className="visual-art">
            <div className="art-orbit orbit-one"></div>
            <div className="art-orbit orbit-two"></div>
            <div className="art-glow"></div>
            <div className="art-core">
              <Sparkles size={49} />
            </div>
            <span className="art-chip chip-one">
              ✦ Image intelligence
            </span>
            <span className="art-chip chip-two">
              AI-powered insights
            </span>
          </div>
        </div>

        <div className="auth-visual-footer">
          Intelligence meets imagination.
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <Sparkles size={22} /> VisionAI <b>Studio</b>
          </div>

          <span className="auth-welcome">WELCOME BACK</span>

          <h2>Sign in to your workspace</h2>

          <p className="auth-subtitle">
            Enter your details to continue your AI journey.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>

            <div className="auth-input-wrap">
              <Mail size={18} />

              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <label htmlFor="login-password">Password</label>

            <div className="auth-input-wrap">
              <Lock size={18} />

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                minLength={6}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <div className="auth-options">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>

              <button
                type="button"
                className="auth-link"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="auth-success" role="status">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/signup">Create account</Link>
          </p>

          <div className="auth-security">
            <Lock size={14} />
            Your workspace is designed with privacy in mind.
          </div>
        </div>
      </section>
    </main>
  );
}
