import React, { useState } from "react";
import { FaUserPlus, FaSignInAlt } from "react-icons/fa";

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = isLogin
        ? "http://localhost:8080/auth/login"
        : "http://localhost:8080/auth/register";
      const body = isLogin
        ? { username: formData.username, password: formData.password }
        : {
            username: formData.username,
            password: formData.password,
            displayName: formData.displayName,
          };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        if (response.ok && !isLogin) {
          setError(
            "Registration successful! Please login with your credentials."
          );
          setFormData({ username: "", password: "", displayName: "" });
          setIsLogin(true);
          return;
        }
        setError(textResponse || "Authentication failed");
        return;
      }

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: "", password: "", displayName: "" });
    setError("");
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <h1 className="auth-title">{isLogin ? "Login" : "Register"}</h1>
        <p className="auth-subtitle">
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            required
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleInputChange}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            required
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
          />

          {!isLogin && (
            <>
              <label htmlFor="displayName">Display Name (optional)</label>
              <input
                id="displayName"
                type="text"
                name="displayName"
                placeholder="Enter your display name"
                value={formData.displayName}
                onChange={handleInputChange}
              />
            </>
          )}

          {error && (
            <div
              className={`auth-message ${
                error.includes("successful") ? "success" : "error"
              }`}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? (
              "Please wait..."
            ) : isLogin ? (
              <>
                <FaSignInAlt /> Login
              </>
            ) : (
              <>
                <FaUserPlus /> Register
              </>
            )}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={toggleMode} className="auth-toggle-btn">
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
