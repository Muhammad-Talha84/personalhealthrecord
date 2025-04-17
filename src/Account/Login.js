import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import phr from "../assets/images/phr.jpg";
import LockIcon from "@mui/icons-material/Lock";
import "../CSS/Login.css";
import { Email } from "@mui/icons-material";
import useDatabase from "../Components/useDatabase"; // Ensure the path is correct

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { db } = useDatabase(); // Get the database instance

  const handleLogin = (e) => {
    e.preventDefault();

    if (db) {
      try {
        // Prepare a SQL statement to retrieve a user by email
        const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
        stmt.bind([email]);

        let user = null;
        if (stmt.step()) {
          user = stmt.getAsObject();
        }
        stmt.free();

        if (!user) {
          alert("User not found. Please sign up.");
        } else if (user.password !== password) {
          alert("Incorrect password. Please try again.");
        } else {
          // Log the user data in the console for debugging
          console.log("User found:", user);
          // Save current user's email in localStorage for later use
          localStorage.setItem("currentUserEmail", email);
          // Navigate to the profile screen after successful login
          navigate("/profile");
        }
      } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
      }
    } else {
      alert("Database is not ready yet. Please try again shortly.");
    }
  };

  return (
    <div className="login__container">
      <div className="login__form-container">
        <h1>Login</h1>
        <img src={phr} alt="phr" className="login__image" />

        <form className="login__form" onSubmit={handleLogin}>
          <div className="login__input-group">
            <Email className="login__icon" />
            <input
              type="text"
              className="login__input"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login__input-group">
            <LockIcon className="login__icon" />
            <input
              type="password"
              className="login__input"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login__button">
            Login
          </button>
        </form>

        <p className="login__footer">
          Don't have an account?{" "}
          <a href="/signup" className="login__link">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
