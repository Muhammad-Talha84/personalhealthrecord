import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/Electrolyte.css";
const Electrolytes = () => {
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5); // HH:mm

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [sodium, setSodium] = useState("");
  const [potassium, setPotassium] = useState("");
  const [chloride, setChloride] = useState("");
  const [bicarbonate, setBicarbonate] = useState("");
  const [aniongap, setAniongap] = useState("");
  const [dataRecords, setDataRecords] = useState([]);
  const location = useLocation();
  const { profile } = location.state || {};
  const { db, saveDatabase } = useDatabase();
  const testName = "Electrolytes";
  const loadData = () => {
    if (db && profile) {
      try {
        const query = db.prepare(
          `SELECT parameter,result,unit,referenceValue,date,time FROM LabReports WHERE profileName=? AND testName=?`
        );
        query.bind([profile.name, testName]);
        const records = [];
        while (query.step()) {
          records.push(query.getAsObject());
        }
        query.free();
        setDataRecords(records);
      } catch (error) {
        console.error("ERROR LOADING ELECTROLYTES DATA", error);
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
      !sodium ||
      !potassium ||
      !bicarbonate ||
      !chloride ||
      !aniongap
    )
      return;
    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      alert("Please select a valid date and time");
      return;
    }
    const parameters = [
      {
        parameter: "Sodium",
        value: sodium,
        unit: "mmol/L",
        ref: "136-145",
        min: 136,
        max: 145,
      },
      {
        parameter: "Potassium",
        value: potassium,
        unit: "mmol/L",
        ref: "3.5-5.3",
        min: 3.5,
        max: 5.3,
      },
      {
        parameter: "Bicarbonate",
        value: bicarbonate,
        unit: "mmol/L",
        ref: "22-29",
        min: 22,
        max: 29,
      },
      {
        parameter: "Chloride",
        value: chloride,
        unit: "mmol/L",
        ref: "90-110",
        min: 90,
        max: 110,
      },
      {
        parameter: "Anion Gap",
        value: aniongap,
        unit: "mmol/L",
        ref: "8-16",
        min: 8,
        max: 16,
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
      setChloride("");
      setAniongap("");
      setBicarbonate("");
      setSodium("");
      setPotassium("");

      alert("ELECTROLYTE saved successfully.");
    } catch (error) {
      console.error("Error inserting ELECTROLYTE record:", error);
    }
  };
  return (
    <div className="electrolyteContainer">
      <div className="electrolyte-card">
        <h2> ELECTROLYTE TEST RECORD</h2>
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
            <label>Sodium</label>
            <input
              type="number"
              value={sodium}
              onChange={(e) => setSodium(e.target.value)}
              placeholder="136-145"
              required
            />
          </div>
          <div className="input-group">
            <label>Potassium:</label>
            <input
              type="number"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              placeholder="3.5-5.3"
              required
            />
          </div>
          <div className="input-group">
            <label>Chloride:</label>
            <input
              type="number"
              value={chloride}
              onChange={(e) => setChloride(e.target.value)}
              placeholder="90-110"
              required
            />
          </div>
          <div className="input-group">
            <label>Bicarbonate:</label>
            <input
              type="number"
              value={bicarbonate}
              onChange={(e) => setBicarbonate(e.target.value)}
              placeholder="22-29"
              required
            />
          </div>
          <div className="input-group">
            <label>Anion Gap:</label>
            <input
              type="number"
              value={aniongap}
              onChange={(e) => setAniongap(e.target.value)}
              placeholder="8-16"
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Electrolyte Record
          </button>
        </form>
      </div>
    </div>
  );
};

export default Electrolytes;
