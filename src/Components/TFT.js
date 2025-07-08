// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import "../CSS/TFT.css";

// const TFT = () => {
//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5);

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());
//   const [t3, setT3] = useState("");
//   const [t4, setT4] = useState("");
//   const [tsh, setTSH] = useState("");
//   const [dataRecords, setDataRecords] = useState([]);
//   const location = useLocation();
//   const { profile } = location.state || {}; // selected profile from state
//   const { db, saveDatabase } = useDatabase();

//   const testName = "TFT";

//   const loadData = () => {
//     if (db && profile) {
//       try {
//         const stmt = db.prepare(`
//           SELECT parameter, result, unit, referenceValue, date, time
//           FROM LabReports
//           WHERE profileName = ? AND testName = ?
//         `);
//         stmt.bind([profile.name, testName]);

//         const records = [];
//         while (stmt.step()) {
//           records.push(stmt.getAsObject());
//         }
//         stmt.free();
//         setDataRecords(records);
//       } catch (error) {
//         console.error("Error loading TFT data:", error);
//       }
//     }
//   };

//   useEffect(() => {
//     if (db && profile) {
//       loadData();
//     }
//   }, [db, profile]);
//   useEffect(() => {
//     const today = getToday();
//     const nowTime = getNowTime();
//     if (date === today) {
//       setMaxTime(nowTime);
//       if (time > nowTime) setTime(nowTime);
//     } else {
//       setMaxTime("23:59");
//     }
//   }, [date, time]);
//   const handleAdd = (e) => {
//     e.preventDefault();
//     if (!date || !time || !t3 || !t4 || !tsh || !db || !profile) return;
//     const selected = new Date(`${date}T${time}`);
//     const now = new Date();
//     if (selected > now) {
//       alert("Cannot record a future date/time");
//       return;
//     }
//     const parameters = [
//       {
//         parameter: "T3",
//         value: t3,
//         unit: "ng/mL",
//         ref: "0.6-1.6",
//         min: 0.6,
//         max: 1.6,
//       },
//       {
//         parameter: "T4",
//         value: t4,
//         unit: "μg/dL",
//         ref: "4.5-10.9",
//         min: 4.5,
//         max: 10.9,
//       },
//       {
//         parameter: "TSH",
//         value: tsh,
//         unit: "μIU/mL",
//         ref: "0.4-4.5",
//         min: 0.4,
//         max: 4.5,
//       },
//     ];

//     try {
//       const stmt = db.prepare(`
//         INSERT INTO LabReports (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `);

//       parameters.forEach((p) => {
//         stmt.run([
//           profile.name,
//           testName,
//           p.parameter,
//           p.value,
//           p.unit,
//           p.ref,
//           date,
//           time,
//           p.min,
//           p.max,
//         ]);
//       });

//       stmt.free();
//       saveDatabase();
//       loadData();

//       // Clear form
//       setDate(getToday());
//       setTime(getNowTime());
//       setT3("");
//       setT4("");
//       setTSH("");
//       alert("Thyroid Function Test saved successfully.");
//     } catch (error) {
//       console.error("Error inserting TFT record:", error);
//     }
//   };

//   return (
//     <div className="tftContainer">
//       <div className="tft-card">
//         <h2>Record Thyroid Function Test</h2>
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
//             <label>T3 (ng/mL):</label>
//             <input
//               type="number"
//               value={t3}
//               onChange={(e) => setT3(e.target.value)}
//               placeholder="0.6-1.6"
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>T4 (μg/dL):</label>
//             <input
//               type="number"
//               value={t4}
//               onChange={(e) => setT4(e.target.value)}
//               placeholder="4.5-10.9"
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>TSH (μIU/mL):</label>
//             <input
//               type="number"
//               value={tsh}
//               onChange={(e) => setTSH(e.target.value)}
//               placeholder="0.4-4.5"
//               required
//             />
//           </div>
//           <button type="submit" className="submit-button">
//             Add TFT Record
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default TFT;

// 2 ACCORDING TO AGE AND GENDER
// src/screens/TFT.js with gender/age-aware ranges
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/TFT.css";

const getToday = () => new Date().toISOString().split("T")[0];
const getNowTime = () => new Date().toTimeString().slice(0, 5);

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

const getParamRange = (param) => {
  switch (param) {
    case "T3":
      return { min: 0.6, max: 1.6 };
    case "T4":
      return { min: 4.5, max: 10.9 };
    case "TSH":
      return { min: 0.4, max: 4.5 };
    default:
      return { min: 0, max: 0 };
  }
};

export default function TFT() {
  const location = useLocation();
  const { profile } = location.state || {};
  const { db, saveDatabase } = useDatabase();
  const testName = "TFT";

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());

  const [t3, setT3] = useState("");
  const [t4, setT4] = useState("");
  const [tsh, setTSH] = useState("");
  const [records, setRecords] = useState([]);

  const loadData = () => {
    if (!db || !profile) return;
    const stmt = db.prepare(
      `SELECT parameter, result, unit, referenceValue, minValue, maxValue, date, time FROM LabReports WHERE profileName = ? AND testName = ?`
    );
    stmt.bind([profile.name, testName]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setRecords(rows);
  };

  useEffect(() => {
    if (db && profile) loadData();
  }, [db, profile]);

  useEffect(() => {
    const today = getToday();
    const now = getNowTime();
    if (date === today) {
      setMaxTime(now);
      if (time > now) setTime(now);
    } else setMaxTime("23:59");
  }, [date, time]);

  const handleAdd = (e) => {
    e.preventDefault();
    const inputs = [t3, t4, tsh];
    if (inputs.some((v) => v === "")) return alert("Please fill all fields.");
    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) return alert("Cannot record future date/time");

    const age = getAge(profile.dob);
    const entries = [
      { parameter: "T3", value: parseFloat(t3), unit: "ng/mL" },
      { parameter: "T4", value: parseFloat(t4), unit: "μg/dL" },
      { parameter: "TSH", value: parseFloat(tsh), unit: "μIU/mL" },
    ];

    db.exec("BEGIN TRANSACTION;");
    const stmt = db.prepare(
      `INSERT INTO LabReports
        (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let e of entries) {
      const { min, max } = getParamRange(e.parameter);
      const refStr = `${min}-${max}`;
      if (e.value < min || e.value > max) {
        if (
          !window.confirm(
            `⚠️ ${e.parameter} = ${e.value} is out of range (normal: ${min}–${max}). Continue?`
          )
        ) {
          db.exec("ROLLBACK;");
          return;
        }
      }
      stmt.run([
        profile.name,
        testName,
        e.parameter,
        e.value,
        e.unit,
        refStr,
        date,
        time,
        min,
        max,
      ]);
    }
    stmt.free();
    db.exec("COMMIT;");
    saveDatabase();
    loadData();

    setT3("");
    setT4("");
    setTSH("");
    setDate(getToday());
    setTime(getNowTime());
    alert("TFT saved successfully.");
  };

  if (!profile) return <p>Select a profile first.</p>;

  return (
    <div className="tftContainer">
      <div className="tft-card">
        <h2>
          TFT for {profile.name} ({profile.gender}, Age{" "}
          {getAge(profile.dob) ?? "--"})
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
          {["T3", "T4", "TSH"].map((param) => {
            const valMap = { T3: t3, T4: t4, TSH: tsh };
            const setMap = { T3: setT3, T4: setT4, TSH: setTSH };
            const range = getParamRange(param);
            return (
              <div className="input-group" key={param}>
                <label>{param}:</label>
                <input
                  type="number"
                  value={valMap[param]}
                  onChange={(e) => setMap[param](e.target.value)}
                  placeholder={`${range.min}-${range.max}`}
                  required
                />
              </div>
            );
          })}
          <button type="submit" className="submit-button">
            Add TFT Record
          </button>
        </form>
      </div>
    </div>
  );
}
