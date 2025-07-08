// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import "../CSS/Lft.css";
// import useDatabase from "../Components/useDatabase";
// const LFT = () => {
//   const location = useLocation();
//   const { profile } = location.state || {}; // selected profile from state
//   const { db, saveDatabase } = useDatabase();
//   const testName = "LFT";
//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5);

//   const [directBilirubin, setDirectBilirubin] = useState("");
//   const [indirectBilirubin, setIndirectBilirubin] = useState("");
//   const [totalBilirubin, setTotalBilirubin] = useState("");
//   const [ast, setAST] = useState("");
//   const [alt, setALT] = useState("");
//   const [alkalinePhosphatase, setAlkalinePhosphatase] = useState("");
//   const [gamma, setGamma] = useState("");
//   const [data, setData] = useState("");
//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());

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
//         console.error("Error loading LFT data:", error);
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
//       !directBilirubin ||
//       !indirectBilirubin ||
//       !totalBilirubin ||
//       !ast ||
//       !alt ||
//       !alkalinePhosphatase ||
//       !gamma ||
//       !date ||
//       !time
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
//         parameter: "Direct Bilirubin",
//         value: directBilirubin,
//         unit: "mg/dL",
//         ref: "0.0-0.3",
//         min: 0.0,
//         max: 0.3,
//       },
//       {
//         parameter: "Indirect Bilirubin",
//         value: indirectBilirubin,
//         unit: "mg/dL",
//         ref: "0.1-0.8",
//         min: 0.1,
//         max: 0.8,
//       },
//       {
//         parameter: "Total Bilirubin",
//         value: totalBilirubin,
//         unit: "mg/dL",
//         ref: "0.2-1.1",
//         min: 0.2,
//         max: 1.1,
//       },
//       {
//         parameter: "AST",
//         value: ast,
//         unit: "IU/L",
//         ref: "9-40",
//         min: 9,
//         max: 40,
//       },
//       {
//         parameter: "ALT",
//         value: alt,
//         unit: "IU/L",
//         ref: "5-50",
//         min: 5,
//         max: 50,
//       },
//       {
//         parameter: "Alkaline Phosphatase",
//         value: alkalinePhosphatase,
//         unit: "IU/L",
//         ref: "56-167",
//         min: 56,
//         max: 167,
//       },
//       {
//         parameter: "Gamma",
//         value: gamma,
//         unit: "IU/L",
//         ref: "<69",
//         min: 0,
//         max: 69,
//       },
//     ];
//     try {
//       const stmt = db.prepare(`
//           INSERT INTO LabReports (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `);

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
//       setData("");
//       setDirectBilirubin("");
//       setIndirectBilirubin("");
//       setTotalBilirubin("");
//       setAST("");
//       setALT("");
//       setAlkalinePhosphatase("");
//       setGamma("");
//       setDate(getToday());
//       setTime(getNowTime());
//       alert("Liver Function Test saved successfully.");
//     } catch (error) {
//       console.error("Error inserting LFT record:", error);
//     }
//   };
//   return (
//     <div className="lftContainer">
//       <h1>Liver Function Tests</h1>

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
//           Direct Bilirubin
//           <input
//             type="text"
//             placeholder="0.0 - 0.3"
//             value={directBilirubin}
//             onChange={(e) => setDirectBilirubin(e.target.value)}
//           />
//         </label>
//         <label>
//           Indirect Bilirubin
//           <input
//             type="text"
//             placeholder="0.1 - 0.8"
//             value={indirectBilirubin}
//             onChange={(e) => setIndirectBilirubin(e.target.value)}
//           />
//         </label>
//         <label>
//           Total Bilirubin
//           <input
//             type="text"
//             placeholder="0.2 - 1.1"
//             value={totalBilirubin}
//             onChange={(e) => setTotalBilirubin(e.target.value)}
//           />
//         </label>
//         <label>
//           SGOT AST
//           <input
//             type="text"
//             placeholder="9 - 40"
//             value={ast}
//             onChange={(e) => setAST(e.target.value)}
//           />
//         </label>
//         <label>
//           SGPT ALT
//           <input
//             type="text"
//             placeholder="5-50"
//             value={alt}
//             onChange={(e) => setALT(e.target.value)}
//           />
//         </label>
//         <label>
//           Alkaline Phosphatase
//           <input
//             type="text"
//             placeholder="56-167"
//             value={alkalinePhosphatase}
//             onChange={(e) => setAlkalinePhosphatase(e.target.value)}
//           />
//         </label>
//         <label>
//           Gamma GT
//           <input
//             type="text"
//             placeholder="<69 "
//             value={gamma}
//             onChange={(e) => setGamma(e.target.value)}
//           />
//         </label>
//         <button type="submit" className="submit-button">
//           Add
//         </button>
//       </form>
//     </div>
//   );
// };

// export default LFT;

// 2 ACCORDING TO AGE AND GENDER
// src/screens/LFT.js with gender/age-aware ranges
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../CSS/Lft.css";
import useDatabase from "../Components/useDatabase";

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
    case "Direct Bilirubin":
      return { min: 0.0, max: 0.3 };
    case "Indirect Bilirubin":
      return { min: 0.1, max: 0.8 };
    case "Total Bilirubin":
      return { min: 0.2, max: 1.1 };
    case "AST":
      return { min: 9, max: 40 };
    case "ALT":
      return { min: 5, max: 50 };
    case "Alkaline Phosphatase":
      return { min: 56, max: 167 };
    case "Gamma":
      return { min: 0, max: 69 };
    default:
      return { min: 0, max: 0 };
  }
};

export default function LFT() {
  const location = useLocation();
  const { profile } = location.state || {};
  const { db, saveDatabase } = useDatabase();
  const testName = "LFT";

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());

  const [directBilirubin, setDirectBilirubin] = useState("");
  const [indirectBilirubin, setIndirectBilirubin] = useState("");
  const [totalBilirubin, setTotalBilirubin] = useState("");
  const [ast, setAST] = useState("");
  const [alt, setALT] = useState("");
  const [alkalinePhosphatase, setAlkalinePhosphatase] = useState("");
  const [gamma, setGamma] = useState("");
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
    const inputs = [
      directBilirubin,
      indirectBilirubin,
      totalBilirubin,
      ast,
      alt,
      alkalinePhosphatase,
      gamma,
    ];
    if (inputs.some((v) => v === "")) return alert("Please fill all fields.");
    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) return alert("Cannot record future date/time");

    const age = getAge(profile.dob);
    const entries = [
      {
        parameter: "Direct Bilirubin",
        value: parseFloat(directBilirubin),
        unit: "mg/dL",
      },
      {
        parameter: "Indirect Bilirubin",
        value: parseFloat(indirectBilirubin),
        unit: "mg/dL",
      },
      {
        parameter: "Total Bilirubin",
        value: parseFloat(totalBilirubin),
        unit: "mg/dL",
      },
      { parameter: "AST", value: parseFloat(ast), unit: "IU/L" },
      { parameter: "ALT", value: parseFloat(alt), unit: "IU/L" },
      {
        parameter: "Alkaline Phosphatase",
        value: parseFloat(alkalinePhosphatase),
        unit: "IU/L",
      },
      { parameter: "Gamma", value: parseFloat(gamma), unit: "IU/L" },
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

    setDirectBilirubin("");
    setIndirectBilirubin("");
    setTotalBilirubin("");
    setAST("");
    setALT("");
    setAlkalinePhosphatase("");
    setGamma("");
    setDate(getToday());
    setTime(getNowTime());
    alert("LFT saved successfully.");
  };

  if (!profile) return <p>Select a profile first.</p>;

  return (
    <div className="lftContainer">
      <h1>
        LFT for {profile.name} ({profile.gender}, Age{" "}
        {getAge(profile.dob) ?? "--"})
      </h1>
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

        {[
          "Direct Bilirubin",
          "Indirect Bilirubin",
          "Total Bilirubin",
          "AST",
          "ALT",
          "Alkaline Phosphatase",
          "Gamma",
        ].map((param) => {
          const valueMap = {
            "Direct Bilirubin": directBilirubin,
            "Indirect Bilirubin": indirectBilirubin,
            "Total Bilirubin": totalBilirubin,
            AST: ast,
            ALT: alt,
            "Alkaline Phosphatase": alkalinePhosphatase,
            Gamma: gamma,
          };
          const setterMap = {
            "Direct Bilirubin": setDirectBilirubin,
            "Indirect Bilirubin": setIndirectBilirubin,
            "Total Bilirubin": setTotalBilirubin,
            AST: setAST,
            ALT: setALT,
            "Alkaline Phosphatase": setAlkalinePhosphatase,
            Gamma: setGamma,
          };
          const range = getParamRange(param);
          return (
            <label key={param}>
              {param}
              <input
                type="number"
                placeholder={`${range.min}-${range.max}`}
                value={valueMap[param]}
                onChange={(e) => setterMap[param](e.target.value)}
                required
              />
            </label>
          );
        })}

        <button type="submit" className="submit-button">
          Add
        </button>
      </form>
    </div>
  );
}
