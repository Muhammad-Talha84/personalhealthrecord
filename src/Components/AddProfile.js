import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import useDatabase from "../Components/useDatabase"; // Import useDatabase hook
import "../CSS/AddProfile.css";
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
    <div className="addProfileContainer">
      <h2 className="addProfileTitle">Add Profile</h2>
      <form form onSubmit={handleSubmit} className="addProfileForm">
        {/* Name Field */}
        <div className="formGroup">
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
        <div className="formGroup">
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
        <div className="formGroup">
          <label>DOB:</label>
          <input
            type="date"
            value={DOB}
            onChange={(e) => setDOB(e.target.value)}
            required
          />
        </div>

        {/* Gender Field */}
        <div className="formGroup gendergroup">
          <label className="labelTitle">Gender:</label>
          <label className="radioOption">
            <input
              type="radio"
              name="gender"
              value="Male"
              onChange={(e) => setGender(e.target.value)}
              required
            />
            Male
          </label>
          <label className="radioOption">
            <input
              type="radio"
              name="gender"
              value="Female"
              onChange={(e) => setGender(e.target.value)}
            />
            Female
          </label>
        </div>

        {/* Other Fields */}
        <div className="formGroup">
          <label>Blood Group</label>
          <input
            type="text"
            placeholder="Enter Blood Group"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          />
        </div>
        <div className="formGroup">
          <label>Height</label>
          <input
            type="text"
            placeholder="Enter Height (feet)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div className="formGroup">
          <label>Weight</label>
          <input
            type="text"
            placeholder="Enter Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <button type="submit">Add Profile</button>
      </form>
    </div>
  );
};

export default AddProfile;
