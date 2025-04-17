import React, { useState, useEffect } from "react";
import "../CSS/Temperature.css";
import { useNavigate, useLocation } from "react-router-dom";

import useDatabase from "../Components/useDatabase";

const Temperature = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [temperature, setTemperature] = useState("");
  const [dataRecords, setDataRecords] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {}; // Get selected profile
  const { db, saveDatabase } = useDatabase();

  // Load temperature records from the database for this profile
  const loadData = () => {
    if (db && profile) {
      try {
        const stmt = db.prepare(
          "SELECT date, time, value FROM Vitals WHERE profileName = ? AND vitalName = 'Temperature'"
        );
        stmt.bind([profile.name]);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        setDataRecords(rows);
      } catch (error) {
        console.error("Error loading temperature data:", error);
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
    if (!date || !time || !temperature || !db || !profile) return;
    try {
      // Insert the new temperature record into the Vitals table
      const stmt = db.prepare(
        "INSERT INTO Vitals (profileName, vitalName, value, unit, date, time) VALUES (?, ?, ?, ?, ?, ?)"
      );
      stmt.run([profile.name, "Temperature", temperature, "°F", date, time]);
      stmt.free();
      saveDatabase();
      // Reload records and clear form
      loadData();
      setDate("");
      setTime("");
      setTemperature("");
    } catch (error) {
      console.error("Error inserting temperature record:", error);
    }
  };

  // Prepare chart data: include a combined label and convert value to a number.
  const chartData = dataRecords.map((record) => ({
    ...record,
    dateTime: `${record.date} ${record.time}`,
    temperature: parseFloat(record.value),
  }));

  return (
    <div className="temp-container">
      <div className="temp-card">
        <h2>Record Temperature</h2>
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
            <label>Temperature:</label>
            <input
              type="number"
              value={temperature}
              placeholder="Enter temperature in Fahrenheit"
              onChange={(e) => setTemperature(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Temperature
          </button>
        </form>
      </div>
    </div>
  );
};

export default Temperature;
