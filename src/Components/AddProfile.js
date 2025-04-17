import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineUser,
  AiOutlineCalendar,
  AiOutlineMan,
  AiOutlineWoman,
  AiOutlineArrowLeft,
} from "react-icons/ai";
import useDatabase from "../Components/useDatabase"; // Import useDatabase hook

const AddProfile = () => {
  const { db, saveDatabase } = useDatabase(); // Initialize database
  const navigate = useNavigate();
  // Retrieve the current user's email from localStorage (or from context/state)
  const currentUserEmail = localStorage.getItem("currentUserEmail");
  const [Name, setName] = useState("");
  const [Relation, setRelation] = useState("");
  const [DOB, setDOB] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [customRelation, setCustomRelation] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const predefinedRelations = [
    "Self",
    "Father",
    "Mother",
    "Sister",
    "Brother",
    "Uncle",
    "Aunty",
    "Friend",
    "Colleague",
    "Neighbor",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!db) {
      alert("Database is not initialized yet. Please try again.");
      return;
    }

    try {
      // Create the profiles table if it doesn't exist
      db.run(
        "CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY AUTOINCREMENT,userEmail TEXT, name TEXT, relation TEXT, dob TEXT, gender TEXT, bloodGroup TEXT, height TEXT, weight TEXT);"
      );

      // Insert the profile data into the database
      db.run(
        "INSERT INTO profiles (userEmail,name, relation, dob, gender, bloodGroup, height, weight) VALUES (?, ?, ?, ?, ?, ?, ?,?)",
        [
          currentUserEmail,
          Name,
          isCustom ? customRelation : Relation,
          DOB,
          gender,
          bloodGroup,
          height,
          weight,
        ]
      );

      // Persist the database to localStorage
      saveDatabase();
      alert("Profile added successfully!");
      navigate("/profile"); // Navigate to the profile display screen
    } catch (error) {
      console.error("Error adding profile:", error);
      alert("An error occurred while adding the profile.");
    }
  };

  const handleRelationChange = (e) => {
    const value = e.target.value;
    if (value === "Other") {
      setIsCustom(true);
      setRelation("");
    } else {
      setIsCustom(false);
      setRelation(value);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f4f4f4",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "480px" }}>
        <h2>Add Profile</h2>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
          width: "320px",
          backgroundColor: "#fff",
          position: "absolute",
          marginTop: "350px",
        }}
      >
        {/* Name Field */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AiOutlineUser size={20} />
          <label>Name:</label>
          <input
            type="text"
            placeholder="Enter Name"
            value={Name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Relation Field */}
        <div>
          <label>Relation:</label>
          <select value={Relation} onChange={handleRelationChange} required>
            <option value="">Select Relation</option>
            {predefinedRelations.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
          {isCustom && (
            <input
              type="text"
              placeholder="Enter Custom Relation"
              value={customRelation}
              onChange={(e) => setCustomRelation(e.target.value)}
              required
            />
          )}
        </div>

        {/* DOB Field */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AiOutlineCalendar size={20} />
          <label>DOB:</label>
          <input
            type="date"
            value={DOB}
            onChange={(e) => setDOB(e.target.value)}
            required
          />
        </div>

        {/* Gender Field */}
        <div>
          <label>Gender:</label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Male"
              onChange={(e) => setGender(e.target.value)}
              required
            />
            <AiOutlineMan /> Male
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Female"
              onChange={(e) => setGender(e.target.value)}
            />
            <AiOutlineWoman /> Female
          </label>
        </div>

        {/* Other Fields */}
        <label>Blood Group</label>
        <input
          type="text"
          placeholder="Enter Blood Group"
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
        />
        <label>Height</label>
        <input
          type="text"
          placeholder="Enter Height (feet)"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
        <label>Weight</label>
        <input
          type="text"
          placeholder="Enter Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <button type="submit">Add Profile</button>
      </form>
    </div>
  );
};

export default AddProfile;
