// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";

// const HeartRate = () => {
//   const location = useLocation();
//   const { profile } = location.state || {}; // Get selected profile
//   const { db, saveDatabase } = useDatabase();
//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5);
//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());
//   const [bpm, setBpm] = useState("");
//   const [dataRecords, setDataRecords] = useState([]);

//   // load existing heart rate records (including min/max)
//   const loadData = () => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         `SELECT id, date, time, value, unit, minValue, maxValue
//        FROM Vitals
//        WHERE profileName = ?
//          AND vitalName   = 'HeartRate'
//        ORDER BY date DESC, time DESC`
//       );
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       setDataRecords(rows);
//     } catch (err) {
//       console.error("Error loading heart rate data:", err);
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
//     if (!date || !time || !bpm || !db || !profile) return;

//     const ts = new Date(`${date}T${time}`);
//     if (ts > new Date()) {
//       alert("Cannot record a future date/time");
//       return;
//     }

//     const bpmVal = parseFloat(bpm);
//     const minVal = 40;
//     const maxVal = 100;

//     if (isNaN(bpmVal)) {
//       alert("Please enter a valid number for BPM.");
//       return;
//     }

//     // warn but still save if out of normal range
//     if (bpmVal < minVal || bpmVal > maxVal) {
//       const ok = window.confirm(
//         `⚠️ ${bpmVal} bpm is outside the normal range (${minVal}–${maxVal} bpm).\n\nSave anyway?`
//       );
//       if (!ok) return;
//     }

//     try {
//       const stmt = db.prepare(
//         `INSERT INTO Vitals
//          (profileName, vitalName, type, value, unit, date, time, minValue, maxValue)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
//       );
//       stmt.run([
//         profile.name,
//         "HeartRate",
//         "heart-rate",
//         bpmVal,
//         "bpm",
//         date,
//         time,
//         minVal,
//         maxVal,
//       ]);
//       stmt.free();
//       saveDatabase();
//       loadData();
//       setBpm("");
//       setDate(getToday());
//       setTime(getNowTime());
//     } catch (err) {
//       console.error("Error inserting heart rate record:", err);
//     }
//   };

//   return (
//     <div className="heart-container">
//       <div className="heart-card">
//         <h2>Record Heart Rate</h2>
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
//             <label>BPM:</label>
//             <input
//               type="number"
//               value={bpm}
//               placeholder="Enter BPM"
//               onChange={(e) => setBpm(e.target.value)}
//               required
//             />
//           </div>
//           <button type="submit" className="submit-button">
//             Add Heart Rate
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default HeartRate;

// ACCORDING TO GENDER AND AGE frontend pa handle
// import React, { useState, useEffect } from "react";

// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";

// // Helper: calculate age in years from DOB
// const getAge = (dob) => {
//   if (!dob) return null;
//   const today = new Date();
//   const [y, m, d] = dob.split("-").map(Number);
//   const birth = new Date(y, m - 1, d);
//   let age = today.getFullYear() - birth.getFullYear();
//   const mDiff = today.getMonth() - birth.getMonth();
//   if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
//   return age;
// };

// // Helper: gender & age specific heart rate ranges
// const getHrRange = (gender, age) => {
//   if (age < 1) return { minVal: 100, maxVal: 160 };
//   if (age < 10) return { minVal: 70, maxVal: 120 };
//   if (age < 18) return { minVal: 60, maxVal: 100 };
//   // adult
//   return { minVal: 60, maxVal: gender === "female" ? 100 : 95 };
// };

// export default function HeartRate() {
//   const { state } = useLocation();
//   const profile = state?.profile;
//   const { db, saveDatabase } = useDatabase();

//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5);

//   const [records, setRecords] = useState([]);
//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());
//   const [bpm, setBpm] = useState("");

//   const loadData = () => {
//     if (!db || !profile) return;
//     const age = getAge(profile.dob);
//     const range = getHrRange(profile.gender, age);
//     const stmt = db.prepare(
//       `SELECT id, date, time, value, unit, minValue, maxValue
//        FROM Vitals
//        WHERE profileName = ? AND vitalName = 'HeartRate'
//        ORDER BY date DESC, time DESC`
//     );
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setRecords(rows.map((r) => ({ ...r, defaultRange: range })));
//   };

//   useEffect(() => {
//     if (db && profile) loadData();
//   }, [db, profile]);
//   useEffect(() => {
//     const today = getToday(),
//       now = getNowTime();
//     if (date === today) {
//       setMaxTime(now);
//       if (time > now) setTime(now);
//     } else setMaxTime("23:59");
//   }, [date, time]);

//   const handleAdd = (e) => {
//     e.preventDefault();
//     if (!profile || !db) return;
//     const ts = new Date(`${date}T${time}`);
//     if (ts > new Date()) return alert("Cannot record a future date/time");
//     const val = parseFloat(bpm);
//     if (isNaN(val)) return alert("Enter valid BPM");
//     const age = getAge(profile.dob);
//     const { minVal, maxVal } = getHrRange(profile.gender, age);
//     if (val < minVal || val > maxVal) {
//       if (
//         !window.confirm(
//           `⚠️ ${val} bpm outside normal (${minVal}–${maxVal}). Save anyway?`
//         )
//       )
//         return;
//     }
//     const stmt = db.prepare(
//       `INSERT INTO Vitals(profileName,vitalName,value,unit,date,time,minValue,maxValue) VALUES(?,?,?,?,?,?,?,?)`
//     );
//     stmt.run([
//       profile.name,
//       "HeartRate",
//       val,
//       "bpm",
//       date,
//       time,
//       minVal,
//       maxVal,
//     ]);
//     stmt.free();
//     saveDatabase();
//     loadData();
//     setBpm("");
//     setDate(getToday());
//     setTime(getNowTime());
//   };

//   if (!profile)
//     return (
//       <div className="heart-container">
//         <p>No profile selected.</p>
//       </div>
//     );

//   return (
//     <div className="heart-container">
//       <div className="heart-card">
//         <h2>
//           Record Heart Rate ({profile.gender}, Age {getAge(profile.dob) || "--"}
//           )
//         </h2>
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
//             <label>BPM:</label>
//             <input
//               type="number"
//               placeholder="Enter BPM"
//               value={bpm}
//               onChange={(e) => setBpm(e.target.value)}
//               required
//             />
//           </div>
//           <button type="submit">Add Heart Rate</button>
//         </form>
//       </div>
//     </div>
//   );
// }

// ******************************************************get values from backend min and max
import React, { useState, useEffect } from "react";

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
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// Helper: gender & age specific heart rate ranges
// const getHrRange = (gender, age) => {
//   if (age < 1) return { minVal: 100, maxVal: 160 };
//   if (age < 10) return { minVal: 70, maxVal: 120 };
//   if (age < 18) return { minVal: 60, maxVal: 100 };
//   // adult
//   return { minVal: 60, maxVal: gender === "female" ? 100 : 95 };
// };

export default function HeartRate() {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db, saveDatabase } = useDatabase();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);
  const [settings, setSettings] = useState([]);
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());
  const [bpm, setBpm] = useState("");
  const [note, setNote] = useState("");

  //load heart rate data from backend DB
  // useEffect(() => {
  //   if (!db) return;
  //   const stmt = db.prepare(`
  //     SELECT * FROM Settings
  //     WHERE vitalName IN ("HeartRate")
  //   `);
  //   let loaded = [];
  //   while (stmt.step()) {
  //     const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
  //     loaded.push({ vitalName, gender, minValue, maxValue });
  //   }
  //   stmt.free();
  //   setSettings(loaded);
  // }, [db]);
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare(`
      SELECT * FROM Settings 
      WHERE vitalName LIKE 'HeartRate%'
    `);
    let loaded = [];
    while (stmt.step()) {
      const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
      loaded.push({ vitalName, gender, minValue, maxValue });
    }
    stmt.free();
    setSettings(loaded);
  }, [db]);
  const loadData = () => {
    if (!db || !profile) return;
    const age = getAge(profile.dob);
    // const range = getHrRange(profile.gender, age);
    const stmt = db.prepare(
      `SELECT id, date, time, value, unit, minValue, maxValue,vitalNote
       FROM Vitals
       WHERE profileName = ? AND vitalName = 'HeartRate'
       ORDER BY date DESC, time DESC`
    );
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setRecords(
      rows.map((r) => ({
        ...r,
        defaultRange: verifyHRField("HeartRate", profile.gender),
      }))
    );
  };

  useEffect(() => {
    if (db && profile) loadData();
  }, [db, profile]);
  useEffect(() => {
    const today = getToday(),
      now = getNowTime();
    if (date === today) {
      setMaxTime(now);
      if (time > now) setTime(now);
    } else setMaxTime("23:59");
  }, [date, time]);
  const verifyHRField = (vitalName, gender) => {
    let vital = "";
    if (vitalName === "HeartRate") vital = "HeartRate";

    let tempGender = gender.toLowerCase(); // "male" or "female"
    const row = settings.find(
      (s) => s.vitalName === vital && s.gender === tempGender
    );

    if (!row) return { min: 0, max: 0 };
    return { min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
  };
  const handleAdd = (e) => {
    e.preventDefault();
    if (!profile || !db) return;
    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) return alert("Cannot record a future date/time");
    const val = parseFloat(bpm);
    if (isNaN(val)) return alert("Enter valid BPM");
    const age = getAge(profile.dob);
    const hrRange = verifyHRField("HeartRate", profile.gender);
    if (val < hrRange.min || val > hrRange.max) {
      if (
        !window.confirm(
          `⚠️ ${val} bpm outside normal (${hrRange.min}–${hrRange.max}). Save anyway?`
        )
      )
        return;
    }
    const stmt = db.prepare(
      `INSERT INTO Vitals(profileName,vitalName,value,unit,date,time,minValue,maxValue,vitalNote) VALUES(?,?,?,?,?,?,?,?,?)`
    );
    stmt.run([
      profile.name,
      "HeartRate",
      val,
      "bpm",
      date,
      time,
      hrRange.min,
      hrRange.max,
      note,
    ]);
    stmt.free();
    saveDatabase();
    loadData();
    setBpm("");
    setNote("");
    setDate(getToday());
    setTime(getNowTime());
  };

  if (!profile)
    return (
      <div className="heart-container">
        <p>No profile selected.</p>
      </div>
    );
  if (settings.length === 0) return <div>Loading Heart settings...</div>;
  return (
    <div className="heart-container">
      <div className="heart-card">
        <h2>
          Heart Rate
          {/* Record Heart Rate ({profile.gender}, Age {getAge(profile.dob) || "--"}
          ) */}
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
            <label>BPM:</label>
            <input
              type="number"
              placeholder="Enter BPM"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Note:</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>
          <button type="submit">Add Heart Rate</button>
        </form>
      </div>
    </div>
  );
}
