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
// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import "../CSS/TFT.css";

// const getToday = () => new Date().toISOString().split("T")[0];
// const getNowTime = () => new Date().toTimeString().slice(0, 5);

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

// const getParamRange = (param) => {
//   switch (param) {
//     case "T3":
//       return { min: 0.6, max: 1.6 };
//     case "T4":
//       return { min: 4.5, max: 10.9 };
//     case "TSH":
//       return { min: 0.4, max: 4.5 };
//     default:
//       return { min: 0, max: 0 };
//   }
// };

// export default function TFT() {
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db, saveDatabase } = useDatabase();
//   const [settings, setSettings] = useState([]);
//   const testName = "TFT";

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());

//   const [t3, setT3] = useState("");
//   const [t4, setT4] = useState("");
//   const [tsh, setTSH] = useState("");
//   const [note, setNote] = useState("");
//   const [locationField, setLocationField] = useState("");
//   const [records, setRecords] = useState([]);
//   const predefinedLocations = [
//     "IDC-ISB",
//     "IDC-RWP",
//     "EXCEL-RWP",
//     "CHUGTAI-RWP",
//   ];
//   const loadData = () => {
//     if (!db || !profile) return;
//     const stmt = db.prepare(
//       `SELECT parameter, result, unit, referenceValue, minValue, maxValue, date, time,location,labNote FROM LabReports WHERE profileName = ? AND testName = ?`
//     );
//     stmt.bind([profile.name, testName]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setRecords(rows);
//   };

//   useEffect(() => {
//     if (db && profile) loadData();
//   }, [db, profile]);
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare(
//       `SELECT * FROM Settings WHERE vitalName IN (
//         "TFT-T3(ng/mL)", "TFT-T4(μg/dL)", "TFT-TSH(μIU/mL)"
//       )`
//     );
//     let loaded = [];
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       loaded.push({ vitalName, gender, minValue, maxValue });
//     }
//     stmt.free();
//     console.log(loaded);
//     setSettings(loaded);
//   }, [db]);
//   // const verifytestfield = (vitalName, gender, age) => {
//   //   console.log(vitalName, gender);
//   //   let vital = "";
//   //   if (vitalName == "T3") vital = "TFT-T3(ng/mL)";
//   //   else if (vitalName == "T4") vital = "TFT-T4(μg/dL)";
//   //   else if (vitalName == "TSH") vital = "TFT-TSH(μIU/mL)";

//   //   let tempGender = "";
//   //   if (gender == "Male") tempGender = "male";
//   //   else if (gender == "Female") tempGender = "female";

//   //   //console.log(vital);
//   //   //console.log(settings);
//   //   const row = settings.find(
//   //     (s) => s.vitalName === vital && s.gender === tempGender
//   //   );
//   //   console.log(row);
//   //   return { min: row.minValue, max: row.maxValue };
//   // };
//   const verifytestfield = (vitalName, gender, age) => {
//     // map short param -> settings vitalName
//     let vital =
//       vitalName === "T3"
//         ? "TFT-T3(ng/mL)"
//         : vitalName === "T4"
//         ? "TFT-T4(μg/dL)"
//         : "TFT-TSH(μIU/mL)";

//     const tempGender = gender === "Male" ? "male" : "female";

//     const row = settings.find(
//       (s) =>
//         s.vitalName === vital && String(s.gender).toLowerCase() === tempGender
//     );

//     if (!row) {
//       // fallback: use hardcoded range function
//       const fallback = getParamRange(vitalName);
//       return { min: fallback.min, max: fallback.max };
//     }

//     return { min: row.minValue, max: row.maxValue };
//   };

//   useEffect(() => {
//     const today = getToday();
//     const now = getNowTime();
//     if (date === today) {
//       setMaxTime(now);
//       if (time > now) setTime(now);
//     } else setMaxTime("23:59");
//   }, [date, time]);

//   const handleAdd = (e) => {
//     e.preventDefault();
//     const inputs = [t3, t4, tsh];
//     if (inputs.some((v) => v === "")) return alert("Please fill all fields.");
//     const ts = new Date(`${date}T${time}`);
//     if (ts > new Date()) return alert("Cannot record future date/time");

//     const age = getAge(profile.dob);
//     const entries = [
//       { parameter: "T3", value: parseFloat(t3), unit: "ng/mL" },
//       { parameter: "T4", value: parseFloat(t4), unit: "μg/dL" },
//       { parameter: "TSH", value: parseFloat(tsh), unit: "μIU/mL" },
//     ];

//     db.exec("BEGIN TRANSACTION;");
//     const stmt = db.prepare(
//       `INSERT INTO LabReports
//         (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue,location,labNote)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`
//     );

//     for (let e of entries) {
//       const { min, max } = getParamRange(e.parameter);
//       const refStr = `${min}-${max}`;
//       if (e.value < min || e.value > max) {
//         if (
//           !window.confirm(
//             `⚠️ ${e.parameter} = ${e.value} is out of range (normal: ${min}–${max}). Continue?`
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
//         locationField,
//         note,
//       ]);
//     }
//     stmt.free();
//     db.exec("COMMIT;");
//     saveDatabase();
//     loadData();
//     setRecords((prev) => [
//       ...entries.map((e) => ({
//         parameter: e.parameter,
//         result: e.value,
//         unit: e.unit,
//         referenceValue: `${
//           verifytestfield(e.parameter, profile.gender, age).min
//         }-${verifytestfield(e.parameter, profile.gender, age).max}`,
//         minValue: verifytestfield(e.parameter, profile.gender, age).min,
//         maxValue: verifytestfield(e.parameter, profile.gender, age).max,
//         date,
//         time,
//       })),
//       ...prev,
//     ]);

//     setT3("");
//     setT4("");
//     setTSH("");
//     setDate(getToday());
//     setTime(getNowTime());
//     setLocationField("");
//     setNote("");
//     alert("TFT saved successfully.");
//   };

//   if (!profile) return <p>Select a profile first.</p>;
//   if (settings.length == 0) return <div></div>;
//   return (
//     <div className="tftContainer">
//       <div className="tft-card">
//         <h2>
//           TFT
//           {/* TFT for {profile.name} ({profile.gender}, Age{" "}
//           {getAge(profile.dob) ?? "--"}) */}
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
//           {/* {/* <div className="input-group">
//             <label>LOCATION:</label>

//             <select
//               value={locationField}
//               onChange={(e) => setLocationField(e.target.value)}
//               style={{ padding: 6 }}
//             >
//               {predefinedLocations.map((rel) => (
//                 <option key={rel} value={rel}>
//                   {rel}
//                 </option>
//               ))}
//             </select>

//           </div> */}
//           <div className="input-group">
//             <label>Note:</label>
//             <input
//               type="text"
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//             />
//           </div>
//           {["T3", "T4", "TSH"].map((param) => {
//             const valMap = { T3: t3, T4: t4, TSH: tsh };
//             const setMap = { T3: setT3, T4: setT4, TSH: setTSH };
//             const range = getParamRange(param, profile.gender);
//             return (
//               <div className="input-group" key={param}>
//                 <label>{param}:</label>
//                 <input
//                   type="number"
//                   value={valMap[param]}
//                   onChange={(e) => setMap[param](e.target.value)}
//                   placeholder={`${range.min}-${range.max}`}
//                   required
//                 />
//               </div>
//             );
//           })}
//           <button type="submit" className="submit-button">
//             Add TFT Record
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

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
  // Accept either location.state.profile OR location.state being the profile itself
  const profile = location.state?.profile ?? location.state;
  const { db, saveDatabase } = useDatabase();
  const [settings, setSettings] = useState([]);
  const testName = "TFT";

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());

  const [t3, setT3] = useState("");
  const [t4, setT4] = useState("");
  const [tsh, setTSH] = useState("");
  const [note, setNote] = useState("");
  const [locationField, setLocationField] = useState("");
  const [records, setRecords] = useState([]);
  const predefinedLocations = [
    "IDC-ISB",
    "IDC-RWP",
    "EXCEL-RWP",
    "CHUGTAI-RWP",
  ];

  const loadData = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        `SELECT parameter, result, unit, referenceValue, minValue, maxValue, date, time, location, labNote
         FROM LabReports WHERE profileName = ? AND testName = ?`
      );
      stmt.bind([profile.name, testName]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setRecords(rows);
    } catch (err) {
      console.error("loadData error:", err);
    }
  };

  useEffect(() => {
    if (db && profile) loadData();
  }, [db, profile]);

  useEffect(() => {
    if (!db) return;
    try {
      // Use a LIKE query to be robust against differences/encoding in vitalName
      const stmt = db.prepare(
        `SELECT * FROM Settings WHERE vitalName LIKE 'TFT-%'`
      );
      let loaded = [];
      while (stmt.step()) {
        const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
        loaded.push({ vitalName, gender, minValue, maxValue });
      }
      stmt.free();
      console.log("TFT loaded settings from DB:", loaded);

      // If DB returned nothing, create fallback settings for both genders
      if (loaded.length === 0) {
        const fallback = [];
        ["T3", "T4", "TSH"].forEach((p) => {
          const r = getParamRange(p);
          fallback.push(
            {
              vitalName: `TFT-${p}`,
              gender: "male",
              minValue: r.min,
              maxValue: r.max,
            },
            {
              vitalName: `TFT-${p}`,
              gender: "female",
              minValue: r.min,
              maxValue: r.max,
            }
          );
        });
        console.warn(
          "No TFT settings in DB — using fallback ranges:",
          fallback
        );
        setSettings(fallback);
      } else {
        // normalize gender to lower-case for easier matching later
        const normalized = loaded.map((r) => ({
          ...r,
          gender: String(r.gender ?? "").toLowerCase(),
          minValue: Number(r.minValue),
          maxValue: Number(r.maxValue),
        }));
        setSettings(normalized);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      // fallback as above if error
      const fallback = [];
      ["T3", "T4", "TSH"].forEach((p) => {
        const r = getParamRange(p);
        fallback.push(
          {
            vitalName: `TFT-${p}`,
            gender: "male",
            minValue: r.min,
            maxValue: r.max,
          },
          {
            vitalName: `TFT-${p}`,
            gender: "female",
            minValue: r.min,
            maxValue: r.max,
          }
        );
      });
      setSettings(fallback);
    }
  }, [db]);

  const verifytestfield = (vitalName, gender, age) => {
    let vital =
      vitalName === "T3" ? "TFT-T3" : vitalName === "T4" ? "TFT-T4" : "TFT-TSH";

    const tempGender =
      String(gender).toLowerCase() === "male" ? "male" : "female";

    const row = settings.find(
      (s) =>
        (s.vitalName?.includes(vital) || s.vitalName === vital) &&
        String(s.gender).toLowerCase() === tempGender
    );

    if (!row) {
      const fallback = getParamRange(vitalName);
      return { min: fallback.min, max: fallback.max };
    }

    return { min: Number(row.minValue), max: Number(row.maxValue) };
  };

  useEffect(() => {
    console.log(
      "debug -> db:",
      db,
      "profile:",
      profile,
      "settings length:",
      settings.length
    );
  }, [db, profile, settings.length]);

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

    const age = getAge(profile?.dob);
    const entries = [
      { parameter: "T3", value: parseFloat(t3), unit: "ng/mL" },
      { parameter: "T4", value: parseFloat(t4), unit: "μg/dL" },
      { parameter: "TSH", value: parseFloat(tsh), unit: "μIU/mL" },
    ];

    try {
      db.exec("BEGIN TRANSACTION;");
      const stmt = db.prepare(
        `INSERT INTO LabReports
          (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue, location, labNote)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          locationField,
          note,
        ]);
      }
      stmt.free();
      db.exec("COMMIT;");
      saveDatabase();
      loadData();
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
        })),
        ...prev,
      ]);

      setT3("");
      setT4("");
      setTSH("");
      setDate(getToday());
      setTime(getNowTime());
      setLocationField("");
      setNote("");
      alert("TFT saved successfully.");
    } catch (err) {
      console.error("Error saving TFT:", err);
      try {
        db.exec("ROLLBACK;");
      } catch (e) {}
      alert("Failed to save TFT. See console for details.");
    }
  };

  if (!profile) return <p>Select a profile first.</p>;
  if (!db) return <p>Loading database…</p>;

  return (
    <div className="tftContainer">
      <div className="tft-card">
        <h2>TFT</h2>
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
            <label>Note:</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
                  step="any"
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
