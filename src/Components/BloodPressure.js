import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/BloodPressure.css";

const BloodPressure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Destructure both db and saveDatabase from the hook
  const { db, saveDatabase } = useDatabase();

  // Ensure consistent naming; adjust if your state uses a different key
  const { profile, data: initialData } = location.state || {};
  // Alternatively, if you're using selectedProfile, then ensure you pass it correctly:
  // const selectedProfile = location.state?.selectedProfile || {};
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);
  // Use the same profile object as Temperature code if possible
  // const initialData = location.state?.data || [];
  const [data, setData] = useState(initialData);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());

  // Load blood pressure records from the database
  const loadData = () => {
    if (db && profile) {
      try {
        const stmt = db.prepare(
          "SELECT date, time, value FROM Vitals WHERE profileName = ? AND vitalName = 'BloodPressure'"
        );
        stmt.bind([profile.name]);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        setData(rows); // Use setData instead of setDataRecords
      } catch (error) {
        console.error("Error loading blood pressure data:", error);
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
    // Validate all fields are provided; adjust property name if needed
    if (!date || !time || !systolic || !diastolic || !db || !profile?.name)
      return;
    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      alert("Cannot record a future date/time");
      return;
    }
    try {
      const stmt = db.prepare(
        "INSERT INTO Vitals (profileName, vitalName, value, unit, date, time) VALUES (?, ?, ?, ?, ?, ?)"
      );
      stmt.run([
        profile.name,
        "BloodPressure",
        `${systolic}/${diastolic}`,
        "mmHg",
        date,
        time,
      ]);
      stmt.free();
      saveDatabase();
      loadData();
      setSystolic("");
      setDiastolic("");
      setDate(getToday());
      setTime(getNowTime());
    } catch (error) {
      console.error("Error inserting blood pressure record:", error);
    }
  };

  return (
    <div className="bloodpressurecontainer">
      <div className="card">
        <h2>Blood Pressure Tracker</h2>
        {/* <h3>Patient: {profile?.Name || profile?.name}</h3> */}
        {/* <p>Relation: {profile?.relation}</p> */}
        <form onSubmit={handleAdd}>
          <label>Systolic:</label>
          <input
            style={{ width: "150px" }}
            type="number"
            placeholder="Systolic Pressure"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            required
          />
          <label>Diastolic:</label>
          <input
            style={{ width: "150px" }}
            type="number"
            placeholder="Diastolic Pressure"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            required
          />
          <label>Date:</label>
          <input
            style={{ width: "150px" }}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <label>Time:</label>
          <input
            style={{ width: "150px" }}
            type="time"
            value={maxTime}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <button type="submit">Add Blood Pressure</button>
        </form>
      </div>

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
