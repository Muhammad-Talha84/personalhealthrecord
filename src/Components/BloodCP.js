// import React, { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import "../CSS/BloodCp.css";

// const BloodCP = () => {
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db, saveDatabase } = useDatabase();

//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5);

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [rbc, setRbc] = useState("");
//   const [wbc, setWbc] = useState("");
//   const [platelets, setPlatelets] = useState("");
//   const [hb, setHb] = useState("");
//   const [hct, setHct] = useState("");
//   const [records, setRecords] = useState([]);

//   const testName = "BloodCP";

//   const loadData = () => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         `SELECT parameter, result, unit, referenceValue, date, time
//          FROM LabReports
//          WHERE profileName = ? AND testName = ?`
//       );
//       stmt.bind([profile.name, testName]);

//       const rows = [];
//       while (stmt.step()) {
//         rows.push(stmt.getAsObject());
//       }
//       stmt.free();
//       setRecords(rows);
//     } catch (error) {
//       console.error("Error loading Blood CP data:", error);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, [db, profile]);

//   // derive maxTime dynamically
//   const today = getToday();
//   const nowTime = getNowTime();
//   const maxTime = date === today ? nowTime : "23:59";
//   if (date === today && time > nowTime) {
//     setTime(nowTime);
//   }

//   const handleAdd = (e) => {
//     e.preventDefault();

//     // require all fields
//     if ([rbc, wbc, platelets, hb, hct].some((v) => v === "")) {
//       alert("Please fill in all fields.");
//       return;
//     }

//     const selected = new Date(`${date}T${time}`);
//     if (selected > new Date()) {
//       alert("Cannot record a future date/time");
//       return;
//     }

//     const parameters = [
//       {
//         parameter: "RBC",
//         value: rbc,
//         unit: "mil/mm3",
//         ref: "4.5-5.5",
//         min: 4.5,
//         max: 5.5,
//       },
//       {
//         parameter: "WBC",
//         value: wbc,
//         unit: "/mm3",
//         ref: "4,000 - 10,000",
//         min: 4000,
//         max: 10000,
//       },
//       {
//         parameter: "Platelets",
//         value: platelets,
//         unit: "/mm3",
//         ref: "150,000 - 410,000",
//         min: 150000,
//         max: 410000,
//       },
//       {
//         parameter: "HB",
//         value: hb,
//         unit: "g/dL",
//         ref: "13.0-17.0",
//         min: 13,
//         max: 17,
//       },
//       {
//         parameter: "HCT",
//         value: hct,
//         unit: "%",
//         ref: "40-50",
//         min: 40,
//         max: 50,
//       },
//     ];

//     try {
//       db.exec("BEGIN TRANSACTION;");
//       const stmt = db.prepare(
//         `INSERT INTO LabReports
//          (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
//       );

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
//       db.exec("COMMIT;");
//       saveDatabase();

//       // optimistic update
//       setRecords((prev) => [
//         ...prev,
//         ...parameters.map((p) => ({
//           parameter: p.parameter,
//           result: p.value,
//           unit: p.unit,
//           referenceValue: p.ref,
//           date,
//           time,
//         })),
//       ]);

//       // reset form
//       setDate(getToday());
//       setTime(getNowTime());
//       setRbc("");
//       setWbc("");
//       setPlatelets("");
//       setHb("");
//       setHct("");

//       alert("Blood CP Function Test saved successfully.");
//     } catch (error) {
//       console.error("Error inserting Blood CP record:", error);
//     }
//   };

//   return (
//     <div className="CPcontainer">
//       <h1>Blood CP</h1>
//       <form onSubmit={handleAdd}>
//         <label htmlFor="date">Date</label>
//         <input
//           id="date"
//           type="date"
//           value={date}
//           onChange={(e) => setDate(e.target.value)}
//           max={getToday()}
//         />

//         <label htmlFor="time">Time</label>
//         <input
//           id="time"
//           type="time"
//           value={time}
//           onChange={(e) => setTime(e.target.value)}
//           max={maxTime}
//         />

//         <label htmlFor="rbc">RBC</label>
//         <input
//           id="rbc"
//           type="number"
//           placeholder="4.5-5.5"
//           value={rbc}
//           onChange={(e) =>
//             setRbc(e.target.value === "" ? "" : parseFloat(e.target.value))
//           }
//         />

//         <label htmlFor="wbc">WBC</label>
//         <input
//           id="wbc"
//           type="number"
//           placeholder="4,000-10,000"
//           value={wbc}
//           onChange={(e) =>
//             setWbc(e.target.value === "" ? "" : parseFloat(e.target.value))
//           }
//         />

//         <label htmlFor="hb">Hemoglobin</label>
//         <input
//           id="hb"
//           type="number"
//           placeholder="13.0-17.0"
//           value={hb}
//           onChange={(e) =>
//             setHb(e.target.value === "" ? "" : parseFloat(e.target.value))
//           }
//         />

//         <label htmlFor="hct">Hematocrit</label>
//         <input
//           id="hct"
//           type="number"
//           placeholder="40-50"
//           value={hct}
//           onChange={(e) =>
//             setHct(e.target.value === "" ? "" : parseFloat(e.target.value))
//           }
//         />

//         <label htmlFor="platelets">Platelets</label>
//         <input
//           id="platelets"
//           type="number"
//           placeholder="150,000-410,000"
//           value={platelets}
//           onChange={(e) =>
//             setPlatelets(
//               e.target.value === "" ? "" : parseFloat(e.target.value)
//             )
//           }
//         />

//         <button type="submit" className="submit-button">
//           Add
//         </button>
//       </form>
//     </div>
//   );
// };

// export default BloodCP;

// 2 SHOW REPORTS IN FORM OF AGE AND GENDER
// src/screens/BloodCP.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/BloodCp.css";

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

// Helper: dynamic ranges per test parameter, gender & age sensitive
const getParamRange = (parameter, gender, age) => {
  switch (parameter) {
    case "RBC":
      // males slightly higher normal
      if (gender === "female") {
        return age < 18 ? { min: 4.2, max: 5.2 } : { min: 3.8, max: 5.0 };
      }
      return age < 18 ? { min: 4.5, max: 5.5 } : { min: 4.7, max: 6.1 };
    case "WBC":
      return { min: 4000, max: 11000 };
    case "Platelets":
      return { min: 150000, max: 450000 };
    case "HB":
      if (gender === "female") return { min: 12, max: 16 };
      return { min: 13.5, max: 17.5 };
    case "HCT":
      return gender === "female" ? { min: 36, max: 46 } : { min: 41, max: 53 };
    default:
      return { min: null, max: null };
  }
};

export default function BloodCP() {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db, saveDatabase } = useDatabase();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [rbc, setRbc] = useState("");
  const [wbc, setWbc] = useState("");
  const [platelets, setPlatelets] = useState("");
  const [hb, setHb] = useState("");
  const [hct, setHct] = useState("");
  const [records, setRecords] = useState([]);

  const testName = "BloodCP";

  const loadData = () => {
    if (!db || !profile) return;
    const stmt = db.prepare(
      `SELECT parameter, result, unit, referenceValue, minValue, maxValue, date, time
       FROM LabReports
       WHERE profileName = ? AND testName = ?
       ORDER BY date DESC, time DESC`
    );
    stmt.bind([profile.name, testName]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setRecords(rows);
  };

  useEffect(() => {
    loadData();
  }, [db, profile]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (![rbc, wbc, platelets, hb, hct].every((v) => v !== "")) {
      return alert("Please fill all fields.");
    }
    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) return alert("Cannot record future date/time");

    const age = getAge(profile.dob);
    const entries = [
      { parameter: "RBC", value: parseFloat(rbc), unit: "mil/mm3" },
      { parameter: "WBC", value: parseFloat(wbc), unit: "/mm3" },
      { parameter: "Platelets", value: parseFloat(platelets), unit: "/mm3" },
      { parameter: "HB", value: parseFloat(hb), unit: "g/dL" },
      { parameter: "HCT", value: parseFloat(hct), unit: "%" },
    ];

    // Validate and insert
    db.exec("BEGIN TRANSACTION;");
    const stmt = db.prepare(
      `INSERT INTO LabReports
         (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let e of entries) {
      const { min, max } = getParamRange(e.parameter, profile.gender, age);
      const refStr = `${min}-${max}`;
      if (e.value < min || e.value > max) {
        if (
          !window.confirm(
            `⚠️ ${e.parameter} value ${e.value} ${e.unit} outside normal for ${profile.gender}, age ${age}\n` +
              `(Normal: ${min}–${max} ${e.unit}). Continue?`
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

    setRecords((prev) => [
      ...entries.map((e) => ({
        parameter: e.parameter,
        result: e.value,
        unit: e.unit,
        referenceValue: `${
          getParamRange(e.parameter, profile.gender, age).min
        }-${getParamRange(e.parameter, profile.gender, age).max}`,
        minValue: getParamRange(e.parameter, profile.gender, age).min,
        maxValue: getParamRange(e.parameter, profile.gender, age).max,
        date,
        time,
      })),
      ...prev,
    ]);

    // reset
    setDate(getToday());
    setTime(getNowTime());
    setRbc("");
    setWbc("");
    setPlatelets("");
    setHb("");
    setHct("");
    alert("Blood CP saved successfully.");
  };

  if (!profile) return <p>Select a profile first.</p>;

  return (
    <div className="CPcontainer">
      <h2>
        Blood CP for {profile.name} ({profile.gender}, Age{" "}
        {getAge(profile.dob) ?? "--"})
      </h2>
      <form onSubmit={handleAdd} className="cp-form">
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={getToday()}
          required
        />
        <label>Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          max={getNowTime()}
          required
        />

        {["RBC", "WBC", "Platelets", "HB", "HCT"].map((param) => {
          const stateMap = {
            RBC: rbc,
            WBC: wbc,
            Platelets: platelets,
            HB: hb,
            HCT: hct,
          };
          const setterMap = {
            RBC: setRbc,
            WBC: setWbc,
            Platelets: setPlatelets,
            HB: setHb,
            HCT: setHct,
          };
          const placeholder = getParamRange(
            param,
            profile.gender,
            getAge(profile.dob)
          );
          return (
            <div key={param} className="input-group">
              <label>{param}</label>
              <input
                type="number"
                placeholder={`${placeholder.min}-${placeholder.max}`}
                value={stateMap[param]}
                onChange={(e) => setterMap[param](e.target.value)}
                required
              />
            </div>
          );
        })}
        <button type="submit" className="submit-button">
          Add Blood CP
        </button>
      </form>
    </div>
  );
}
