import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/BloodCp.css";

const BloodCP = () => {
  const location = useLocation();
  const { profile } = location.state || {};
  const { db, saveDatabase } = useDatabase();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [rbc, setRbc] = useState("");
  const [wbc, setWbc] = useState("");
  const [platelets, setPlatelets] = useState("");
  const [hb, setHb] = useState("");
  const [hct, setHct] = useState("");
  const [records, setRecords] = useState([]);

  const testName = "BloodCP";

  const loadData = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        `SELECT parameter, result, unit, referenceValue, date, time
         FROM LabReports
         WHERE profileName = ? AND testName = ?`
      );
      stmt.bind([profile.name, testName]);

      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      setRecords(rows);
    } catch (error) {
      console.error("Error loading Blood CP data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [db, profile]);

  // derive maxTime dynamically
  const today = getToday();
  const nowTime = getNowTime();
  const maxTime = date === today ? nowTime : "23:59";
  if (date === today && time > nowTime) {
    setTime(nowTime);
  }

  const handleAdd = (e) => {
    e.preventDefault();

    // require all fields
    if ([rbc, wbc, platelets, hb, hct].some((v) => v === "")) {
      alert("Please fill in all fields.");
      return;
    }

    const selected = new Date(`${date}T${time}`);
    if (selected > new Date()) {
      alert("Cannot record a future date/time");
      return;
    }

    const parameters = [
      {
        parameter: "RBC",
        value: rbc,
        unit: "mil/mm3",
        ref: "4.5-5.5",
        min: 4.5,
        max: 5.5,
      },
      {
        parameter: "WBC",
        value: wbc,
        unit: "/mm3",
        ref: "4,000 - 10,000",
        min: 4000,
        max: 10000,
      },
      {
        parameter: "Platelets",
        value: platelets,
        unit: "/mm3",
        ref: "150,000 - 410,000",
        min: 150000,
        max: 410000,
      },
      {
        parameter: "HB",
        value: hb,
        unit: "g/dL",
        ref: "13.0-17.0",
        min: 13,
        max: 17,
      },
      {
        parameter: "HCT",
        value: hct,
        unit: "%",
        ref: "40-50",
        min: 40,
        max: 50,
      },
    ];

    try {
      db.exec("BEGIN TRANSACTION;");
      const stmt = db.prepare(
        `INSERT INTO LabReports
         (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

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
      db.exec("COMMIT;");
      saveDatabase();

      // optimistic update
      setRecords((prev) => [
        ...prev,
        ...parameters.map((p) => ({
          parameter: p.parameter,
          result: p.value,
          unit: p.unit,
          referenceValue: p.ref,
          date,
          time,
        })),
      ]);

      // reset form
      setDate(getToday());
      setTime(getNowTime());
      setRbc("");
      setWbc("");
      setPlatelets("");
      setHb("");
      setHct("");

      alert("Blood CP Function Test saved successfully.");
    } catch (error) {
      console.error("Error inserting Blood CP record:", error);
    }
  };

  return (
    <div className="CPcontainer">
      <h1>Blood CP</h1>
      <form onSubmit={handleAdd}>
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={getToday()}
        />

        <label htmlFor="time">Time</label>
        <input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          max={maxTime}
        />

        <label htmlFor="rbc">RBC</label>
        <input
          id="rbc"
          type="number"
          placeholder="4.5-5.5"
          value={rbc}
          onChange={(e) =>
            setRbc(e.target.value === "" ? "" : parseFloat(e.target.value))
          }
        />

        <label htmlFor="wbc">WBC</label>
        <input
          id="wbc"
          type="number"
          placeholder="4,000-10,000"
          value={wbc}
          onChange={(e) =>
            setWbc(e.target.value === "" ? "" : parseFloat(e.target.value))
          }
        />

        <label htmlFor="hb">Hemoglobin</label>
        <input
          id="hb"
          type="number"
          placeholder="13.0-17.0"
          value={hb}
          onChange={(e) =>
            setHb(e.target.value === "" ? "" : parseFloat(e.target.value))
          }
        />

        <label htmlFor="hct">Hematocrit</label>
        <input
          id="hct"
          type="number"
          placeholder="40-50"
          value={hct}
          onChange={(e) =>
            setHct(e.target.value === "" ? "" : parseFloat(e.target.value))
          }
        />

        <label htmlFor="platelets">Platelets</label>
        <input
          id="platelets"
          type="number"
          placeholder="150,000-410,000"
          value={platelets}
          onChange={(e) =>
            setPlatelets(
              e.target.value === "" ? "" : parseFloat(e.target.value)
            )
          }
        />

        <button type="submit" className="submit-button">
          Add
        </button>
      </form>
    </div>
  );
};

export default BloodCP;
