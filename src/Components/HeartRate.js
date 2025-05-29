import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const HeartRate = () => {
  const location = useLocation();
  const { profile } = location.state || {}; // Get selected profile
  const { db, saveDatabase } = useDatabase();
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [bpm, setBpm] = useState("");
  const [dataRecords, setDataRecords] = useState([]);

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
  useEffect(() => {
    const today = getToday();
    const nowTime = getNowTime();
    if (date === today) {
      setMaxTime(nowTime);
      if (time > nowTime) setTime(nowTime);
    } else {
      setMaxTime("23:59");
    }
  }, [date, time]);
  const handleAdd = (e) => {
    e.preventDefault();

    // Check that all fields are provided
    if (!date || !time || !bpm || !db || !profile) return;
    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      alert("Cannot record a future date/time");
      return;
    }

    // Convert bpm to a float and validate its range
    const bpmValue = parseFloat(bpm);
    if (isNaN(bpmValue) || bpmValue < 40 || bpmValue > 100) {
      alert("BPM value should be between 40 and 100");
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
      setDate(getToday());
      setTime(getNowTime());
      setBpm("");
    } catch (error) {
      console.error("Error inserting heart rate record:", error);
    }
  };

  // Prepare chart data: include a combined label and convert value to a number.
  // const chartData = dataRecords.map((record) => ({
  //   ...record,
  //   dateTime: `${record.date} ${record.time}`,
  //   bpm: parseFloat(record.value),
  // }));

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
              max={getToday()}
              required
            />
          </div>
          <div className="input-group">
            <label>Time:</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              max={maxTime}
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
