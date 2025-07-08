// import React, { useState, useEffect } from "react";
// import "../CSS/Temperature.css";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";

// const Temperature = () => {
//   const { state } = useLocation();
//   const profile = state?.profile;
//   const { db, saveDatabase } = useDatabase();

//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5);

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());
//   const [temperature, setTemperature] = useState("");
//   const [unit, setUnit] = useState("°F"); // default unit

//   // reload the list after each insert
//   const loadData = () => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         `SELECT date, time, value, unit, minValue, maxValue
//          FROM Vitals
//          WHERE profileName = ?
//            AND vitalName   = 'Temperature'
//          ORDER BY date DESC, time DESC`
//       );
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       // you can still use setDataRecords(rows) if you show them below
//       console.log("Temperature records:", rows);
//     } catch (err) {
//       console.error("Error loading temperature data:", err);
//     }
//   };

//   useEffect(() => {
//     if (db && profile) loadData();
//   }, [db, profile]);

//   useEffect(() => {
//     const today = getToday();
//     const now = getNowTime();
//     if (date === today) {
//       setMaxTime(now);
//       if (time > now) setTime(now);
//     } else {
//       setMaxTime("23:59");
//     }
//   }, [date, time]);

//   const handleAdd = (e) => {
//     e.preventDefault();
//     if (!date || !time || !temperature || !db || !profile) return;

//     const selected = new Date(`${date}T${time}`);
//     if (selected > new Date()) {
//       alert("Cannot record a future date/time");
//       return;
//     }

//     // define normal range
//     const [minVal, maxVal] = unit === "°F" ? [98, 100] : [36, 39];

//     const tempVal = parseFloat(temperature);
//     if (isNaN(tempVal)) {
//       alert("Please enter a valid number for temperature.");
//       return;
//     }

//     // ⚠️ warn but still save if outside range
//     if (tempVal < minVal || tempVal > maxVal) {
//       const ok = window.confirm(
//         `⚠️ ${tempVal}${unit} is outside the normal range ` +
//           `(${minVal}–${maxVal}${unit}).\n\nSave anyway?`
//       );
//       if (!ok) return;
//     }

//     try {
//       const stmt = db.prepare(
//         `INSERT INTO Vitals
//            (profileName, vitalName, type, value, unit, date, time, minValue, maxValue)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
//       );
//       stmt.run([
//         profile.name,
//         "Temperature",
//         "temperature",
//         tempVal,
//         unit,
//         date,
//         time,
//         minVal,
//         maxVal,
//       ]);
//       stmt.free();
//       saveDatabase();
//       loadData();
//       setTemperature("");
//       setDate(getToday());
//       setTime(getNowTime());
//     } catch (err) {
//       console.error("Error inserting temperature record:", err);
//     }
//   };

//   return (
//     <div className="temp-container">
//       <div className="temp-card">
//         <h2>Record Temperature</h2>
//         <form onSubmit={handleAdd}>
//           <div className="input-group">
//             <label>Date:</label>
//             <input
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               max={getToday()}
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>Time:</label>
//             <input
//               type="time"
//               value={time}
//               onChange={(e) => setTime(e.target.value)}
//               max={maxTime}
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>Unit:</label>
//             <select value={unit} onChange={(e) => setUnit(e.target.value)}>
//               <option value="°F">°F</option>
//               <option value="°C">°C</option>
//             </select>
//           </div>
//           <div className="input-group">
//             <label>Temperature ({unit}):</label>
//             <input
//               type="number"
//               value={temperature}
//               placeholder={`Enter temperature in ${unit}`}
//               onChange={(e) => setTemperature(e.target.value)}
//               step="0.1"
//               required
//             />
//           </div>
//           <button type="submit" className="submit-button">
//             Add Temperature
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Temperature;

// 2 TEMPERATURE ACCORDING TO GENDER AGE
// src/screens/Temperature.js
import React, { useState, useEffect } from "react";
import "../CSS/Temperature.css";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

// Helper: calculate age in years from DOB
const getAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const [y, m, d] = dob.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Helper: gender & age specific temperature ranges
const getTempRange = (gender, age, unit) => {
  if (unit === "°F") {
    if (age < 18) return { minVal: 97, maxVal: 99 };
    return { minVal: 98, maxVal: 100 };
  }
  // Celsius
  if (age < 18) return { minVal: 36.1, maxVal: 37.2 };
  return { minVal: 36.5, maxVal: 37.5 };
};

export default function Temperature() {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db, saveDatabase } = useDatabase();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [temperature, setTemperature] = useState("");
  const [unit, setUnit] = useState("°F");

  // Load existing temperature records
  const loadData = () => {
    if (!db || !profile) return;
    const age = getAge(profile.dob);
    const range = getTempRange(profile.gender, age, unit);

    const stmt = db.prepare(
      `SELECT id, date, time, value, unit, minValue, maxValue
       FROM Vitals
       WHERE profileName = ?
         AND vitalName   = 'Temperature'
       ORDER BY date DESC, time DESC`
    );
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    setRecords(rows.map((r) => ({ ...r, defaultRange: range })));
  };

  useEffect(() => {
    if (db && profile) loadData();
  }, [db, profile, unit]);

  // Prevent future times
  useEffect(() => {
    const today = getToday();
    const now = getNowTime();
    if (date === today) {
      setMaxTime(now);
      if (time > now) setTime(now);
    } else {
      setMaxTime("23:59");
    }
  }, [date, time]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!profile || !db || !temperature) return;

    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) {
      return alert("Cannot record a future date/time");
    }

    const tempVal = parseFloat(temperature);
    if (isNaN(tempVal)) {
      return alert("Please enter a valid number for temperature.");
    }

    const age = getAge(profile.dob);
    const { minVal, maxVal } = getTempRange(profile.gender, age, unit);

    if (tempVal < minVal || tempVal > maxVal) {
      const ok = window.confirm(
        `⚠️ ${tempVal}${unit} outside normal for ${profile.gender}, age ${age}\n` +
          `(Normal: ${minVal}–${maxVal}${unit}).\nSave anyway?`
      );
      if (!ok) return;
    }

    const stmt = db.prepare(
      `INSERT INTO Vitals
         (profileName, vitalName, value, unit, date, time, minValue, maxValue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run([
      profile.name,
      "Temperature",
      tempVal,
      unit,
      date,
      time,
      minVal,
      maxVal,
    ]);
    stmt.free();
    saveDatabase();
    loadData();

    setTemperature("");
    setDate(getToday());
    setTime(getNowTime());
  };

  if (!profile) {
    return (
      <div className="temp-container">
        <p>No profile selected.</p>
      </div>
    );
  }

  return (
    <div className="temp-container">
      <div className="temp-card">
        <h2>
          Record Temperature ({profile.gender}, Age{" "}
          {getAge(profile.dob) ?? "--"}, {unit})
        </h2>
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
            <label>Unit:</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="°F">°F</option>
              <option value="°C">°C</option>
            </select>
          </div>
          <div className="input-group">
            <label>Temperature ({unit}):</label>
            <input
              type="number"
              placeholder={`Enter in ${unit}`}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              step="0.1"
              required
            />
          </div>
          <button type="submit">Add Temperature</button>
        </form>
      </div>
    </div>
  );
}
