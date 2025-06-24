// src/screens/BloodPressure.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/BloodPressure.css";

const BloodPressure = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const profile = state?.profile;
  const { db, saveDatabase } = useDatabase();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

  const [data, setData] = useState([]);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());

  // load existing BP records (including min/max)
  const loadData = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        `SELECT id, date, time, value, unit, minValue, maxValue
         FROM Vitals
         WHERE profileName = ?
           AND vitalName   = 'BloodPressure'
         ORDER BY date DESC, time DESC`
      );
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setData(rows);
    } catch (err) {
      console.error("Error loading blood pressure data:", err);
    }
  };

  useEffect(() => {
    if (db && profile) loadData();
  }, [db, profile]);

  // prevent future times
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
    if (!profile || !db || !systolic || !diastolic || !date || !time) return;

    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) {
      alert("Cannot record a future date/time");
      return;
    }

    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    if (isNaN(sys) || isNaN(dia)) {
      alert("Please enter valid numbers for both systolic and diastolic.");
      return;
    }

    // define your normal ranges here:
    const minSys = 90,
      maxSys = 120;
    const minDia = 60,
      maxDia = 80;

    // warn & save if out of range
    if (sys < minSys || sys > maxSys || dia < minDia || dia > maxDia) {
      const ok = window.confirm(
        `⚠️ ${sys}/${dia} mmHg is outside the normal range\n` +
          `(Systolic: ${minSys}–${maxSys}, Diastolic: ${minDia}–${maxDia}).\n\n` +
          `Save anyway?`
      );
      if (!ok) return;
    }

    try {
      const stmt = db.prepare(
        `INSERT INTO Vitals
           (profileName, vitalName, value, unit, date, time, minValue, maxValue)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      stmt.run([
        profile.name,
        "BloodPressure",
        `${sys}/${dia}`,
        "mmHg",
        date,
        time,
        `${minSys}/${minDia}`,
        `${maxSys}/${maxDia}`,
      ]);
      stmt.free();
      saveDatabase();
      loadData();
      setSystolic("");
      setDiastolic("");
      setDate(getToday());
      setTime(getNowTime());
    } catch (err) {
      console.error("Error inserting blood pressure record:", err);
    }
  };

  return (
    <div className="bloodpressurecontainer">
      <div className="card">
        <h2>Blood Pressure Tracker</h2>
        <form onSubmit={handleAdd}>
          <label>Systolic:</label>
          <input
            type="number"
            placeholder="e.g. 120"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            required
          />
          <label>Diastolic:</label>
          <input
            type="number"
            placeholder="e.g. 80"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            required
          />
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
            required
          />
          <label>Time:</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            max={maxTime}
            required
          />
          <button type="submit">Add Blood Pressure</button>
        </form>
      </div>

      {/* Optional: debug list including min/max */}
      {/* <div className="records-list">
        <h3>All BP Records</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Value</th>
              <th>Normal Range</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.time}</td>
                <td>{r.value}</td>
                <td>
                  {r.minValue} – {r.maxValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}

      <div className="tabs">
        <button
          onClick={() => navigate("/bpgraph", { state: { data, profile } })}
        >
          Graph View
        </button>
        <button
          onClick={() => navigate("/bptable", { state: { data, profile } })}
        >
          Table View
        </button>
      </div>
    </div>
  );
};

export default BloodPressure;
