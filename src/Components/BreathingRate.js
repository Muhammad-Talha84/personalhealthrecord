import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "./useDatabase";
import "../CSS/PulseRate.css";
const BreathingRate = () => {
  const location = useLocation();
  const { profile } = location.state || {}; // Get selected profile
  const { db, saveDatabase } = useDatabase();
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [rate, setRate] = useState("");
  const [dataRecords, setDataRecords] = useState([]);
  // load existing records (with min/max for debugging)
  const loadData = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        `SELECT id, date, time, value, unit, minValue, maxValue
         FROM Vitals
         WHERE profileName = ?
           AND vitalName   = 'BreathingRate'
         ORDER BY date DESC, time DESC`
      );
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setDataRecords(rows);
    } catch (err) {
      console.error("Error loading breathing rate data:", err);
    }
  };

  useEffect(() => {
    if (db && profile) loadData();
  }, [db, profile]);

  // Prevent future times
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
    if (!date || !time || !rate || !db || !profile) return;

    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) {
      alert("Cannot record a future date/time");
      return;
    }

    const val = parseFloat(rate);
    const minVal = 12;
    const maxVal = 20;

    if (isNaN(val)) {
      alert("Please enter a valid number for breathing rate.");
      return;
    }

    // Warn & still save if out of normal range
    if (val < minVal || val > maxVal) {
      const ok = window.confirm(
        `⚠️ ${val} breaths/min is outside the normal range ` +
          `(${minVal}–${maxVal} breaths/min).\n\nSave anyway?`
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
        "BreathingRate",
        "breathing-rate",
        val,
        "breaths/min",
        date,
        time,
        minVal,
        maxVal,
      ]);
      stmt.free();
      saveDatabase();
      loadData();
      setRate("");
      setDate(getToday());
      setTime(getNowTime());
    } catch (err) {
      console.error("Error inserting breathing rate record:", err);
    }
  };

  return (
    <div className="pulse-container">
      <div className="pulse-card">
        <h2>Record Breathing Rate</h2>
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
            <label>Breaths/Min:</label>
            <input
              type="number"
              value={rate}
              placeholder="e.g. 16"
              onChange={(e) => setRate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Breathing Rate
          </button>
        </form>
      </div>
    </div>
  );
};

export default BreathingRate;
