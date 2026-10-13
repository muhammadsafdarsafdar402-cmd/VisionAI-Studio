
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Eye,
  EyeOff,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (password.length < 6) {
      setError("Password kam az kam 6 characters ka hona chahiye.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password aur Confirm Password match nahi karte.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

      if (signupError) {
        const errorMessage =
          signupError.message?.toLowerCase() || "";

        if (
          errorMessage.includes("already registered") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("user already") ||
          errorMessage.includes("already been registered")
        ) {
          setError(
            "Is email ka account pehle se maujood hai. Please Login karein."
          );
          return;
        }

        throw signupError;
      }

      // Supabase kuch duplicate-email cases mein
      // identities ko empty return kar sakta hai.
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setError(
          "Is email ka account pehle se maujood hai. Please Login karein."
        );
        return;
      }

      if (data.session) {
        navigate("/dashboard");
        return;
      }

      setMessage(
        "Signup request process ho gayi. Agar aap naye user hain to confirmation email check karein. Agar pehle account banaya tha, to Login ya Forgot password use karein."
      );
    } catch (err) {
      setError(
        err.message || "Signup nahi ho saka. Dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-card">
        <Link to="/login" className="back-link">
          ← Back to Login
        </Link>

        <div className="brand">
          <div className="brand-icon">
            <BrainCircuit size={28} />
          </div>
          <span>VisionAI Studio</span>
        </div>

        <h1>Create your account</h1>

        <p className="subtitle">
          Start creating with AI today.
        </p>

        <form onSubmit={handleSignup}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <button
              type="button"
              className="eye-button"
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

          <label htmlFor="confirmPassword">
            Confirm password
          </label>
          <div className="password-field">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Enter password again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="eye-button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}

          <button
            className="signup-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="login-prompt">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
