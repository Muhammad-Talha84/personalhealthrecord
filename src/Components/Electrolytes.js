// import React, { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import "../CSS/Electrolyte.css";
// const Electrolytes = () => {
//   const getToday = () => new Date().toISOString().split("T")[0];
//   const getNowTime = () => new Date().toTimeString().slice(0, 5); // HH:mm

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());
//   const [sodium, setSodium] = useState("");
//   const [potassium, setPotassium] = useState("");
//   const [chloride, setChloride] = useState("");
//   const [bicarbonate, setBicarbonate] = useState("");
//   const [aniongap, setAniongap] = useState("");
//   const [dataRecords, setDataRecords] = useState([]);
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db, saveDatabase } = useDatabase();
//   const testName = "Electrolytes";
//   const loadData = () => {
//     if (db && profile) {
//       try {
//         const query = db.prepare(
//           `SELECT parameter,result,unit,referenceValue,date,time FROM LabReports WHERE profileName=? AND testName=?`
//         );
//         query.bind([profile.name, testName]);
//         const records = [];
//         while (query.step()) {
//           records.push(query.getAsObject());
//         }
//         query.free();
//         setDataRecords(records);
//       } catch (error) {
//         console.error("ERROR LOADING ELECTROLYTES DATA", error);
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
//       !sodium ||
//       !potassium ||
//       !bicarbonate ||
//       !chloride ||
//       !aniongap
//     )
//       return;
//     const selected = new Date(`${date}T${time}`);
//     const now = new Date();
//     if (selected > now) {
//       alert("Please select a valid date and time");
//       return;
//     }
//     const parameters = [
//       {
//         parameter: "Sodium",
//         value: sodium,
//         unit: "mmol/L",
//         ref: "136-145",
//         min: 136,
//         max: 145,
//       },
//       {
//         parameter: "Potassium",
//         value: potassium,
//         unit: "mmol/L",
//         ref: "3.5-5.3",
//         min: 3.5,
//         max: 5.3,
//       },
//       {
//         parameter: "Bicarbonate",
//         value: bicarbonate,
//         unit: "mmol/L",
//         ref: "22-29",
//         min: 22,
//         max: 29,
//       },
//       {
//         parameter: "Chloride",
//         value: chloride,
//         unit: "mmol/L",
//         ref: "98-107",
//         min: 98,
//         max: 107,
//       },
//       {
//         parameter: "Anion Gap",
//         value: aniongap,
//         unit: "mmol/L",
//         ref: "8-16",
//         min: 8,
//         max: 16,
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
//       setChloride("");
//       setAniongap("");
//       setBicarbonate("");
//       setSodium("");
//       setPotassium("");

//       alert("ELECTROLYTE saved successfully.");
//     } catch (error) {
//       console.error("Error inserting ELECTROLYTE record:", error);
//     }
//   };
//   return (
//     <div className="electrolyteContainer">
//       <div className="electrolyte-card">
//         <h2> ELECTROLYTE TEST RECORD</h2>
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
//             <label>Sodium</label>
//             <input
//               type="number"
//               value={sodium}
//               onChange={(e) => setSodium(e.target.value)}
//               placeholder="136-145"
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>Potassium:</label>
//             <input
//               type="number"
//               value={potassium}
//               onChange={(e) => setPotassium(e.target.value)}
//               placeholder="3.5-5.3"
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>Chloride:</label>
//             <input
//               type="number"
//               value={chloride}
//               onChange={(e) => setChloride(e.target.value)}
//               placeholder="98-107"
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>Bicarbonate:</label>
//             <input
//               type="number"
//               value={bicarbonate}
//               onChange={(e) => setBicarbonate(e.target.value)}
//               placeholder="22-29"
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>Anion Gap:</label>
//             <input
//               type="number"
//               value={aniongap}
//               onChange={(e) => setAniongap(e.target.value)}
//               placeholder="8-16"
//               required
//             />
//           </div>
//           <button type="submit" className="submit-button">
//             Add Electrolyte Record
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Electrolytes;

// 2 DONE BY ACCORDING TO AGE AND GENDER
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
    case "Sodium":
      return { min: 136, max: 145 };
    case "Potassium":
      return { min: 3.5, max: 5.3 };
    case "Bicarbonate":
      return { min: 22, max: 29 };
    case "Chloride":
      return { min: 98, max: 107 };
    case "Anion Gap":
      return { min: 8, max: 16 };
    default:
      return { min: 0, max: 0 };
  }
};

export default function Electrolytes() {
  const getToday = () => new Date().toISOString().split("T")[0];
  const getNowTime = () => new Date().toTimeString().slice(0, 5);

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
    if (!db || !profile) return;
    try {
      const query = db.prepare(
        `SELECT parameter,result,unit,referenceValue,minValue,maxValue,date,time FROM LabReports WHERE profileName=? AND testName=?`
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
  };

  useEffect(() => {
    if (db && profile) loadData();
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
    const inputs = [sodium, potassium, bicarbonate, chloride, aniongap];
    if (inputs.some((v) => v === "")) return alert("Please fill all fields.");
    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) return alert("Cannot record future date/time");

    const entries = [
      { parameter: "Sodium", value: parseFloat(sodium), unit: "mmol/L" },
      { parameter: "Potassium", value: parseFloat(potassium), unit: "mmol/L" },
      {
        parameter: "Bicarbonate",
        value: parseFloat(bicarbonate),
        unit: "mmol/L",
      },
      { parameter: "Chloride", value: parseFloat(chloride), unit: "mmol/L" },
      { parameter: "Anion Gap", value: parseFloat(aniongap), unit: "mmol/L" },
    ];

    db.exec("BEGIN TRANSACTION;");
    const stmt = db.prepare(`
      INSERT INTO LabReports (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

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

    setSodium("");
    setPotassium("");
    setChloride("");
    setBicarbonate("");
    setAniongap("");
    setDate(getToday());
    setTime(getNowTime());
    alert("Electrolyte test saved successfully.");
  };

  if (!profile) return <p>Select a profile first.</p>;

  return (
    <div className="electrolyteContainer">
      <div className="electrolyte-card">
        <h2>
          Electrolyte Test for {profile.name}({profile.gender}, Age{" "}
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
          {["Sodium", "Potassium", "Chloride", "Bicarbonate", "Anion Gap"].map(
            (param) => {
              const valMap = {
                Sodium: sodium,
                Potassium: potassium,
                Chloride: chloride,
                Bicarbonate: bicarbonate,
                "Anion Gap": aniongap,
              };
              const setMap = {
                Sodium: setSodium,
                Potassium: setPotassium,
                Chloride: setChloride,
                Bicarbonate: setBicarbonate,
                "Anion Gap": setAniongap,
              };
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
            }
          )}
          <button type="submit" className="submit-button">
            Add Electrolyte Record
          </button>
        </form>
      </div>
    </div>
  );
}
