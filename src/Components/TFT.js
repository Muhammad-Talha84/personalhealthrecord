import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/TFT.css";

const TFT = () => {
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [t3, setT3] = useState("");
  const [t4, setT4] = useState("");
  const [tsh, setTSH] = useState("");
  const [dataRecords, setDataRecords] = useState([]);
  const location = useLocation();
  const { profile } = location.state || {}; // selected profile from state
  const { db, saveDatabase } = useDatabase();

  const testName = "TFT";

  const loadData = () => {
    if (db && profile) {
      try {
        const stmt = db.prepare(`
          SELECT parameter, result, unit, referenceValue, date, time
          FROM LabReports
          WHERE profileName = ? AND testName = ?
        `);
        stmt.bind([profile.name, testName]);

        const records = [];
        while (stmt.step()) {
          records.push(stmt.getAsObject());
        }
        stmt.free();
        setDataRecords(records);
      } catch (error) {
        console.error("Error loading TFT data:", error);
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
    if (!date || !time || !t3 || !t4 || !tsh || !db || !profile) return;
    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      alert("Cannot record a future date/time");
      return;
    }
    const parameters = [
      {
        parameter: "T3",
        value: t3,
        unit: "ng/mL",
        ref: "0.6-1.6",
        min: 0.6,
        max: 1.6,
      },
      {
        parameter: "T4",
        value: t4,
        unit: "μg/dL",
        ref: "4.5-10.9",
        min: 4.5,
        max: 10.9,
      },
      {
        parameter: "TSH",
        value: tsh,
        unit: "μIU/mL",
        ref: "0.4-4.5",
        min: 0.4,
        max: 4.5,
      },
    ];

    try {
      const stmt = db.prepare(`
        INSERT INTO LabReports (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      parameters.forEach((p) => {
        stmt.run([
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
        ]);
      });

      stmt.free();
      saveDatabase();
      loadData();

      // Clear form
      setDate(getToday());
      setTime(getNowTime());
      setT3("");
      setT4("");
      setTSH("");
      alert("Thyroid Function Test saved successfully.");
    } catch (error) {
      console.error("Error inserting TFT record:", error);
    }
  };

  return (
    <div className="tftContainer">
      <div className="tft-card">
        <h2>Record Thyroid Function Test</h2>
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
            <label>T3 (ng/mL):</label>
            <input
              type="number"
              value={t3}
              onChange={(e) => setT3(e.target.value)}
              placeholder="0.6-1.6"
              required
            />
          </div>
          <div className="input-group">
            <label>T4 (μg/dL):</label>
            <input
              type="number"
              value={t4}
              onChange={(e) => setT4(e.target.value)}
              placeholder="4.5-10.9"
              required
            />
          </div>
          <div className="input-group">
            <label>TSH (μIU/mL):</label>
            <input
              type="number"
              value={tsh}
              onChange={(e) => setTSH(e.target.value)}
              placeholder="0.4-4.5"
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add TFT Record
          </button>
        </form>
      </div>
    </div>
  );
};

export default TFT;
