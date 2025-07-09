// // LipidProfile.js
// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import "../CSS/LipidProfile.css";
// import useDatabase from "../Components/useDatabase";

// const getToday = () => new Date().toISOString().split("T")[0];
// const getNowTime = () => new Date().toTimeString().slice(0, 5);

// // 1) Define your normal ranges here
// const NORMAL_RANGES = {
//   Cholesterol: { min: 0, max: 200 }, // <200 preferred
//   HDL: { min: 40, max: Infinity }, // >40 (males) / >50 (females) – simplified to >40
//   LDL: { min: 0, max: 130 }, // <130 preferred
//   Triglycerides: { min: 0, max: 150 }, // <150 preferred
//   VLDL: { min: 5, max: 40 }, // 5–40
// };

// const LipidProfile = () => {
//   const [cholesterol, setCholesterol] = useState("");
//   const [hdl, setHdl] = useState("");
//   const [ldl, setLdl] = useState("");
//   const [triglycerides, setTriglycerides] = useState("");
//   const [vldl, setVldl] = useState("");

//   const [date, setDate] = useState(getToday());
//   const [time, setTime] = useState(getNowTime());
//   const [maxTime, setMaxTime] = useState(getNowTime());
//   const [records, setRecords] = useState([]);

//   const { profile } = useLocation().state || {};
//   const { db, saveDatabase } = useDatabase();
//   const testName = "LipidProfile";

//   // load existing records (unchanged)
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare(
//       `SELECT parameter, result, unit, referenceValue, date, time, minValue, maxValue
//        FROM LabReports
//        WHERE profileName = ? AND testName = ?
//        ORDER BY date DESC, time DESC`
//     );
//     stmt.bind([profile.name, testName]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setRecords(rows);
//   }, [db, profile]);

//   // keep time ≤ now when date is today
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
//     // 2) basic field check
//     if (!cholesterol || !hdl || !ldl || !triglycerides || !date || !time) {
//       return alert("Please fill in all fields");
//     }
//     const selected = new Date(`${date}T${time}`);
//     if (selected > new Date()) {
//       return alert("Cannot record a future date/time");
//     }

//     // parse values
//     const cholVal = +cholesterol;
//     const hdlVal = +hdl;
//     const ldlVal = +ldl;
//     const triVal = +triglycerides;
//     // auto‐calc VLDL if not provided
//     const vldlVal = vldl ? +vldl : +(triVal / 5).toFixed(2);

//     // 3) pack everything into an array by looping over your ranges
//     const allValues = {
//       Cholesterol: cholVal,
//       HDL: hdlVal,
//       LDL: ldlVal,
//       Triglycerides: triVal,
//       VLDL: vldlVal,
//     };

//     try {
//       Object.entries(allValues).forEach(([parameter, value]) => {
//         const range = NORMAL_RANGES[parameter];
//         const isAbnormal = value < range.min || value > range.max;
//         const refText = `${range.min}–${range.max}`;
//         db.run(
//           `INSERT INTO LabReports
//             (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
//           [
//             profile.name,
//             testName,
//             parameter,
//             value,
//             "mg/dL",
//             refText,
//             date,
//             time,
//             range.min,
//             range.max,
//           ]
//         );
//         // optionally, you could do:
//         // if (isAbnormal) console.warn(`${parameter} is abnormal!`);
//       });
//       saveDatabase();
//       // refresh & clear
//       setRecords((r) => []); // trigger reload
//       // (reuse your loadData logic or just reload the page)
//       setCholesterol("");
//       setHdl("");
//       setLdl("");
//       setTriglycerides("");
//       setVldl("");
//       setDate(getToday());
//       setTime(getNowTime());
//       alert("Saved!");
//     } catch (err) {
//       console.error(err);
//       alert("Error saving.");
//     }
//   };

//   return (
//     <div className="lipidContainer">
//       <h1>Lipid Profile for {profile?.name}</h1>
//       <form onSubmit={handleAdd} className="lipid-form">
//         {/* date/time inputs (unchanged) */}
//         <div className="form-row">
//           <label>
//             Date
//             <input
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               max={getToday()}
//               required
//             />
//           </label>
//           <label>
//             Time
//             <input
//               type="time"
//               value={time}
//               onChange={(e) => setTime(e.target.value)}
//               max={maxTime}
//               required
//             />
//           </label>
//         </div>

//         {/* value inputs */}
//         <div className="form-row">
//           <label>
//             Cholesterol
//             <input
//               type="number"
//               value={cholesterol}
//               onChange={(e) => setCholesterol(e.target.value)}
//               placeholder="<200"
//               required
//             />
//           </label>
//           <label>
//             HDL
//             <input
//               type="number"
//               value={hdl}
//               onChange={(e) => setHdl(e.target.value)}
//               placeholder=">40"
//               required
//             />
//           </label>
//           <label>
//             LDL
//             <input
//               type="number"
//               value={ldl}
//               onChange={(e) => setLdl(e.target.value)}
//               placeholder="<130"
//               required
//             />
//           </label>
//         </div>

//         <div className="form-row">
//           <label>
//             Triglycerides
//             <input
//               type="number"
//               value={triglycerides}
//               onChange={(e) => setTriglycerides(e.target.value)}
//               placeholder="<150"
//               required
//             />
//           </label>
//           <label>
//             VLDL (opt)
//             <input
//               type="number"
//               value={vldl}
//               onChange={(e) => setVldl(e.target.value)}
//               placeholder="5–40"
//             />
//           </label>
//         </div>

//         <button type="submit">Add</button>
//       </form>

//       {/* You can render your records table below, using the minValue/maxValue from each row */}
//     </div>
//   );
// };

// export default LipidProfile;

// 2ACCORDING TO AGE AND GENDER
// src/screens/BloodCP.js (shared Lipid Profile logic)
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/Rft.css";
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

const getParamRange = (parameter, gender, age) => {
  switch (parameter) {
    case "Cholesterol":
      return { min: 0, max: 200 };
    case "HDL":
      return { min: gender === "Female" ? 50 : 40, max: Infinity };
    case "LDL":
      return { min: 0, max: 130 };
    case "Triglycerides":
      return { min: 0, max: 150 };
    case "VLDL":
      return { min: 5, max: 40 };
    default:
      return { min: null, max: null };
  }
};

export default function LipidProfile() {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db, saveDatabase } = useDatabase();

  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [maxTime, setMaxTime] = useState(getNowTime());

  const [cholesterol, setCholesterol] = useState("");
  const [hdl, setHdl] = useState("");
  const [ldl, setLdl] = useState("");
  const [triglycerides, setTriglycerides] = useState("");
  const [vldl, setVldl] = useState("");
  const [records, setRecords] = useState([]);

  const testName = "LipidProfile";

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
    } else {
      setMaxTime("23:59");
    }
  }, [date, time]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (![cholesterol, hdl, ldl, triglycerides].every((v) => v !== "")) {
      return alert("Please fill all fields.");
    }
    const ts = new Date(`${date}T${time}`);
    if (ts > new Date()) return alert("Cannot record future date/time");

    const age = getAge(profile.dob);
    const entries = [
      {
        parameter: "Cholesterol",
        value: parseFloat(cholesterol),
        unit: "mg/dL",
      },
      { parameter: "HDL", value: parseFloat(hdl), unit: "mg/dL" },
      { parameter: "LDL", value: parseFloat(ldl), unit: "mg/dL" },
      {
        parameter: "Triglycerides",
        value: parseFloat(triglycerides),
        unit: "mg/dL",
      },
    ];
    const vldlValue = vldl
      ? parseFloat(vldl)
      : parseFloat((triglycerides / 5).toFixed(2));
    entries.push({ parameter: "VLDL", value: vldlValue, unit: "mg/dL" });

    db.exec("BEGIN TRANSACTION;");
    const stmt = db.prepare(
      `INSERT INTO LabReports
         (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let e of entries) {
      const { min, max } = getParamRange(e.parameter, profile.gender, age);
      const refStr = `${min}-${max === Infinity ? "∞" : max}`;
      if (e.value < min || e.value > max) {
        if (
          !window.confirm(
            `⚠️ ${e.parameter} value ${e.value} ${e.unit} is out of range for ${
              profile.gender
            }, age ${age}\n(Normal: ${min}–${
              max === Infinity ? "∞" : max
            }). Continue?`
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
          referenceValue: `${min}-${max === Infinity ? "∞" : max}`,
          minValue: min,
          maxValue: max,
          date,
          time,
        };
      }),
      ...prev,
    ]);

    setCholesterol("");
    setHdl("");
    setLdl("");
    setTriglycerides("");
    setVldl("");
    setDate(getToday());
    setTime(getNowTime());
    alert("Lipid Profile saved successfully.");
  };

  if (!profile) return <p>Select a profile first.</p>;

  return (
    <div className="rftContainer">
      <h2>
        Lipid Profile for {profile.name} ({profile.gender}, Age{" "}
        {getAge(profile.dob) ?? "--"})
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

        {["Cholesterol", "HDL", "LDL", "Triglycerides", "VLDL"].map((param) => {
          const stateMap = {
            Cholesterol: cholesterol,
            HDL: hdl,
            LDL: ldl,
            Triglycerides: triglycerides,
            VLDL: vldl,
          };
          const setterMap = {
            Cholesterol: setCholesterol,
            HDL: setHdl,
            LDL: setLdl,
            Triglycerides: setTriglycerides,
            VLDL: setVldl,
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
                placeholder={`${placeholder.min}-${
                  placeholder.max === Infinity ? "∞" : placeholder.max
                }`}
                value={stateMap[param]}
                onChange={(e) => setterMap[param](e.target.value)}
                required={param !== "VLDL"}
              />
            </div>
          );
        })}

        <button type="submit" className="submit-button">
          Add Lipid Profile
        </button>
      </form>
    </div>
  );
}
