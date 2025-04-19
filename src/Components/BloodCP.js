import { React, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/BloodCp.css";
import { AiOutlineArrowLeft } from "react-icons/ai";
const BloodCP = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [rbc, setRbc] = useState("");
  const [wbc, setWbc] = useState("");
  const [platelets, setPlatelets] = useState("");
  const [hb, setHb] = useState("");
  const [hct, setHct] = useState("");
  const location = useLocation();
  const { profile } = location.state || {}; // selected profile from state
  const { db, saveDatabase } = useDatabase();
  const testName = "BloodCP";
  const loadData = () => {
    if (db && profile) {
      try {
        const stmt =
          db.prepare(`SELECT parameter, result, unit, referenceValue, date, time
  FROM LabReports
  WHERE profileName = ? AND testName = ?`);
        stmt.bind([profile.name, testName]);
        const records = [];
        while (stmt.step()) {
          records.push(stmt.getAsObject());
        }
        stmt.free();
        setDate(records);
      } catch (error) {
        console.error("Error loading Blood CP data:", error);
      }
    }
  };
  useEffect(() => {
    if (db && profile) {
      loadData();
    }
  }, [db, profile]);
  const handleAdd = (e) => {
    e.preventDefault();
    if (!date || !time || !rbc || !wbc || !platelets || !hb || !hct) return;
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
        parameter: "Platelets ",
        value: platelets,
        unit: "/mm3",
        ref: "150,000 - 410,000",
        min: 150000,
        max: 410000,
      },
      {
        parameter: "HB ",
        value: hb,
        unit: "g/dL",
        ref: "13.0-17.0",
        min: 13,
        max: 17,
      },
      {
        parameter: "HCT ",
        value: hct,
        unit: "%",
        ref: "40-50",
        min: 40,
        max: 50,
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
      setDate("");
      setTime("");
      setHb("");
      setHct("");
      setRbc("");
      setWbc("");
      setPlatelets("");
      alert("Blood CP Function Test saved successfully.");
    } catch (error) {
      console.error("Error inserting Blood CP record:", error);
    }
  };
  return (
    <div className="CPcontainer">
      <h1>Blood CP</h1>
      <form onSubmit={handleAdd}>
        <label>
          Date
          <input
            type="date"
            placeholder="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Time:
          <input
            type="time"
            placeholder="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label>
          RBC
          <input
            type="number"
            placeholder="4.5-5.5"
            value={rbc}
            onChange={(e) => setRbc(e.target.value)}
          />
        </label>
        <label>
          WBC
          <input
            type="number"
            placeholder="4,000-10,000"
            value={wbc}
            onChange={(e) => setWbc(e.target.value)}
          />
        </label>
        <label>
          Hemoglobin:
          <input
            type="number"
            placeholder="13.0-17.0"
            value={hb}
            onChange={(e) => setHb(e.target.value)}
          />
        </label>
        <label>
          Hematocrit:
          <input
            type="number"
            placeholder="40-50"
            value={hct}
            onChange={(e) => setHct(e.target.value)}
          />
        </label>

        <label>
          Platelets:
          <input
            type="number"
            placeholder="150-000,410-000"
            value={platelets}
            onChange={(e) => setPlatelets(e.target.value)}
          />
        </label>
        <button type="submit" className="submit-button">
          Add
        </button>
      </form>
    </div>
  );
};

export default BloodCP;
