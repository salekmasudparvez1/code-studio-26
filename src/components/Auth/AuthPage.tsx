import { FormEvent, useState } from "react";
import { useAuth } from "../../context/AuthContext";

type Mode = "login" | "signup";

export default function AuthPage() {
  const { login, signup, loginWithGoogle, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (mode === "signup") {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await loginWithGoogle();
    } catch {
      setError("Could not start Google authentication.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Welcome to CodeStudio</h1>
        <p>
          {mode === "login"
            ? "Sign in to continue to your workspace."
            : "Create an account to get started."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            aria-pressed={mode === "login"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            aria-pressed={mode === "signup"}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        <button
          className="google-button"
          type="button"
          disabled={isLoading}
          onClick={handleGoogle}
        >
          <span aria-hidden="true">G</span>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "signup" ? 12 : 1}
              maxLength={128}
              required
            />
          </label>

          {mode === "signup" && (
            <p className="auth-hint">Use at least 12 characters.</p>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="submit-button" type="submit" disabled={isLoading}>
            {isLoading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "New to CodeStudio?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}
