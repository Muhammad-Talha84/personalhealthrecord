import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../CSS/LipidProfile.css";
import useDatabase from "../Components/useDatabase";

const getToday = () => new Date().toISOString().split("T")[0];
const getNowTime = () => new Date().toTimeString().slice(0, 5);

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

  const location = useLocation();
  const { profile } = location.state || {};
  const { db, saveDatabase } = useDatabase();
  const testName = "LipidProfile";

  const loadData = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        `SELECT parameter, result, unit, referenceValue, date, time
         FROM LabReports
         WHERE profileName = ? AND testName = ?
         ORDER BY date DESC, time DESC`
      );
      stmt.bind([profile.name, testName]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setRecords(rows);
    } catch (error) {
      console.error("Error loading Lipid Profile data:", error);
    }
  };

  useEffect(() => {
    loadData();
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
    if (
      !cholesterol ||
      !hdl ||
      !ldl ||
      !triglycerides ||
      !date ||
      !time ||
      !db ||
      !profile
    ) {
      alert("Please fill in all fields");
      return;
    }

    const selected = new Date(`${date}T${time}`);
    if (selected > new Date()) {
      alert("Cannot record a future date/time");
      return;
    }

    const cholVal = parseFloat(cholesterol);
    const hdlVal = parseFloat(hdl);
    const ldlVal = parseFloat(ldl);
    const triVal = parseFloat(triglycerides);
    const vldlCalc = parseFloat((triVal / 5).toFixed(2));
    const vldlVal = vldl ? parseFloat(vldl) : vldlCalc;

    const parameters = [
      {
        parameter: "Cholesterol",
        value: cholVal,
        unit: "mg/dL",
        ref: "100-240",
        min: 100,
        max: 240,
      },
      {
        parameter: "HDL",
        value: hdlVal,
        unit: "mg/dL",
        ref: "20-100",
        min: 20,
        max: 100,
      },
      {
        parameter: "LDL",
        value: ldlVal,
        unit: "mg/dL",
        ref: "0-300",
        min: 0,
        max: 300,
      },
      {
        parameter: "Triglycerides",
        value: triVal,
        unit: "mg/dL",
        ref: "0-1000",
        min: 0,
        max: 1000,
      },
      {
        parameter: "VLDL",
        value: vldlVal,
        unit: "mg/dL",
        ref: "5-40",
        min: 5,
        max: 40,
      },
    ];

    try {
      parameters.forEach((p) => {
        db.run(
          `INSERT INTO LabReports (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            profile.name,
            testName,
            p.parameter,
            p.value,
            p.unit,
            p.ref,
            date,
            time,
            p.min,
            p.max,
          ]
        );
      });
      saveDatabase();
      loadData();
      setCholesterol("");
      setHdl("");
      setLdl("");
      setTriglycerides("");
      setVldl("");
      setDate(getToday());
      setTime(getNowTime());
      alert("Lipid Profile saved successfully.");
    } catch (error) {
      console.error("Error saving Lipid Profile:", error);
    }
  };

  return (
    <div className="lipidContainer">
      <h1>Lipid Profile Tests for {profile?.name}</h1>
      <form onSubmit={handleAdd} className="lipid-form">
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
        <div className="form-row">
          <label>
            Cholesterol
            <input
              type="number"
              placeholder="mg/dL"
              value={cholesterol}
              onChange={(e) => setCholesterol(e.target.value)}
              required
            />
          </label>
          <label>
            HDL
            <input
              type="number"
              placeholder="mg/dL"
              value={hdl}
              onChange={(e) => setHdl(e.target.value)}
              required
            />
          </label>
          <label>
            LDL
            <input
              type="number"
              placeholder="mg/dL"
              value={ldl}
              onChange={(e) => setLdl(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Triglycerides
            <input
              type="number"
              placeholder="mg/dL"
              value={triglycerides}
              onChange={(e) => setTriglycerides(e.target.value)}
              required
            />
          </label>
          <label>
            VLDL (optional)
            <input
              type="number"
              placeholder="mg/dL"
              value={vldl}
              onChange={(e) => setVldl(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="submit-button">
          Add
        </button>
      </form>
    </div>
  );
};

export default LipidProfile;
