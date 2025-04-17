import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const Cholesterol = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [ldl, setLdl] = useState("");
  const [hdl, setHdl] = useState("");
  const [totalCholesterol, setTotalCholesterol] = useState("");
  const [dataRecords, setDataRecords] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {}; // Get selected profile
  const { db, saveDatabase } = useDatabase();

  // Load cholesterol records from the database
  // NOTE: The value field is stored as "ldl/hdl/total"
  const loadData = () => {
    if (db && profile) {
      try {
        const stmt = db.prepare(
          "SELECT date, time, value FROM Vitals WHERE profileName = ? AND vitalName = 'Cholesterol'"
        );
        stmt.bind([profile.name]);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        setDataRecords(rows);
      } catch (error) {
        console.error("Error loading cholesterol data:", error);
      }
    }
  };

  useEffect(() => {
    if (db && profile) {
      loadData();
    }
  }, [db, profile]);

  const handleAdd = (e) => {
    e.preventDefault();

    // Ensure all fields are provided
    if (!date || !time || !ldl || !hdl || !totalCholesterol || !db || !profile)
      return;

    // Parse and validate each cholesterol value
    const ldlValue = parseFloat(ldl);
    const hdlValue = parseFloat(hdl);
    const totalCholValue = parseFloat(totalCholesterol);

    // Validate LDL: assume realistic range 0 to 300 mg/dL.
    if (isNaN(ldlValue) || ldlValue < 0 || ldlValue > 300) {
      alert("LDL value should be between 0 and 300 mg/dL");
      return;
    }
    // Validate HDL: assume realistic range 0 to 100 mg/dL.
    if (isNaN(hdlValue) || hdlValue < 0 || hdlValue > 100) {
      alert("HDL value should be between 0 and 100 mg/dL");
      return;
    }
    // Validate Total Cholesterol: assume realistic range 100 to 400 mg/dL.
    if (isNaN(totalCholValue) || totalCholValue < 100 || totalCholValue > 400) {
      alert("Total Cholesterol should be between 100 and 400 mg/dL");
      return;
    }

    try {
      // Insert the new cholesterol record into the Vitals table
      // The values are stored in a single field as "ldl/hdl/total"
      const stmt = db.prepare(
        "INSERT INTO Vitals (profileName, vitalName, value, unit, date, time) VALUES (?, ?, ?, ?, ?, ?)"
      );
      stmt.run([
        profile.name,
        "Cholesterol",
        `${ldlValue}/${hdlValue}/${totalCholValue}`,
        "mg/dL",
        date,
        time,
      ]);
      stmt.free();
      saveDatabase();
      // Reload records and clear form fields
      loadData();
      setDate("");
      setTime("");
      setLdl("");
      setHdl("");
      setTotalCholesterol("");
    } catch (error) {
      console.error("Error inserting cholesterol record:", error);
    }
  };

  // Display records: parse the combined string and show values separately
  const displayRecords = dataRecords.map((record, index) => {
    // Splits the stored string based on "/"
    const [storedLDL, storedHDL, storedTotal] = record.value.split("/");
    return (
      <div key={index} className="record">
        <div>Date: {record.date}</div>
        <div>Time: {record.time}</div>
        <div>LDL: {storedLDL} mg/dL</div>
        <div>HDL: {storedHDL} mg/dL</div>
        <div>Total Cholesterol: {storedTotal} mg/dL</div>
      </div>
    );
  });

  return (
    <div className="temp-container">
      <div className="temp-card">
        <h2>Record Cholesterol</h2>
        <form onSubmit={handleAdd}>
          <div className="input-group">
            <label>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Time:</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>LDL (mg/dL):</label>
            <input
              type="number"
              value={ldl}
              placeholder="Enter LDL"
              onChange={(e) => setLdl(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>HDL (mg/dL):</label>
            <input
              type="number"
              value={hdl}
              placeholder="Enter HDL"
              onChange={(e) => setHdl(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Total Cholesterol (mg/dL):</label>
            <input
              type="number"
              value={totalCholesterol}
              placeholder="Enter Total Cholesterol"
              onChange={(e) => setTotalCholesterol(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Cholesterol
          </button>
        </form>
      </div>

      {/* Display the stored records with separate values */}
      <div className="records-container">
        <h3>Cholesterol Records</h3>
        {displayRecords}
      </div>
    </div>
  );
};

export default Cholesterol;
