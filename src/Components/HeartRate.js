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

  // load existing heart rate records (including min/max)
  const loadData = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        `SELECT id, date, time, value, unit, minValue, maxValue
       FROM Vitals
       WHERE profileName = ?
         AND vitalName   = 'HeartRate'
       ORDER BY date DESC, time DESC`
      );
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setDataRecords(rows);
    } catch (err) {
      console.error("Error loading heart rate data:", err);
    }
  };

  useEffect(() => {
    if (db && profile) loadData();
  }, [db, profile]);

  useEffect(() => {
    const today = getToday();
    const now = getNowTime();
    if (date === today) {
      setMaxTime(now);
      if (time > now) setTime(now);
    } else {
      setMaxTime("23:59");
    }
  }, [date, time]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!date || !time || !bpm || !db || !profile) return;

    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) {
      alert("Cannot record a future date/time");
      return;
    }

    const bpmVal = parseFloat(bpm);
    const minVal = 40;
    const maxVal = 100;

    if (isNaN(bpmVal)) {
      alert("Please enter a valid number for BPM.");
      return;
    }

    // warn but still save if out of normal range
    if (bpmVal < minVal || bpmVal > maxVal) {
      const ok = window.confirm(
        `⚠️ ${bpmVal} bpm is outside the normal range (${minVal}–${maxVal} bpm).\n\nSave anyway?`
      );
      if (!ok) return;
    }

    try {
      const stmt = db.prepare(
        `INSERT INTO Vitals
         (profileName, vitalName, type, value, unit, date, time, minValue, maxValue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      stmt.run([
        profile.name,
        "HeartRate",
        "heart-rate",
        bpmVal,
        "bpm",
        date,
        time,
        minVal,
        maxVal,
      ]);
      stmt.free();
      saveDatabase();
      loadData();
      setBpm("");
      setDate(getToday());
      setTime(getNowTime());
    } catch (err) {
      console.error("Error inserting heart rate record:", err);
    }
  };

  return (
    <div className="heart-container">
      <div className="heart-card">
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
              placeholder="Enter BPM"
              onChange={(e) => setBpm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Heart Rate
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeartRate;
