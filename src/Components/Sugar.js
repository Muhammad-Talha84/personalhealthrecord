import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../CSS/Sugar.css";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const Sugar = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const profile = state?.profile; // Expecting { name: string, ... }
  const { db, saveDatabase } = useDatabase();

  const [glucoseData, setGlucoseData] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    glucoseRate: "",
    type: "Fasting",
  });
  const [view, setView] = useState("Daily");
  const [selectedType, setSelectedType] = useState("Fasting");

  // 1) Load all Glucose readings for this profile
  useEffect(() => {
    if (!db || !profile) return;

    try {
      const stmt = db.prepare(
        `SELECT date, time, value AS glucoseRate, type
         FROM Vitals
         WHERE profileName = ? AND vitalName = 'Glucose'
         ORDER BY date, time`
      );
      stmt.bind([profile.name]);

      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      // Convert strings to numbers
      setGlucoseData(
        rows.map((r) => ({
          ...r,
          glucoseRate: parseFloat(r.glucoseRate),
        }))
      );
    } catch (err) {
      console.error("Failed to load glucose data:", err);
    }
  }, [db, profile]);

  // 2) Handle form field changes
  const handleChange = (e) =>
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  // 3) Insert a new reading
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!db || !profile) return;

    const { date, time, glucoseRate, type } = formData;
    if (!date || !time || !glucoseRate) return;

    try {
      const stmt = db.prepare(
        `INSERT INTO Vitals
         (profileName, vitalName, type, value, unit, date, time)
         VALUES (?, 'Glucose', ?, ?, 'mg/dL', ?, ?)`
      );
      stmt.run([profile.name, type, glucoseRate.toString(), date, time]);
      stmt.free();

      saveDatabase();

      // Reload from DB (simplest) or append locally:
      setGlucoseData((d) => [
        ...d,
        { date, time, type, glucoseRate: Number(glucoseRate) },
      ]);

      setFormData({ date: "", time: "", glucoseRate: "", type: "Fasting" });
    } catch (err) {
      console.error("Failed to insert glucose reading:", err);
    }
  };

  // 4) Render
  return (
    <div className="container">
      <button
        className="back-button"
        onClick={() => navigate("/addvital", { state: { profile } })}
      >
        🔙 Back
      </button>

      <h2 className="title">Add Blood Glucose</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <label>Time</label>
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
        />

        <label>Glucose Rate (mg/dL)</label>
        <input
          type="number"
          name="glucoseRate"
          value={formData.glucoseRate}
          onChange={handleChange}
          required
        />

        <label>Type</label>
        <div className="radio-group">
          {["Fasting", "Non-Fasting"].map((t) => (
            <label key={t}>
              <input
                type="radio"
                name="type"
                value={t}
                checked={formData.type === t}
                onChange={handleChange}
              />
              {t === "Non-Fasting" ? "After Eating" : t}
            </label>
          ))}
        </div>

        <button type="submit" className="btn">
          Add
        </button>
      </form>

      <h2 className="title">Blood Glucose</h2>

      <div className="tab-group">
        {["Daily", "Weekly", "Monthly"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={view === v ? "tab active" : "tab"}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="radio-group">
        {["Fasting", "Non-Fasting"].map((t) => (
          <label key={t}>
            <input
              type="radio"
              name="selectedType"
              value={t}
              checked={selectedType === t}
              onChange={(e) => setSelectedType(e.target.value)}
            />
            {t === "Non-Fasting" ? "After Eating" : t}
          </label>
        ))}
      </div>

      <div className="chart-container">
        <h3>
          Selected:{" "}
          {selectedType === "Non-Fasting" ? "After Eating" : selectedType}
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={glucoseData.filter((d) => d.type === selectedType)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="glucoseRate"
              stroke="red"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Sugar;
