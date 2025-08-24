// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import "../CSS/Rft.css";
// import useDatabase from "../Components/useDatabase";
// const RFT = () => {
//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5);
//   const [bloodUrea, setBloodUrea] = useState("");
//   const [serum, setSerum] = useState("");
//   const [uricAcid, setUricAcid] = useState("");
//   const [bun, setBun] = useState("");

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());
//   const [data, setData] = useState("");
//   const location = useLocation();
//   const { profile } = location.state || {}; // selected profile from state
//   const { db, saveDatabase } = useDatabase();
//   const testName = "RFT";
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
//         setData(records);
//       } catch (error) {
//         console.error("Error loading RFT data:", error);
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
//     if (
//       !date ||
//       !time ||
//       !bloodUrea ||
//       !serum ||
//       !uricAcid ||
//       !db ||
//       !bun ||
//       !profile
//     )
//       return;
//     const selected = new Date(`${date}T${time}`);
//     const now = new Date();
//     if (selected > now) {
//       alert("Cannot record a future date/time");
//       return;
//     }

//     const parameters = [
//       {
//         parameter: "Blood Urea",
//         value: bloodUrea,
//         unit: "mg/dL",
//         ref: "10-50",
//         min: 10,
//         max: 50,
//       },
//       {
//         parameter: "Serum",
//         value: serum,
//         unit: "mg/dL",
//         ref: "0.4-1.3",
//         min: 0.4,
//         max: 1.3,
//       },
//       {
//         parameter: "Uric Acid",
//         value: uricAcid,
//         unit: "mg/dL",
//         ref: "3.7-7.7",
//         min: 3.7,
//         max: 7.7,
//       },
//       {
//         parameter: "BUN",
//         value: bun,
//         unit: "mg/dL",
//         ref: "5-24",
//         min: 5,
//         max: 24,
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
//       setBun("");
//       setBloodUrea("");

//       setUricAcid("");
//       setSerum("");

//       alert("Renal Function Test saved successfully.");
//     } catch (error) {
//       console.error("Error inserting RFT record:", error);
//     }
//   };
//   return (
//     <div className="rftContainer">
//       <h1>Renal Function Test</h1>

//       <form onSubmit={handleAdd}>
//         <label>
//           Date
//           <input
//             type="date"
//             placeholder="Date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             max={getToday()}
//           />
//         </label>
//         <label>
//           Time:
//           <input
//             type="time"
//             placeholder="Time"
//             value={time}
//             onChange={(e) => setTime(e.target.value)}
//             max={maxTime}
//           />
//         </label>
//         <label>
//           Blood Urea
//           <input
//             type="text"
//             placeholder="10-50"
//             value={bloodUrea}
//             onChange={(e) => setBloodUrea(e.target.value)}
//           />
//         </label>
//         <label>
//           Serum Creatinine
//           <input
//             type="text"
//             placeholder="0.4-1.3"
//             value={serum}
//             onChange={(e) => setSerum(e.target.value)}
//           />
//         </label>
//         <label>
//           Uric Acid
//           <input
//             type="text"
//             placeholder="3.7-7.7"
//             value={uricAcid}
//             onChange={(e) => setUricAcid(e.target.value)}
//           />
//         </label>
//         <label>
//           BUN
//           <input
//             type="text"
//             placeholder="5-24"
//             value={bun}
//             onChange={(e) => setBun(e.target.value)}
//           />
//         </label>

//         <button type="submit" className="submit-button">
//           Add
//         </button>
//       </form>
//     </div>
//   );
// };

// export default RFT;

// 2 SAME FOR AGE AND GENDER
// src/screens/BloodCP.js (shared RFT logic)
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/Rft.css";

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

const getParamRange = (parameter, gender, age) => {
  switch (parameter) {
    case "Blood Urea":
      return { min: 10, max: 50 };
    case "Serum":
      return { min: 0.4, max: 1.3 };
    case "Uric Acid":
      return { min: 3.7, max: 7.7 };
    case "BUN":
      return { min: 5, max: 24 };
    default:
      return { min: null, max: null };
  }
};

export default function RFT() {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db, saveDatabase } = useDatabase();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());

  const [bloodUrea, setBloodUrea] = useState("");
  const [serum, setSerum] = useState("");
  const [uricAcid, setUricAcid] = useState("");
  const [bun, setBun] = useState("");
  const [records, setRecords] = useState([]);

  const testName = "RFT";

  const loadData = () => {
    if (!db || !profile) return;
    const stmt = db.prepare(
      `SELECT parameter, result, unit, referenceValue, minValue, maxValue, date, time
       FROM LabReports WHERE profileName = ? AND testName = ?`
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
    if (![bloodUrea, serum, uricAcid, bun].every((v) => v !== "")) {
      return alert("Please fill all fields.");
    }
    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) return alert("Cannot record future date/time");

    const age = getAge(profile.dob);
    const entries = [
      { parameter: "Blood Urea", value: parseFloat(bloodUrea), unit: "mg/dL" },
      { parameter: "Serum", value: parseFloat(serum), unit: "mg/dL" },
      { parameter: "Uric Acid", value: parseFloat(uricAcid), unit: "mg/dL" },
      { parameter: "BUN", value: parseFloat(bun), unit: "mg/dL" },
    ];

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
            `⚠️ ${e.parameter} value ${e.value} ${e.unit} is out of range for ${profile.gender}, age ${age}\n(Normal: ${min}–${max}). Continue?`
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
      ...entries.map((e) => {
        const { min, max } = getParamRange(e.parameter, profile.gender, age);
        return {
          parameter: e.parameter,
          result: e.value,
          unit: e.unit,
          referenceValue: `${min}-${max}`,
          minValue: min,
          maxValue: max,
          date,
          time,
        };
      }),
      ...prev,
    ]);

    setBloodUrea("");
    setSerum("");
    setUricAcid("");
    setBun("");
    setDate(getToday());
    setTime(getNowTime());
    alert("RFT saved successfully.");
  };

  if (!profile) return <p>Select a profile first.</p>;

  return (
    <div className="rftContainer">
      <h2>
        RFT
        {/* RFT for {profile.name} ({profile.gender}, Age{" "}
        {getAge(profile.dob) ?? "--"}) */}
      </h2>
      <form onSubmit={handleAdd}>
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
          max={maxTime}
          required
        />

        {["Blood Urea", "Serum", "Uric Acid", "BUN"].map((param) => {
          const stateMap = {
            "Blood Urea": bloodUrea,
            Serum: serum,
            "Uric Acid": uricAcid,
            BUN: bun,
          };
          const setterMap = {
            "Blood Urea": setBloodUrea,
            Serum: setSerum,
            "Uric Acid": setUricAcid,
            BUN: setBun,
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
          Add RFT
        </button>
      </form>
    </div>
  );
}
