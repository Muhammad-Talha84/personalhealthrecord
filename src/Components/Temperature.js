import React, { useState, useEffect } from "react";
import "../CSS/Temperature.css";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const Temperature = () => {
  const location = useLocation();
  const { profile } = location.state || {};
  const { db, saveDatabase } = useDatabase();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [temperature, setTemperature] = useState("");
  const [unit, setUnit] = useState("°F"); // default unit
  const [dataRecords, setDataRecords] = useState([]);

  const loadData = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        "SELECT date, time, value, unit FROM Vitals WHERE profileName = ? AND vitalName = 'Temperature'"
      );
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setDataRecords(rows);
    } catch (err) {
      console.error("Error loading temperature data:", err);
    }
  };

  useEffect(() => {
    if (db && profile) loadData();
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
    if (!date || !time || !temperature || !db || !profile) return;

    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      alert("Cannot record a future date/time");
      return;
    }

    let minVal, maxVal;

    if (unit === "°F") {
      minVal = 98;
      maxVal = 105;
    } else {
      minVal = 36;
      maxVal = 40.5;
    }

    const tempVal = parseFloat(temperature);
    if (isNaN(tempVal)) {
      alert("Please enter a valid number for temperature.");
      return;
    }

    if (tempVal < minVal || tempVal > maxVal) {
      alert(`Temperature must be between ${minVal} and ${maxVal} ${unit}`);
      return;
    }

    try {
      const stmt = db.prepare(
        "INSERT INTO Vitals (profileName, vitalName, type, value, unit, date, time, minValue, maxValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run([
        profile.name,
        "Temperature",
        "temperature",
        tempVal,
        unit,
        date,
        time,
        minVal,
        maxVal,
      ]);
      stmt.free();
      saveDatabase();

      loadData();
      setTemperature("");
      setDate(getToday());
      setTime(getNowTime());
    } catch (err) {
      console.error("Error inserting temperature record:", err);
    }
  };

  // const chartData = dataRecords.map((rec) => ({
  //   ...rec,
  //   dateTime: `${rec.date} ${rec.time}`,
  //   temperature: parseFloat(rec.value),
  //   unit: rec.unit,
  // })
  // );

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
            <label>Unit:</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="°F">°F</option>
              <option value="°C">°C</option>
            </select>
          </div>
          <div className="input-group">
            <label>Temperature ({unit}):</label>
            <input
              type="number"
              value={temperature}
              placeholder={`Enter temperature in ${unit}`}
              onChange={(e) => setTemperature(e.target.value)}
              step="0.1"
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
