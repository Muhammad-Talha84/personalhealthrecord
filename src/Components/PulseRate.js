import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/PulseRate.css";
const PulseRate = () => {
  const location = useLocation();
  const { profile } = location.state || {}; // Get selected profile
  const { db, saveDatabase } = useDatabase();
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [pulse, setPulse] = useState("");
  const [dataRecords, setDataRecords] = useState([]);
  const loadData = () => {
    if (db && profile) {
      try {
        const query = db.prepare(
          "SELECT date,time,value FROM Vitals WHERE profileName=? AND vitalName='PulseRate'"
        );
        query.bind([profile.name]);
        const rows = [];
        while (query.step()) {
          rows.push(query.getAsObject());
        }
        query.free();
        setDataRecords(rows);
      } catch (error) {
        console.error("Error loading on pulse rate ", error);
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
    if (!date || !time || !pulse || !db || !profile) return;
    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      alert("can not add a future date/time ");
      return;
    }
    const pulseValue = parseFloat(pulse);
    if (isNaN(pulseValue) || pulseValue < 60 || pulseValue > 120) {
      alert(" pulse rate between 60 and 120 ");
      return;
    }
    try {
      const query = db.prepare(
        "INSERT INTO Vitals(profileName,vitalName,value,unit,date,time)VALUES(?,?,?,?,?,?)"
      );
      query.run([profile.name, "PulseRate", pulseValue, "bpm", date, time]);
      query.free();
      saveDatabase();
      loadData();
      setDate(getToday());
      setTime(getNowTime());
      setPulse("");
    } catch (error) {
      console.error("Error inserting on pulse rate", error);
    }
  };

  return (
    <div className="pulse-container">
      <div className="pulse-card">
        <h2>Pulse Rate</h2>
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
            <label>BPM:</label>
            <input
              type="number"
              value={pulse}
              placeholder="Enter pulse rate in beats per minute"
              onChange={(e) => setPulse(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Pulse Rate
          </button>
        </form>
      </div>
    </div>
  );
};

export default PulseRate;
