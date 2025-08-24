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

// 2 SHOW REPORTS IN FORM OF AGE AND GENDER handle on frontend
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
// Local date & time helpers
const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNowTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [rbc, setRbc] = useState("");
  const [wbc, setWbc] = useState("");
  const [platelets, setPlatelets] = useState("");
  const [hb, setHb] = useState("");
  const [hct, setHct] = useState("");
  const [note, setNote] = useState("");
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState([]);
  const testName = "BloodCP";

  const loadData = () => {
    if (!db || !profile) return;
    const stmt = db.prepare(
      `SELECT parameter, result, unit, referenceValue, minValue, maxValue, date, time,labNote
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

  // useEffect(() => {
  //   if (!db) return;
  //   const stmt = db.prepare(
  //     `SELECT * FROM Settings WHERE vitalName IN (
  //       "Blood Cp-Haemoglobin(g/dL)",
  //       "Blood Cp-RBC(mil/mm3)",
  //       "Blood Cp-WBC(/mm3)",
  //       "Blood Cp-Plateletts(/mm3)",
  //       "Blood Cp-HCT(%)"
  //     )`
  //   );
  //   let loaded = [];
  //   while (stmt.step()) {
  //     const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
  //     loaded.push({ vitalName, gender, minValue, maxValue });
  //   }
  //   stmt.free();
  //   //console.log(loaded);
  //   setSettings(loaded);
  // }, [db]);

  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare(
      `SELECT * FROM Settings WHERE vitalName LIKE'Blood Cp-%'`
    );
    let loaded = [];
    while (stmt.step()) {
      const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
      loaded.push({ vitalName, gender, minValue, maxValue });
    }
    stmt.free();
    //console.log(loaded);
    setSettings(loaded);
  }, [db]);
  const verifytestfield = (vitalName, gender, age) => {
    console.log(vitalName, gender);
    let vital = "";
    if (vitalName == "RBC") vital = "Blood Cp-RBC(mil/mm3)";
    else if (vitalName == "WBC") vital = "Blood Cp-WBC(/mm3)";
    else if (vitalName == "Platelets") vital = "Blood Cp-Plateletts(/mm3)";
    else if (vitalName == "HB") vital = "Blood Cp-Haemoglobin(g/dL)";
    else if (vitalName == "HCT") vital = "Blood Cp-HCT(%)";
    // Normalize incoming gender (case insensitive)
    let tempGender = "";
    if (typeof gender === "string") {
      const g = gender.toLowerCase();
      if (g === "male") tempGender = "male";
      else if (g === "female") tempGender = "female";
      else tempGender = g; // keep whatever it is (e.g. 'other')
    }

    // find row (vital names in settings were normalized when loaded)
    const row = settings.find(
      (s) => s.vitalName === vital && s.gender === tempGender
    );

    if (!row) {
      console.warn("No settings row found for", { vital, tempGender });
      // Provide a safe default instead of crashing — adjust defaults as you like
      return { min: 0, max: 0 };
    }
    return { min: row.minValue, max: row.maxValue };
  };
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
         (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue,labNote)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`
    );

    for (let e of entries) {
      //const { min, max } = getParamRange(e.parameter, profile.gender, age);
      const { min, max } = verifytestfield(e.parameter, profile.gender, age);
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
        note,
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
          verifytestfield(e.parameter, profile.gender, age).min
        }-${verifytestfield(e.parameter, profile.gender, age).max}`,
        minValue: verifytestfield(e.parameter, profile.gender, age).min,
        maxValue: verifytestfield(e.parameter, profile.gender, age).max,
        date,
        time,
        note,
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
    setNote("");
    alert("Blood CP saved successfully.");
  };

  if (!profile) return <p>Select a profile first.</p>;
  if (settings.length == 0) return <div></div>;
  return (
    <div className="CPcontainer">
      <h2>
        Blood CP
        {/* Blood CP for {profile.name} ({profile.gender}, Age{" "}
        {getAge(profile.dob) ?? "--"}) */}
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
          required
        />
        <label>Note:</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
          const placeholder = verifytestfield(
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

//AGE WISE
// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import "../CSS/BloodCp.css";

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
// // Local date & time helpers
// const getToday = () => {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// };

// const getNowTime = () => {
//   const now = new Date();
//   const hours = String(now.getHours()).padStart(2, "0");
//   const minutes = String(now.getMinutes()).padStart(2, "0");
//   return `${hours}:${minutes}`;
// };
// // Helper: dynamic ranges per test parameter, gender & age sensitive (fallback)
// const getParamRange = (parameter, gender, age) => {
//   switch (parameter) {
//     case "RBC":
//       // males slightly higher normal
//       if (gender === "female") {
//         return age < 18 ? { min: 4.2, max: 5.2 } : { min: 3.8, max: 5.0 };
//       }
//       return age < 18 ? { min: 4.5, max: 5.5 } : { min: 4.7, max: 6.1 };
//     case "WBC":
//       return { min: 4000, max: 11000 };
//     case "Platelets":
//       return { min: 150000, max: 450000 };
//     case "HB":
//       if (gender === "female") return { min: 12, max: 16 };
//       return { min: 13.5, max: 17.5 };
//     case "HCT":
//       return gender === "female" ? { min: 36, max: 46 } : { min: 41, max: 53 };
//     default:
//       return { min: null, max: null };
//   }
// };

// // map numeric age to your age keys used by Settings
// const mapAgeToGroup = (age) => {
//   if (age == null) return "all";
//   if (age <= 1) return "0-1";
//   if (age <= 12) return "1-12";
//   if (age <= 18) return "13-18";
//   if (age <= 45) return "19-45";
//   if (age <= 65) return "46-65";
//   return "66+";
// };

// export default function BloodCP() {
//   const { state } = useLocation();
//   const profile = state?.profile;
//   const { db, saveDatabase } = useDatabase();

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [rbc, setRbc] = useState("");
//   const [wbc, setWbc] = useState("");
//   const [platelets, setPlatelets] = useState("");
//   const [hb, setHb] = useState("");
//   const [hct, setHct] = useState("");
//   const [records, setRecords] = useState([]);
//   const [settings, setSettings] = useState([]);
//   const testName = "BloodCP";

//   const loadData = () => {
//     if (!db || !profile) return;
//     const stmt = db.prepare(
//       `SELECT parameter, result, unit, referenceValue, minValue, maxValue, date, time
//        FROM LabReports
//        WHERE profileName = ? AND testName = ?
//        ORDER BY date DESC, time DESC`
//     );
//     stmt.bind([profile.name, testName]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setRecords(rows);
//   };

//   useEffect(() => {
//     loadData();
//   }, [db, profile]);

//   useEffect(() => {
//     if (!db) return;
//     // load all Blood Cp settings including age-specific (e.g. 'Blood Cp-RBC...::19-45')
//     const stmt = db.prepare(
//       `SELECT * FROM Settings WHERE vitalName LIKE 'Blood Cp%'`
//     );
//     let loaded = [];
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       loaded.push({ vitalName, gender, minValue, maxValue });
//     }
//     stmt.free();
//     //console.log(loaded);
//     setSettings(loaded);
//   }, [db]);

//   // verifytestfield now does age-aware lookup:
//   // tries: `Blood Cp-<param>::<ageKey>` -> `Blood Cp-<param>::all` -> legacy `Blood Cp-<param>`
//   // returns numeric {min, max} and falls back to getParamRange when DB row missing.
//   const verifytestfield = (vitalName, gender, age) => {
//     // map short key to vitalName base used in Settings
//     let vital = "";
//     if (vitalName === "RBC") vital = "Blood Cp-RBC(mil/mm3)";
//     else if (vitalName === "WBC") vital = "Blood Cp-WBC(/mm3)";
//     else if (vitalName === "Platelets") vital = "Blood Cp-Plateletts(/mm3)";
//     else if (vitalName === "HB") vital = "Blood Cp-Haemoglobin(g/dL)";
//     else if (vitalName === "HCT") vital = "Blood Cp-HCT(%)";

//     const tempGender = (String(gender || "") === "Female" || String(gender || "").toLowerCase() === "female")
//       ? "female"
//       : "male";

//     const ageKey = mapAgeToGroup(age);

//     const candidates = [
//       `${vital}::${ageKey}`,
//       `${vital}::all`,
//       `${vital}`, // legacy
//     ];

//     for (let name of candidates) {
//       const row = settings.find((s) => s.vitalName === name && s.gender === tempGender);
//       if (row) {
//         const min = row.minValue == null ? null : Number(row.minValue);
//         const max = row.maxValue == null ? null : Number(row.maxValue);
//         // if numeric, return; otherwise continue to fallback
//         if (!Number.isNaN(min) && !Number.isNaN(max) && min != null && max != null) {
//           return { min, max };
//         }
//       }
//     }

//     // fallback to built-in ranges
//     const fallback = getParamRange(vitalName, tempGender, age);
//     return { min: fallback.min, max: fallback.max };
//   };

//   const handleAdd = (e) => {
//     e.preventDefault();
//     if (![rbc, wbc, platelets, hb, hct].every((v) => v !== "")) {
//       return alert("Please fill all fields.");
//     }
//     const ts = new Date(`${date}T${time}`);
//     if (ts > new Date()) return alert("Cannot record future date/time");

//     const age = getAge(profile.dob);
//     const entries = [
//       { parameter: "RBC", value: parseFloat(rbc), unit: "mil/mm3" },
//       { parameter: "WBC", value: parseFloat(wbc), unit: "/mm3" },
//       { parameter: "Platelets", value: parseFloat(platelets), unit: "/mm3" },
//       { parameter: "HB", value: parseFloat(hb), unit: "g/dL" },
//       { parameter: "HCT", value: parseFloat(hct), unit: "%" },
//     ];

//     // Validate and insert
//     db.exec("BEGIN TRANSACTION;");
//     const stmt = db.prepare(
//       `INSERT INTO LabReports
//          (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
//     );

//     for (let e of entries) {
//       const { min, max } = verifytestfield(e.parameter, profile.gender, age);
//       const refStr = `${min}-${max}`;
//       if (min != null && max != null && (e.value < min || e.value > max)) {
//         if (
//           !window.confirm(
//             `⚠️ ${e.parameter} value ${e.value} ${e.unit} outside normal for ${profile.gender}, age ${age}\n` +
//               `(Normal: ${min}–${max} ${e.unit}). Continue?`
//           )
//         ) {
//           db.exec("ROLLBACK;");
//           return;
//         }
//       }
//       stmt.run([
//         profile.name,
//         testName,
//         e.parameter,
//         e.value,
//         e.unit,
//         refStr,
//         date,
//         time,
//         min,
//         max,
//       ]);
//     }
//     stmt.free();
//     db.exec("COMMIT;");
//     saveDatabase();

//     setRecords((prev) => [
//       ...entries.map((e) => {
//         const v = verifytestfield(e.parameter, profile.gender, age);
//         return {
//           parameter: e.parameter,
//           result: e.value,
//           unit: e.unit,
//           referenceValue: `${v.min}-${v.max}`,
//           minValue: v.min,
//           maxValue: v.max,
//           date,
//           time,
//         };
//       }),
//       ...prev,
//     ]);

//     // reset
//     setDate(getToday());
//     setTime(getNowTime());
//     setRbc("");
//     setWbc("");
//     setPlatelets("");
//     setHb("");
//     setHct("");
//     alert("Blood CP saved successfully.");
//   };

//   if (!profile) return <p>Select a profile first.</p>;
//   if (settings.length == 0) return <div></div>;
//   return (
//     <div className="CPcontainer">
//       <h2>
//         Blood CP for {profile.name} ({profile.gender}, Age{" "}
//         {getAge(profile.dob) ?? "--"})
//       </h2>
//       <form onSubmit={handleAdd} className="cp-form">
//         <label>Date</label>
//         <input
//           type="date"
//           value={date}
//           onChange={(e) => setDate(e.target.value)}
//           max={getToday()}
//           required
//         />
//         <label>Time</label>
//         <input
//           type="time"
//           value={time}
//           onChange={(e) => setTime(e.target.value)}
//           required
//         />

//         {["RBC", "WBC", "Platelets", "HB", "HCT"].map((param) => {
//           const stateMap = {
//             RBC: rbc,
//             WBC: wbc,
//             Platelets: platelets,
//             HB: hb,
//             HCT: hct,
//           };
//           const setterMap = {
//             RBC: setRbc,
//             WBC: setWbc,
//             Platelets: setPlatelets,
//             HB: setHb,
//             HCT: setHct,
//           };
//           const placeholderObj = verifytestfield(
//             param,
//             profile.gender,
//             getAge(profile.dob)
//           );
//           const phMin = placeholderObj.min ?? "";
//           const phMax = placeholderObj.max ?? "";
//           return (
//             <div key={param} className="input-group">
//               <label>{param}</label>
//               <input
//                 type="number"
//                 placeholder={`${phMin}-${phMax}`}
//                 value={stateMap[param]}
//                 onChange={(e) => setterMap[param](e.target.value)}
//                 required
//               />
//             </div>
//           );
//         })}
//         <button type="submit" className="submit-button">
//           Add Blood CP
//         </button>
//       </form>
//     </div>
//   );
// }
