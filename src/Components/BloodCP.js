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
            placeholder="Red Blood Cells"
            value={rbc}
            onChange={(e) => setRbc(e.target.value)}
          />
        </label>
        <label>
          WBC
          <input
            type="number"
            placeholder="White Blood Cells"
            value={wbc}
            onChange={(e) => setWbc(e.target.value)}
          />
        </label>
        <label>
          Hemoglobin:
          <input
            type="number"
            placeholder="Hemoglobin"
            value={hb}
            onChange={(e) => setHb(e.target.value)}
          />
        </label>
        <label>
          Hematocrit:
          <input
            type="number"
            placeholder="Hematocrit"
            value={hct}
            onChange={(e) => setHct(e.target.value)}
          />
        </label>

        <label>
          Platelets:
          <input
            type="number"
            placeholder="Platelets"
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
