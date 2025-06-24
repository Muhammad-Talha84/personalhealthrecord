// LipidProfile.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../CSS/LipidProfile.css";
import useDatabase from "../Components/useDatabase";

const getToday = () => new Date().toISOString().split("T")[0];
const getNowTime = () => new Date().toTimeString().slice(0, 5);

// 1) Define your normal ranges here
const NORMAL_RANGES = {
  Cholesterol: { min: 0, max: 200 }, // <200 preferred
  HDL: { min: 40, max: Infinity }, // >40 (males) / >50 (females) – simplified to >40
  LDL: { min: 0, max: 130 }, // <130 preferred
  Triglycerides: { min: 0, max: 150 }, // <150 preferred
  VLDL: { min: 5, max: 40 }, // 5–40
};

const LipidProfile = () => {
  const [cholesterol, setCholesterol] = useState("");
  const [hdl, setHdl] = useState("");
  const [ldl, setLdl] = useState("");
  const [triglycerides, setTriglycerides] = useState("");
  const [vldl, setVldl] = useState("");

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [records, setRecords] = useState([]);

  const { profile } = useLocation().state || {};
  const { db, saveDatabase } = useDatabase();
  const testName = "LipidProfile";

  // load existing records (unchanged)
  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare(
      `SELECT parameter, result, unit, referenceValue, date, time, minValue, maxValue
       FROM LabReports
       WHERE profileName = ? AND testName = ?
       ORDER BY date DESC, time DESC`
    );
    stmt.bind([profile.name, testName]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setRecords(rows);
  }, [db, profile]);

  // keep time ≤ now when date is today
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
    // 2) basic field check
    if (!cholesterol || !hdl || !ldl || !triglycerides || !date || !time) {
      return alert("Please fill in all fields");
    }
    const selected = new Date(`${date}T${time}`);
    if (selected > new Date()) {
      return alert("Cannot record a future date/time");
    }

    // parse values
    const cholVal = +cholesterol;
    const hdlVal = +hdl;
    const ldlVal = +ldl;
    const triVal = +triglycerides;
    // auto‐calc VLDL if not provided
    const vldlVal = vldl ? +vldl : +(triVal / 5).toFixed(2);

    // 3) pack everything into an array by looping over your ranges
    const allValues = {
      Cholesterol: cholVal,
      HDL: hdlVal,
      LDL: ldlVal,
      Triglycerides: triVal,
      VLDL: vldlVal,
    };

    try {
      Object.entries(allValues).forEach(([parameter, value]) => {
        const range = NORMAL_RANGES[parameter];
        const isAbnormal = value < range.min || value > range.max;
        const refText = `${range.min}–${range.max}`;
        db.run(
          `INSERT INTO LabReports
            (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            profile.name,
            testName,
            parameter,
            value,
            "mg/dL",
            refText,
            date,
            time,
            range.min,
            range.max,
          ]
        );
        // optionally, you could do:
        // if (isAbnormal) console.warn(`${parameter} is abnormal!`);
      });
      saveDatabase();
      // refresh & clear
      setRecords((r) => []); // trigger reload
      // (reuse your loadData logic or just reload the page)
      setCholesterol("");
      setHdl("");
      setLdl("");
      setTriglycerides("");
      setVldl("");
      setDate(getToday());
      setTime(getNowTime());
      alert("Saved!");
    } catch (err) {
      console.error(err);
      alert("Error saving.");
    }
  };

  return (
    <div className="lipidContainer">
      <h1>Lipid Profile for {profile?.name}</h1>
      <form onSubmit={handleAdd} className="lipid-form">
        {/* date/time inputs (unchanged) */}
        <div className="form-row">
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getToday()}
              required
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              max={maxTime}
              required
            />
          </label>
        </div>

        {/* value inputs */}
        <div className="form-row">
          <label>
            Cholesterol
            <input
              type="number"
              value={cholesterol}
              onChange={(e) => setCholesterol(e.target.value)}
              placeholder="<200"
              required
            />
          </label>
          <label>
            HDL
            <input
              type="number"
              value={hdl}
              onChange={(e) => setHdl(e.target.value)}
              placeholder=">40"
              required
            />
          </label>
          <label>
            LDL
            <input
              type="number"
              value={ldl}
              onChange={(e) => setLdl(e.target.value)}
              placeholder="<130"
              required
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Triglycerides
            <input
              type="number"
              value={triglycerides}
              onChange={(e) => setTriglycerides(e.target.value)}
              placeholder="<150"
              required
            />
          </label>
          <label>
            VLDL (opt)
            <input
              type="number"
              value={vldl}
              onChange={(e) => setVldl(e.target.value)}
              placeholder="5–40"
            />
          </label>
        </div>

        <button type="submit">Add</button>
      </form>

      {/* You can render your records table below, using the minValue/maxValue from each row */}
    </div>
  );
};

export default LipidProfile;
