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
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const Sugar = () => {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db, saveDatabase } = useDatabase();

  // Prepare date defaults
  const todayDefault = new Date().toISOString().split("T")[0];
  const timeDefault = new Date().toTimeString().slice(0, 5);

  // Form state
  const [formData, setFormData] = useState({
    date: todayDefault,
    time: timeDefault,
    glucoseRate: "",
    type: "Fasting",
  });

  // View & filter state
  const [view, setView] = useState("All");
  const [selectedType, setSelectedType] = useState("Fasting");
  const [customStartDate, setCustomStartDate] = useState(todayDefault);
  const [customEndDate, setCustomEndDate] = useState(todayDefault);

  // Data state (filtered)
  const [filteredData, setFilteredData] = useState([]);

  // Handle form inputs
  const handleChange = (e) =>
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Insert new reading
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

      // Reset form
      setFormData({
        date: todayDefault,
        time: timeDefault,
        glucoseRate: "",
        type: "Fasting",
      });
    } catch (err) {
      console.error("Failed to insert glucose reading:", err);
    }
  };

  // Fetch & filter data by view, type, and date range via SQL.js
  useEffect(() => {
    if (!db || !profile) return;

    // Compute date range
    const today = new Date();
    const endStr = today.toISOString().split("T")[0];
    let startStr;

    switch (view) {
      case "Daily":
        startStr = endStr;
        break;
      case "Weekly":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        startStr = weekAgo.toISOString().split("T")[0];
        break;
      case "Monthly":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startStr = monthAgo.toISOString().split("T")[0];
        break;
      case "Custom":
        startStr = customStartDate;
        break;
      case "All":
      default:
        startStr = "0000-01-01"; // earliest possible
        break;
    }

    const query = `
      SELECT date, time, value AS glucoseRate, type
      FROM Vitals
      WHERE profileName = ?
        AND vitalName = 'Glucose'
        AND type = ?
        AND date BETWEEN ? AND ?
      ORDER BY date, time
    `;

    const stmt = db.prepare(query);
    stmt.bind([profile.name, selectedType, startStr, endStr]);

    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    setFilteredData(
      rows.map((r) => ({ ...r, glucoseRate: parseFloat(r.glucoseRate) }))
    );
  }, [db, profile, view, selectedType, customStartDate, customEndDate]);

  return (
    <div className="container">
      <h2 className="title">Add Blood Glucose</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          max={todayDefault}
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
          {["Fasting", "Regular"].map((t) => (
            <label key={t}>
              <input
                type="radio"
                name="type"
                value={t}
                checked={formData.type === t}
                onChange={handleChange}
              />
              {t}
            </label>
          ))}
        </div>

        <button type="submit" className="btn">
          Add
        </button>
      </form>

      <h2 className="title">Blood Glucose</h2>

      <div className="tab-group">
        {["All", "Daily", "Weekly", "Monthly", "Custom"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={view === v ? "tab active" : "tab"}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Custom range inputs */}
      {view === "Custom" && (
        <div className="custom-range">
          <label>Start Date</label>
          <input
            type="date"
            value={customStartDate}
            max={todayDefault}
            onChange={(e) => setCustomStartDate(e.target.value)}
          />
          <label>End Date</label>
          <input
            type="date"
            value={customEndDate}
            max={todayDefault}
            onChange={(e) => setCustomEndDate(e.target.value)}
          />
        </div>
      )}

      <div className="radio-group">
        {["Fasting", "Regular"].map((t) => (
          <label key={t}>
            <input
              type="radio"
              name="selectedType"
              value={t}
              checked={selectedType === t}
              onChange={(e) => setSelectedType(e.target.value)}
            />
            {t}
          </label>
        ))}
      </div>

      <div className="chart-container">
        <h3>
          {view} ({selectedType})
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="glucoseRate"
              stroke="#8884d8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Sugar;
