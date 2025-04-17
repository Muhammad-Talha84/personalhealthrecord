import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const HeartRate = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bpm, setBpm] = useState("");
  const [dataRecords, setDataRecords] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {}; // Get selected profile
  const { db, saveDatabase } = useDatabase();

  // Load heart rate records from the database for this profile
  const loadData = () => {
    if (db && profile) {
      try {
        const stmt = db.prepare(
          "SELECT date, time, value FROM Vitals WHERE profileName = ? AND vitalName = 'HeartRate'"
        );
        stmt.bind([profile.name]);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        setDataRecords(rows);
      } catch (error) {
        console.error("Error loading heart rate data:", error);
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

    // Check that all fields are provided
    if (!date || !time || !bpm || !db || !profile) return;

    // Convert bpm to a float and validate its range
    const bpmValue = parseFloat(bpm);
    if (isNaN(bpmValue) || bpmValue < 40 || bpmValue > 200) {
      alert("BPM value should be between 40 and 200");
      return;
    }

    try {
      // Insert the new heart rate record into the Vitals table
      const stmt = db.prepare(
        "INSERT INTO Vitals (profileName, vitalName, value, unit, date, time) VALUES (?, ?, ?, ?, ?, ?)"
      );
      stmt.run([profile.name, "HeartRate", bpmValue, "°bpm", date, time]);
      stmt.free();
      saveDatabase();
      // Reload records and clear form
      loadData();
      setDate("");
      setTime("");
      setBpm("");
    } catch (error) {
      console.error("Error inserting heart rate record:", error);
    }
  };

  // Prepare chart data: include a combined label and convert value to a number.
  const chartData = dataRecords.map((record) => ({
    ...record,
    dateTime: `${record.date} ${record.time}`,
    bpm: parseFloat(record.value),
  }));

  return (
    <div className="temp-container">
      <div className="temp-card">
        <h2>Record Heart Rate</h2>
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
            <label>BPM:</label>
            <input
              type="number"
              value={bpm}
              placeholder="Enter Heart rate in beats per minute"
              onChange={(e) => setBpm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add HeartRate
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeartRate;
