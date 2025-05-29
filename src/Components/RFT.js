import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../CSS/Rft.css";
import useDatabase from "../Components/useDatabase";
const RFT = () => {
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);
  const [bloodUrea, setBloodUrea] = useState("");
  const [serum, setSerum] = useState("");
  const [uricAcid, setUricAcid] = useState("");
  const [bun, setBun] = useState("");

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [data, setData] = useState("");
  const location = useLocation();
  const { profile } = location.state || {}; // selected profile from state
  const { db, saveDatabase } = useDatabase();
  const testName = "RFT";
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
        setData(records);
      } catch (error) {
        console.error("Error loading RFT data:", error);
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
    if (
      !date ||
      !time ||
      !bloodUrea ||
      !serum ||
      !uricAcid ||
      !db ||
      !bun ||
      !profile
    )
      return;
    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      alert("Cannot record a future date/time");
      return;
    }

    const parameters = [
      {
        parameter: "Blood Urea",
        value: bloodUrea,
        unit: "mg/dL",
        ref: "10-50",
        min: 10,
        max: 50,
      },
      {
        parameter: "Serum",
        value: serum,
        unit: "mg/dL",
        ref: "0.4-1.3",
        min: 0.4,
        max: 1.3,
      },
      {
        parameter: "Uric Acid",
        value: uricAcid,
        unit: "mg/dL",
        ref: "3.7-7.7",
        min: 3.7,
        max: 7.7,
      },
      {
        parameter: "BUN",
        value: bun,
        unit: "mg/dL",
        ref: "5-24",
        min: 5,
        max: 24,
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
      setBun("");
      setBloodUrea("");

      setUricAcid("");
      setSerum("");

      alert("Renal Function Test saved successfully.");
    } catch (error) {
      console.error("Error inserting RFT record:", error);
    }
  };
  return (
    <div className="rftContainer">
      <h1>Renal Function Test</h1>

      <form onSubmit={handleAdd}>
        <label>
          Date
          <input
            type="date"
            placeholder="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
          />
        </label>
        <label>
          Time:
          <input
            type="time"
            placeholder="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            max={maxTime}
          />
        </label>
        <label>
          Blood Urea
          <input
            type="text"
            placeholder="10-50"
            value={bloodUrea}
            onChange={(e) => setBloodUrea(e.target.value)}
          />
        </label>
        <label>
          Serum Creatinine
          <input
            type="text"
            placeholder="0.4-1.3"
            value={serum}
            onChange={(e) => setSerum(e.target.value)}
          />
        </label>
        <label>
          Uric Acid
          <input
            type="text"
            placeholder="3.7-7.7"
            value={uricAcid}
            onChange={(e) => setUricAcid(e.target.value)}
          />
        </label>
        <label>
          BUN
          <input
            type="text"
            placeholder="5-24"
            value={bun}
            onChange={(e) => setBun(e.target.value)}
          />
        </label>

        <button type="submit" className="submit-button">
          Add
        </button>
      </form>
    </div>
  );
};

export default RFT;
