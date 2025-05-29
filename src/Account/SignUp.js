import React, { useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import { Email } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import "../CSS/SignUp.css";
import useDatabase from "../Components/useDatabase";

const SignUp = () => {
  const navigate = useNavigate();
  const { db, saveDatabase } = useDatabase();

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    // Basic validation for password matching
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (db) {
      try {
        // Insert the new user data into the users table
        db.run(
          "INSERT INTO users (fname, lname, email, password) VALUES (?, ?, ?, ?)",
          [fname, lname, email, password]
        );
        // Persist the database to localStorage
        saveDatabase();

        // Console log the current contents of the users table
        const stmt = db.prepare("SELECT * FROM users");
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        console.log("Current Users in DB:", rows);

        // Navigate to the login page after successful signup
        navigate("/");
      } catch (error) {
        console.error("Error during signup:", error);
        alert("An error occurred. The email might already be registered.");
      }
    } else {
      alert("Database is not ready yet. Please try again shortly.");
    }
  };

  return (
    <div className="signupouter-container">
      <div className="singuprounded-container">
        <h1>CREATE AN ACCOUNT</h1>
        <form onSubmit={handleSignup}>
          <div>
            <PersonIcon />
            <input
              style={{ marginTop: "-15px", width: "300px" }}
              type="text"
              placeholder="Enter First Name"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              required
            />
          </div>
          <div>
            <PersonIcon />
            <input
              style={{ marginTop: "-5px", width: "300px" }}
              type="text"
              placeholder="Enter Last Name"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              required
            />
          </div>
          <div>
            <Email />
            <input
              style={{ marginTop: "-5px", width: "300px" }}
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <LockIcon />
            <input
              style={{ marginTop: "-5px", width: "300px" }}
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <LockIcon />
            <input
              style={{ marginTop: "-5px", width: "300px" }}
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="button">
            Create
          </button>
        </form>
        <p className="error-message"></p>
        <p>
          Already have an account?{" "}
          <a style={{ textDecoration: "none" }} href="/">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
