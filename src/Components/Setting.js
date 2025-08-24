// import React, { useState, useEffect } from "react";
// import useDatabase from "../Components/useDatabase";
// import { useNavigate } from "react-router-dom";

// const vitalList = [
//   { key: "BloodPressure", label: "Blood Pressure" },
//   { key: "Temperature", label: "Temperature" },
//   { key: "HeartRate", label: "Heart Rate" },
//   { key: "BreathingRate", label: "Breathing Rate" },
// ];

// const initialState = {
//   BloodPressure: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     // abnormalTestsPerDay: "",
//   },
//   Temperature: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     //abnormalTestsPerDay: "",
//   },
//   HeartRate: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     // abnormalTestsPerDay: "",
//   },
//   BreathingRate: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     //abnormalTestsPerDay: "",
//   },
// };

// function Settings() {
//   const [form, setForm] = useState(initialState);
//   const { db, saveDatabase } = useDatabase();
//   const navigate = useNavigate();

//   // Load settings from DB on mount
//   useEffect(() => {
//     if (!db) return;
//     const loaded = { ...initialState };
//     try {
//       const stmt = db.prepare("SELECT * FROM Settings");
//       while (stmt.step()) {
//         const row = stmt.getAsObject();
//         const vital = row.vitalName;
//         const gender = row.gender;
//         if (loaded[vital] && loaded[vital][gender]) {
//           loaded[vital][gender].min =
//             row.minValue !== null ? String(row.minValue) : "";
//           loaded[vital][gender].max =
//             row.maxValue !== null ? String(row.maxValue) : "";
//           // loaded[vital].abnormalTestsPerDay =
//           //   row.abnormalTestsPerDay !== null
//           //     ? String(row.abnormalTestsPerDay)
//           // : "";
//         }
//       }
//       stmt.free();
//       setForm(loaded);
//     } catch (err) {
//       // If error, just use initialState
//       setForm(initialState);
//     }
//   }, [db]);

//   const handleChange = (vital, gender, field, value) => {
//     setForm((prev) => ({
//       ...prev,
//       [vital]: {
//         ...prev[vital],
//         [gender]: {
//           ...prev[vital][gender],
//           [field]: value,
//         },
//       },
//     }));
//   };

//   // const handleAbnormalChange = (vital, value) => {
//   //   setForm((prev) => ({
//   //     ...prev,
//   //     [vital]: {
//   //       ...prev[vital],
//   //       abnormalTestsPerDay: value,
//   //     },
//   //   }));
//   // };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Validation
//     for (const { key: vital, label } of vitalList) {
//       for (const gender of ["male", "female"]) {
//         const min = parseFloat(form[vital][gender].min);
//         const max = parseFloat(form[vital][gender].max);
//         // const abnormal = parseInt(form[vital].abnormalTestsPerDay, 10);
//         if (isNaN(min) || isNaN(max)) {
//           alert(`${label} (${gender}): Please enter both min and max values.`);
//           return;
//         }
//         if (max < min) {
//           alert(
//             `${label} (${gender}): Max value cannot be less than min value.`
//           );
//           return;
//         }
//         if (max === min) {
//           alert(`${label} (${gender}): Min and max values cannot be equal.`);
//           return;
//         }
//         // if (isNaN(abnormal) || abnormal <= 0) {
//         //   alert(`${label}: Abnormal tests per day must be greater than 0.`);
//         //   return;
//         // }
//       }
//     }
//     if (!db) {
//       alert("Database is not initialized yet. Please try again.");
//       return;
//     }
//     try {
//       db.exec("BEGIN TRANSACTION;");
//       vitalList.forEach(({ key: vital }) => {
//         ["male", "female"].forEach((gender) => {
//           const minValue = parseFloat(form[vital][gender].min);
//           const maxValue = parseFloat(form[vital][gender].max);
//           // const abnormalTestsPerDay = parseInt(
//           //   form[vital].abnormalTestsPerDay,
//           //   10
//           // );
//           // Check if row exists
//           const checkStmt = db.prepare(
//             `SELECT id FROM Settings WHERE vitalName = ? AND gender = ?`
//           );
//           checkStmt.bind([vital, gender]);
//           let rowId = null;
//           if (checkStmt.step()) {
//             rowId = checkStmt.getAsObject().id;
//           }
//           checkStmt.free();
//           if (rowId) {
//             // Update
//             const updateStmt = db.prepare(
//               `UPDATE Settings SET minValue = ?, maxValue = ?, abnormalTestsPerDay = ? WHERE id = ?`
//             );
//             // updateStmt.run([minValue, maxValue, abnormalTestsPerDay, rowId]);
//             updateStmt.run([minValue, maxValue, rowId]);
//             updateStmt.free();
//           } else {
//             // Insert
//             const insertStmt = db.prepare(
//               `INSERT INTO Settings (vitalName, gender, minValue, maxValue, abnormalTestsPerDay) VALUES (?, ?, ?, ?, ?)`
//             );
//             insertStmt.run([
//               vital,
//               gender,
//               minValue,
//               maxValue,
//               //abnormalTestsPerDay,
//             ]);
//             insertStmt.free();
//           }
//         });
//       });
//       db.exec("COMMIT;");
//       saveDatabase();
//       alert("Settings saved!");
//       navigate(-1);
//     } catch (err) {
//       db.exec("ROLLBACK;");
//       alert("Failed to save settings: " + err.message);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
//       <h2>Settings</h2>
//       <form onSubmit={handleSubmit}>
//         {vitalList.map(({ key: vital, label }) => (
//           <div
//             key={vital}
//             style={{
//               marginBottom: 24,
//               border: "1px solid #ccc",
//               padding: 16,
//               borderRadius: 8,
//             }}
//           >
//             <h3>{label}</h3>
//             {["male", "female"].map((gender) => (
//               <div key={gender} style={{ marginBottom: 12 }}>
//                 <strong style={{ textTransform: "capitalize" }}>
//                   {gender}
//                 </strong>
//                 <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
//                   <label>
//                     Min:
//                     <input
//                       type="number"
//                       value={form[vital][gender].min}
//                       onChange={(e) =>
//                         handleChange(vital, gender, "min", e.target.value)
//                       }
//                       style={{ marginLeft: 4, width: 80 }}
//                       required
//                     />
//                   </label>
//                   <label>
//                     Max:
//                     <input
//                       type="number"
//                       value={form[vital][gender].max}
//                       onChange={(e) =>
//                         handleChange(vital, gender, "max", e.target.value)
//                       }
//                       style={{ marginLeft: 4, width: 80 }}
//                       required
//                     />
//                   </label>
//                 </div>
//               </div>
//             ))}
//             {/* <div style={{ marginTop: 12 }}>
//               <label>
//                 Abnormal tests per day:
//                 <input
//                   type="number"
//                   value={form[vital].abnormalTestsPerDay}
//                   onChange={(e) => handleAbnormalChange(vital, e.target.value)}
//                   style={{ marginLeft: 8, width: 100 }}
//                   required
//                 />
//               </label>
//             </div> */}
//           </div>
//         ))}
//         <button type="submit" style={{ padding: "8px 24px", fontSize: 16 }}>
//           Save Settings
//         </button>
//       </form>
//     </div>
//   );
// }

// export default Settings;

// import React, { useState, useEffect } from "react";
// import useDatabase from "../Components/useDatabase";
// import { useNavigate } from "react-router-dom";
// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
// } from "recharts";

// const vitalList = [
//   { key: "BloodPressure", label: "Blood Pressure" },
//   { key: "Temperature", label: "Temperature" },
//   { key: "HeartRate", label: "Heart Rate" },
//   { key: "BreathingRate", label: "Breathing Rate" },
// ];

// const initialState = {
//   BloodPressure: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     abnormalTestsPerDay: "",
//   },
//   Temperature: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     abnormalTestsPerDay: "",
//   },
//   HeartRate: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     abnormalTestsPerDay: "",
//   },
//   BreathingRate: {
//     male: { min: "", max: "" },
//     female: { min: "", max: "" },
//     abnormalTestsPerDay: "",
//   },
// };

// function Settings() {
//   const [form, setForm] = useState(initialState);
//   const [showGraph, setShowGraph] = useState(false);
//   const { db, saveDatabase } = useDatabase();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!db) return;
//     const loaded = { ...initialState };
//     try {
//       const stmt = db.prepare("SELECT * FROM Settings");
//       while (stmt.step()) {
//         const row = stmt.getAsObject();
//         const vital = row.vitalName;
//         const gender = row.gender;
//         if (loaded[vital] && loaded[vital][gender]) {
//           loaded[vital][gender].min =
//             row.minValue != null ? String(row.minValue) : "";
//           loaded[vital][gender].max =
//             row.maxValue != null ? String(row.maxValue) : "";
//           loaded[vital].abnormalTestsPerDay =
//             row.abnormalTestsPerDay != null
//               ? String(row.abnormalTestsPerDay)
//               : "";
//         }
//       }
//       stmt.free();
//       setForm(loaded);
//     } catch {
//       setForm(initialState);
//     }
//   }, [db]);

//   const handleChange = (vital, gender, field, value) => {
//     setForm((prev) => ({
//       ...prev,
//       [vital]: {
//         ...prev[vital],
//         [gender]: { ...prev[vital][gender], [field]: value },
//       },
//     }));
//   };

//   const handleAbnormalChange = (vital, value) => {
//     setForm((prev) => ({
//       ...prev,
//       [vital]: { ...prev[vital], abnormalTestsPerDay: value },
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Validation
//     for (const { key: vital, label } of vitalList) {
//       for (const gender of ["male", "female"]) {
//         const min = parseFloat(form[vital][gender].min);
//         const max = parseFloat(form[vital][gender].max);
//         const abnormal = parseInt(form[vital].abnormalTestsPerDay, 10);
//         if (isNaN(min) || isNaN(max)) {
//           alert(`${label} (${gender}): Please enter both min and max values.`);
//           return;
//         }
//         if (max < min) {
//           alert(
//             `${label} (${gender}): Max value cannot be less than min value.`
//           );
//           return;
//         }
//         if (max === min) {
//           alert(`${label} (${gender}): Min and max values cannot be equal.`);
//           return;
//         }
//         if (isNaN(abnormal) || abnormal <= 0) {
//           alert(`${label}: Abnormal tests per day must be greater than 0.`);
//           return;
//         }
//       }
//     }
//     if (!db) {
//       alert("Database is not initialized yet. Please try again.");
//       return;
//     }
//     try {
//       db.exec("BEGIN TRANSACTION;");
//       vitalList.forEach(({ key: vital }) => {
//         ["male", "female"].forEach((gender) => {
//           const minValue = parseFloat(form[vital][gender].min);
//           const maxValue = parseFloat(form[vital][gender].max);
//           const abnormalTestsPerDay = parseInt(
//             form[vital].abnormalTestsPerDay,
//             10
//           );
//           const checkStmt = db.prepare(
//             `SELECT id FROM Settings WHERE vitalName = ? AND gender = ?`
//           );
//           checkStmt.bind([vital, gender]);
//           let rowId = null;
//           if (checkStmt.step()) rowId = checkStmt.getAsObject().id;
//           checkStmt.free();
//           if (rowId) {
//             const updateStmt = db.prepare(
//               `UPDATE Settings SET minValue = ?, maxValue = ?, abnormalTestsPerDay = ? WHERE id = ?`
//             );
//             updateStmt.run([minValue, maxValue, abnormalTestsPerDay, rowId]);
//             updateStmt.free();
//           } else {
//             const insertStmt = db.prepare(
//               `INSERT INTO Settings (vitalName, gender, minValue, maxValue, abnormalTestsPerDay) VALUES (?, ?, ?, ?, ?)`
//             );
//             insertStmt.run([
//               vital,
//               gender,
//               minValue,
//               maxValue,
//               abnormalTestsPerDay,
//             ]);
//             insertStmt.free();
//           }
//         });
//       });
//       db.exec("COMMIT;");
//       saveDatabase();
//       alert("Settings saved!");
//       setShowGraph(true);
//     } catch (err) {
//       db.exec("ROLLBACK;");
//       alert("Failed to save settings: " + err.message);
//     }
//   };

//   // Prepare chart data
//   const chartData = vitalList.map(({ key, label }) => ({
//     vital: label,
//     maleRange:
//       form[key].male.min && form[key].male.max
//         ? parseFloat(form[key].male.max) - parseFloat(form[key].male.min)
//         : 0,
//     femaleRange:
//       form[key].female.min && form[key].female.max
//         ? parseFloat(form[key].female.max) - parseFloat(form[key].female.min)
//         : 0,
//     abnormal: parseInt(form[key].abnormalTestsPerDay, 10) || 0,
//   }));

//   return (
//     <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
//       <h2>Settings</h2>
//       <form onSubmit={handleSubmit}>
//         {vitalList.map(({ key: vital, label }) => (
//           <div
//             key={vital}
//             style={{
//               marginBottom: 24,
//               border: "1px solid #ccc",
//               padding: 16,
//               borderRadius: 8,
//             }}
//           >
//             <h3>{label}</h3>
//             {["male", "female"].map((gender) => (
//               <div key={gender} style={{ marginBottom: 12 }}>
//                 <strong style={{ textTransform: "capitalize" }}>
//                   {gender}
//                 </strong>
//                 <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
//                   <label>
//                     Min:
//                     <input
//                       type="number"
//                       value={form[vital][gender].min}
//                       onChange={(e) =>
//                         handleChange(vital, gender, "min", e.target.value)
//                       }
//                       style={{ marginLeft: 4, width: 80 }}
//                       required
//                     />
//                   </label>
//                   <label>
//                     Max:
//                     <input
//                       type="number"
//                       value={form[vital][gender].max}
//                       onChange={(e) =>
//                         handleChange(vital, gender, "max", e.target.value)
//                       }
//                       style={{ marginLeft: 4, width: 80 }}
//                       required
//                     />
//                   </label>
//                 </div>
//               </div>
//             ))}
//             <div style={{ marginTop: 12 }}>
//               <label>
//                 Abnormal tests per day:
//                 <input
//                   type="number"
//                   value={form[vital].abnormalTestsPerDay}
//                   onChange={(e) => handleAbnormalChange(vital, e.target.value)}
//                   style={{ marginLeft: 8, width: 100 }}
//                   required
//                 />
//               </label>
//             </div>
//           </div>
//         ))}
//         <button type="submit" style={{ padding: "8px 24px", fontSize: 16 }}>
//           Save Settings
//         </button>
//       </form>

//       {showGraph && (
//         <div style={{ marginTop: 40 }}>
//           <h3>Vitals Overview</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart
//               data={chartData}
//               margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//             >
//               <XAxis dataKey="vital" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="maleRange" name="Male Range" />
//               <Bar dataKey="femaleRange" name="Female Range" />
//               <Bar dataKey="abnormal" name="Abnormal/Day" fill="red" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Settings;

// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";

// // List of vitals/tests to configure
// const VITALS = [
//   "BloodPressure",
//   "HeartRate",
//   "Temperature",
//   // add more as needed
// ];

// export default function SettingsScreen() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db, saveDatabase } = useDatabase();

//   // State shape: { [vitalName]: { male: {min,max}, female: {min,max}, abnormal } }
//   const [settings, setSettings] = useState(() => {
//     const init = {};
//     VITALS.forEach((v) => {
//       init[v] = {
//         male: { min: "", max: "" },
//         female: { min: "", max: "" },
//         abnormal: "",
//       };
//     });
//     return init;
//   });
//   const [savedSettings, setSavedSettings] = useState(null);
//   const [message, setMessage] = useState("");

//   // Load existing settings
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const cfg = {};
//     VITALS.forEach((v) => {
//       cfg[v] = {
//         male: { min: "", max: "" },
//         female: { min: "", max: "" },
//         abnormal: "",
//       };
//     });
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue, abnormalTestsPerDay } =
//         stmt.getAsObject();
//       if (!cfg[vitalName]) continue;
//       cfg[vitalName][gender] = {
//         min: minValue.toString(),
//         max: maxValue.toString(),
//       };
//       cfg[vitalName].abnormal = abnormalTestsPerDay.toString();
//     }
//     stmt.free();
//     setSettings(cfg);
//   }, [db]);

//   // Handle input change
//   const handleChange = (vital, gender, field, value) => {
//     setSettings((prev) => ({
//       ...prev,
//       [vital]: {
//         ...prev[vital],
//         [gender]: {
//           ...prev[vital][gender],
//           [field]: value,
//         },
//         abnormal: prev[vital].abnormal,
//       },
//     }));
//   };
//   const handleAbnormalChange = (vital, value) => {
//     setSettings((prev) => ({
//       ...prev,
//       [vital]: { ...prev[vital], abnormal: value },
//     }));
//   };

//   // Prevent rendering until defaults set
//   if (VITALS.some((v) => !settings[v])) {
//     return <div>Loading settings...</div>;
//   }

//   // Save settings to DB
//   const onSubmit = (e) => {
//     e.preventDefault();
//     if (!db) return;
//     db.run("DELETE FROM Settings");
//     VITALS.forEach((vital) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[vital][gender];
//         const abnormal = settings[vital].abnormal;
//         if (min !== "" && max !== "" && abnormal !== "") {
//           db.run(
//             `INSERT INTO Settings (vitalName, gender, minValue, maxValue, abnormalTestsPerDay) VALUES (?,?,?,?,?)`,
//             [vital, gender, Number(min), Number(max), Number(abnormal)]
//           );
//         }
//       });
//     });
//     saveDatabase();

//     // Show confirmation and display saved settings
//     setSavedSettings(settings);
//     setMessage("Settings saved successfully.");
//   };

//   // Prepare chart data once savedSettings exists
//   const rangeChartData = savedSettings
//     ? VITALS.map((vital) => ({
//         vital,
//         maleMin: Number(savedSettings[vital].male.min),
//         maleMax: Number(savedSettings[vital].male.max),
//         femaleMin: Number(savedSettings[vital].female.min),
//         femaleMax: Number(savedSettings[vital].female.max),
//       }))
//     : [];

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Configure Normal Ranges & Alerts</h2>
//       <form onSubmit={onSubmit}>
//         {VITALS.map((vital) => {
//           const cfg = settings[vital];
//           return (
//             <fieldset
//               key={vital}
//               style={{ marginBottom: 16, border: "1px solid #ccc", padding: 8 }}
//             >
//               <legend>{vital}</legend>
//               <div style={{ display: "flex", gap: 16 }}>
//                 {["male", "female"].map((gender) => (
//                   <div key={gender}>
//                     <h4>{gender.charAt(0).toUpperCase() + gender.slice(1)}</h4>
//                     <label>
//                       Min:
//                       <input
//                         type="number"
//                         value={cfg[gender].min}
//                         onChange={(e) =>
//                           handleChange(vital, gender, "min", e.target.value)
//                         }
//                       />
//                     </label>
//                     <br />
//                     <label>
//                       Max:
//                       <input
//                         type="number"
//                         value={cfg[gender].max}
//                         onChange={(e) =>
//                           handleChange(vital, gender, "max", e.target.value)
//                         }
//                       />
//                     </label>
//                   </div>
//                 ))}
//                 <div>
//                   <h4>Abnormal Count</h4>
//                   <label>
//                     Times per day:
//                     <input
//                       type="number"
//                       value={cfg.abnormal}
//                       onChange={(e) =>
//                         handleAbnormalChange(vital, e.target.value)
//                       }
//                     />
//                   </label>
//                 </div>
//               </div>
//             </fieldset>
//           );
//         })}
//         <button type="submit">Save Settings</button>
//         <button
//           type="button"
//           onClick={() => navigate(-1)}
//           style={{ marginLeft: 8 }}
//         >
//           Back
//         </button>
//       </form>

//       {/* Confirmation and saved output */}
//       {message && <p style={{ color: "green" }}>{message}</p>}
//       {savedSettings && (
//         <div style={{ marginTop: 20 }}>
//           <h3>Saved Configuration:</h3>
//           {VITALS.map((vital) => {
//             const cfg = savedSettings[vital];
//             return (
//               <div key={vital} style={{ marginBottom: 8 }}>
//                 <strong>{vital}:</strong>
//                 <div>
//                   Male: {cfg.male.min} - {cfg.male.max}
//                 </div>
//                 <div>
//                   Female: {cfg.female.min} - {cfg.female.max}
//                 </div>
//                 <div>Abnormal threshold/day: {cfg.abnormal}</div>
//               </div>
//             );
//           })}

//           {/* Range chart */}
//           <div style={{ height: 300, marginTop: 20 }}>
//             <h3>Normal Ranges Chart</h3>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart
//                 data={rangeChartData}
//                 margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="vital" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="maleMin" name="Male Min" />
//                 <Line type="monotone" dataKey="maleMax" name="Male Max" />
//                 <Line type="monotone" dataKey="femaleMin" name="Female Min" />
//                 <Line type="monotone" dataKey="femaleMax" name="Female Max" />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

//code sahi tha restriction nai thi null value b save kar raha tha
// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";

// // Lists of parameters to configure
// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["LFT", "RFT", "Hemoglobin"];
// const ALL_TESTS = [...VITALS, ...LAB_TESTS];

// export default function SettingsScreen() {
//   const navigate = useNavigate();
//   const { db, saveDatabase } = useDatabase();

//   // shape: { [test]: { male:{min,max}, female:{min,max}, abnormal } }
//   const [settings, setSettings] = useState(() => {
//     const init = {};
//     ALL_TESTS.forEach((t) => {
//       init[t] = {
//         male: { min: "", max: "" },
//         female: { min: "", max: "" },
//         abnormal: "",
//       };
//     });
//     return init;
//   });
//   const [savedSettings, setSavedSettings] = useState(null);
//   const [message, setMessage] = useState("");

//   // load existing
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const cfg = {};
//     ALL_TESTS.forEach((t) => {
//       cfg[t] = {
//         male: { min: "", max: "" },
//         female: { min: "", max: "" },
//         abnormal: "",
//       };
//     });
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue, abnormalTestsPerDay } =
//         stmt.getAsObject();
//       if (!cfg[vitalName]) continue;
//       cfg[vitalName][gender] = {
//         min: minValue.toString(),
//         max: maxValue.toString(),
//       };
//       cfg[vitalName].abnormal = abnormalTestsPerDay.toString();
//     }
//     stmt.free();
//     setSettings(cfg);
//   }, [db]);

//   // input
//   const handleChange = (test, gender, field, value) => {
//     setSettings((prev) => ({
//       ...prev,
//       [test]: {
//         ...prev[test],
//         [gender]: { ...prev[test][gender], [field]: value },
//         abnormal: prev[test].abnormal,
//       },
//     }));
//   };
//   const handleAbnormal = (test, value) => {
//     setSettings((prev) => ({
//       ...prev,
//       [test]: { ...prev[test], abnormal: value },
//     }));
//   };

//   // save
//   const onSubmit = (e) => {
//     e.preventDefault();
//     if (!db) return;
//     db.run("DELETE FROM Settings");
//     ALL_TESTS.forEach((test) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[test][gender];
//         const abnormal = settings[test].abnormal;
//         if (min !== "" && max !== "" && abnormal !== "") {
//           db.run(
//             `INSERT INTO Settings (vitalName, gender, minValue, maxValue, abnormalTestsPerDay) VALUES (?,?,?,?,?)`,
//             [test, gender, Number(min), Number(max), Number(abnormal)]
//           );
//         }
//       });
//     });
//     saveDatabase();
//     setSavedSettings(settings);
//     setMessage("Settings saved successfully.");
//   };

//   // chart data for all tests
//   const chartData = savedSettings
//     ? ALL_TESTS.map((t) => ({
//         test: t,
//         maleMin: Number(savedSettings[t].male.min),
//         maleMax: Number(savedSettings[t].male.max),
//         femaleMin: Number(savedSettings[t].female.min),
//         femaleMax: Number(savedSettings[t].female.max),
//       }))
//     : [];

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Configure Ranges & Alerts (Vitals & Lab Tests)</h2>
//       <form onSubmit={onSubmit}>
//         {ALL_TESTS.map((test) => (
//           <fieldset
//             key={test}
//             style={{ marginBottom: 16, border: "1px solid #ccc", padding: 8 }}
//           >
//             <legend>{test}</legend>
//             <div style={{ display: "flex", gap: 16 }}>
//               {["male", "female"].map((gender) => (
//                 <div key={gender}>
//                   <h4>{gender.charAt(0).toUpperCase() + gender.slice(1)}</h4>
//                   <label>
//                     Min:
//                     <input
//                       type="number"
//                       value={settings[test][gender].min}
//                       onChange={(e) =>
//                         handleChange(test, gender, "min", e.target.value)
//                       }
//                     />
//                   </label>
//                   <br />
//                   <label>
//                     Max:
//                     <input
//                       type="number"
//                       value={settings[test][gender].max}
//                       onChange={(e) =>
//                         handleChange(test, gender, "max", e.target.value)
//                       }
//                     />
//                   </label>
//                 </div>
//               ))}
//               {/* <div>
//                 <h4>Abnormal Count/day</h4>
//                 <input
//                   type="number"
//                   value={settings[test].abnormal}
//                   onChange={(e) => handleAbnormal(test, e.target.value)}
//                 />
//               </div> */}
//             </div>
//           </fieldset>
//         ))}
//         <button type="submit">Save Settings</button>
//         <button
//           type="button"
//           onClick={() => navigate(-1)}
//           style={{ marginLeft: 8 }}
//         >
//           Back
//         </button>
//       </form>

//       {message && <p style={{ color: "green" }}>{message}</p>}
//       {/* {savedSettings && (
//         <div style={{ marginTop: 20 }}>
//           <h3>Saved Configuration</h3>
//           {ALL_TESTS.map((t) => (
//             <div key={t} style={{ marginBottom: 8 }}>
//               <strong>{t}:</strong> Male [{savedSettings[t].male.min}-
//               {savedSettings[t].male.max}], Female [
//               {savedSettings[t].female.min}-{savedSettings[t].female.max}],
//               Alert after {savedSettings[t].abnormal} anomalies/day
//             </div>
//           ))}
//           {/* <h3 style={{ marginTop: 20 }}>Ranges Chart</h3>
//           <div style={{ height: 300 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart
//                 data={chartData}
//                 margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="test" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="maleMin" name="Male Min" />
//                 <Line type="monotone" dataKey="maleMax" name="Male Max" />
//                 <Line type="monotone" dataKey="femaleMin" name="Female Min" />
//                 <Line type="monotone" dataKey="femaleMax" name="Female Max" />
//               </LineChart>
//             </ResponsiveContainer>
//           </div> */}
//       {/* </div>
//       )} } */}
//     </div>
//   );
// }

//-----------------------------------------------------------------perfect code
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";

// // Parameters to configure
// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["LFT", "RFT", "Hemoglobin"];
// const ALL_TESTS = [...VITALS, ...LAB_TESTS];

// export default function SettingsScreen() {
//   const navigate = useNavigate();
//   const { db, saveDatabase } = useDatabase();
//   const [settings, setSettings] = useState(() =>
//     ALL_TESTS.reduce(
//       (acc, t) => ({
//         ...acc,
//         [t]: { male: { min: "", max: "" }, female: { min: "", max: "" } },
//       }),
//       {}
//     )
//   );

//   // load existing values
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const loaded = { ...settings };
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       loaded[vitalName][gender] = {
//         min: String(minValue),
//         max: String(maxValue),
//       };
//     }
//     stmt.free();
//     setSettings(loaded);
//   }, [db]);

//   const handleChange = (test, gender, field, value) =>
//     setSettings((prev) => ({
//       ...prev,
//       [test]: {
//         ...prev[test],
//         [gender]: { ...prev[test][gender], [field]: value },
//       },
//     }));

//   const onSubmit = (e) => {
//     e.preventDefault();
//     if (!db) return;

//     // validation: all fields filled and min < max
//     for (const test of ALL_TESTS) {
//       for (const gender of ["male", "female"]) {
//         const { min, max } = settings[test][gender];
//         if (!min || !max) {
//           alert(
//             "Please enter both Min and Max values for " +
//               test +
//               " (" +
//               gender +
//               ")."
//           );
//           return;
//         }
//         if (Number(min) >= Number(max)) {
//           alert(
//             "Please ensure Min is less than Max for " +
//               test +
//               " (" +
//               gender +
//               ")."
//           );
//           return;
//         }
//       }
//     }

//     db.run("DELETE FROM Settings");
//     ALL_TESTS.forEach((test) =>
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[test][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [test, gender, Number(min), Number(max)]
//         );
//       })
//     );
//     saveDatabase();
//     alert("Settings saved successfully.");
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Configure Ranges</h2>
//       <form onSubmit={onSubmit}>
//         {ALL_TESTS.map((test) => (
//           <fieldset key={test} style={{ marginBottom: 16, padding: 8 }}>
//             <legend>{test}</legend>
//             <div style={{ display: "flex", gap: 16 }}>
//               {["male", "female"].map((gender) => (
//                 <div key={gender}>
//                   <h4>{gender.charAt(0).toUpperCase() + gender.slice(1)}</h4>
//                   {["min", "max"].map((field) => (
//                     <label
//                       key={field}
//                       style={{ display: "block", margin: "4px 0" }}
//                     >
//                       {field.charAt(0).toUpperCase() + field.slice(1)}:
//                       <input
//                         type="number"
//                         value={settings[test][gender][field]}
//                         onChange={(e) =>
//                           handleChange(test, gender, field, e.target.value)
//                         }
//                       />
//                     </label>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           </fieldset>
//         ))}
//         <button type="submit">Save</button>
//       </form>
//     </div>
//   );
// }

//wasai save rakha code agar graph ya table ki form ma show karwana hwa to ya code chalana ha
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";

// // Parameters to configure
// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["LFT", "RFT", "Hemoglobin"];
// const ALL_TESTS = [...VITALS, ...LAB_TESTS];

// export default function SettingsScreen() {
//   const navigate = useNavigate();
//   const { db, saveDatabase } = useDatabase();

//   // form values
//   const [settings, setSettings] = useState(() =>
//     ALL_TESTS.reduce(
//       (acc, t) => ({
//         ...acc,
//         [t]: { male: { min: "", max: "" }, female: { min: "", max: "" } },
//       }),
//       {}
//     )
//   );
//   // store last saved settings for display
//   const [savedSettings, setSavedSettings] = useState(null);

//   // load existing values
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const loaded = {};
//     ALL_TESTS.forEach(t => (loaded[t] = { male: { min: "", max: "" }, female: { min: "", max: "" } }));
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       loaded[vitalName][gender] = {
//         min: String(minValue),
//         max: String(maxValue),
//       };
//     }
//     stmt.free();
//     setSettings(loaded);
//   }, [db]);

//   const handleChange = (test, gender, field, value) =>
//     setSettings(prev => ({
//       ...prev,
//       [test]: {
//         ...prev[test],
//         [gender]: { ...prev[test][gender], [field]: value },
//       },
//     }));

//   const onSubmit = e => {
//     e.preventDefault();
//     if (!db) return;
//     // validation
//     for (const test of ALL_TESTS) {
//       for (const gender of ["male", "female"]) {
//         const { min, max } = settings[test][gender];
//         if (!min || !max) {
//           alert(`Please enter both Min and Max values for ${test} (${gender}).`);
//           return;
//         }
//         if (Number(min) >= Number(max)) {
//           alert(`Please ensure Min is less than Max for ${test} (${gender}).`);
//           return;
//         }
//       }
//     }
//     // save
//     db.run("DELETE FROM Settings");
//     ALL_TESTS.forEach(test =>
//       ["male", "female"].forEach(gender => {
//         const { min, max } = settings[test][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [test, gender, Number(min), Number(max)]
//         );
//       })
//     );
//     saveDatabase();
//     alert("Settings saved successfully.");
//     setSavedSettings(settings);
//   };

//   // prepare data for chart
//   const chartData = savedSettings
//     ? ALL_TESTS.map(test => ({
//         test,
//         maleMin: Number(savedSettings[test].male.min),
//         maleMax: Number(savedSettings[test].male.max),
//         femaleMin: Number(savedSettings[test].female.min),
//         femaleMax: Number(savedSettings[test].female.max),
//       }))
//     : [];

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Configure Ranges</h2>
//       <form onSubmit={onSubmit}>
//         {ALL_TESTS.map(test => (
//           <fieldset key={test} style={{ marginBottom: 16, padding: 8 }}>
//             <legend>{test}</legend>
//             <div style={{ display: "flex", gap: 16 }}>
//               {["male", "female"].map(gender => (
//                 <div key={gender}>
//                   <h4>{gender.charAt(0).toUpperCase() + gender.slice(1)}</h4>
//                   {["min", "max"].map(field => (
//                     <label key={field} style={{ display: "block", margin: "4px 0" }}>
//                       {field.charAt(0).toUpperCase() + field.slice(1)}:
//                       <input
//                         type="number"
//                         value={settings[test][gender][field]}
//                         onChange={e => handleChange(test, gender, field, e.target.value)}
//                       />
//                     </label>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           </fieldset>
//         ))}
//         <button type="submit">Save</button>
//         <button type="button" onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
//           Back
//         </button>
//       </form>

//       {savedSettings && (
//         <div style={{ marginTop: 32 }}>
//           <h3>Saved Settings Table</h3>
//           <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 <th>Test</th>
//                 <th>Male Min</th>
//                 <th>Male Max</th>
//                 <th>Female Min</th>
//                 <th>Female Max</th>
//               </tr>
//             </thead>
//             <tbody>
//               {ALL_TESTS.map(test => (
//                 <tr key={test}>
//                   <td>{test}</td>
//                   <td>{savedSettings[test].male.min}</td>
//                   <td>{savedSettings[test].male.max}</td>
//                   <td>{savedSettings[test].female.min}</td>
//                   <td>{savedSettings[test].female.max}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           <h3 style={{ marginTop: 24 }}>Ranges Chart</h3>
//           <div style={{ height: 300 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="test" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="maleMin" name="Male Min" />
//                 <Line type="monotone" dataKey="maleMax" name="Male Max" />
//                 <Line type="monotone" dataKey="femaleMin" name="Female Min" />
//                 <Line type="monotone" dataKey="femaleMax" name="Female Max" />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

//************************************************************dropdown code */
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";

// // Parameters to configure
// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["Blood Cp", "TFT", "LFT"];
// const LAB_PARAMS = {
//   "Blood Cp": ["Haemoglobin", "RBC", "WBC"],
//   TFT: ["T3", "T4", "TSH"],
//   LFT: ["Indirect Bilirubin", "Direct Bilirubin", "Total Bilirubin"],
// };

// export default function SettingsScreen() {
//   const navigate = useNavigate();
//   const { db, saveDatabase } = useDatabase();

//   const [selectedLabTest, setSelectedLabTest] = useState(LAB_TESTS[0]);

//   // initialize settings
//   const initialSettings = React.useMemo(
//     () => ({
//       ...VITALS.reduce(
//         (acc, test) => ({
//           ...acc,
//           [test]: { male: { min: "", max: "" }, female: { min: "", max: "" } },
//         }),
//         {}
//       ),
//       ...LAB_TESTS.reduce(
//         (acc, test) => ({
//           ...acc,
//           [test]: LAB_PARAMS[test].reduce(
//             (pAcc, param) => ({
//               ...pAcc,
//               [param]: {
//                 male: { min: "", max: "" },
//                 female: { min: "", max: "" },
//               },
//             }),
//             {}
//           ),
//         }),
//         {}
//       ),
//     }),
//     []
//   );

//   const [settings, setSettings] = useState(initialSettings);

//   // load values
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const loaded = JSON.parse(JSON.stringify(initialSettings));
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       if (VITALS.includes(vitalName)) {
//         loaded[vitalName][gender] = {
//           min: String(minValue),
//           max: String(maxValue),
//         };
//       } else if (vitalName.includes("-")) {
//         const [test, param] = vitalName.split("-");
//         if (loaded[test] && loaded[test][param]) {
//           loaded[test][param][gender] = {
//             min: String(minValue),
//             max: String(maxValue),
//           };
//         }
//       }
//     }
//     stmt.free();
//     setSettings(loaded);
//   }, [db, initialSettings]);

//   // update vitals
//   const handleVitalChange = (test, gender, field, value) => {
//     setSettings((prev) => ({
//       ...prev,
//       [test]: {
//         ...prev[test],
//         [gender]: {
//           ...prev[test][gender],
//           [field]: value,
//         },
//       },
//     }));
//   };

//   const onSubmit = (e) => {
//     e.preventDefault();
//     if (!db) return;

//     // validate vitals
//     for (const test of VITALS) {
//       for (const gender of ["male", "female"]) {
//         const { min, max } = settings[test][gender];
//         if (!min || !max) return alert(`Enter Min/Max for ${test} (${gender})`);
//         if (Number(min) >= Number(max))
//           return alert(`Min must be < Max for ${test}`);
//       }
//     }
//     // validate labs
//     for (const param of LAB_PARAMS[selectedLabTest]) {
//       for (const gender of ["male", "female"]) {
//         const { min, max } = settings[selectedLabTest][param][gender];
//         if (!min || !max) return alert(`Enter Min/Max for ${param}`);
//         if (Number(min) >= Number(max))
//           return alert(`Min must be < Max for ${param}`);
//       }
//     }

//     // save
//     db.run("DELETE FROM Settings");
//     VITALS.forEach((test) =>
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[test][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [test, gender, Number(min), Number(max)]
//         );
//       })
//     );
//     LAB_PARAMS[selectedLabTest].forEach((param) =>
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[selectedLabTest][param][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [`${selectedLabTest}-${param}`, gender, Number(min), Number(max)]
//         );
//       })
//     );
//     saveDatabase();
//     alert("Settings saved successfully.");
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Configure Ranges</h2>
//       <form onSubmit={onSubmit}>
//         {/* Vitals */}
//         {VITALS.map((test) => (
//           <fieldset key={test} style={{ marginBottom: 16, padding: 8 }}>
//             <legend>{test}</legend>
//             <div style={{ display: "flex", gap: 16 }}>
//               {["male", "female"].map((gender) => (
//                 <div key={gender}>
//                   <h4>{gender.charAt(0).toUpperCase() + gender.slice(1)}</h4>
//                   {["min", "max"].map((field) => (
//                     <label
//                       key={field}
//                       style={{ display: "block", margin: "4px 0" }}
//                     >
//                       {field.charAt(0).toUpperCase() + field.slice(1)}:
//                       <input
//                         type="number"
//                         value={settings[test][gender][field]}
//                         onChange={(e) =>
//                           handleVitalChange(test, gender, field, e.target.value)
//                         }
//                       />
//                     </label>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           </fieldset>
//         ))}

//         {/* Lab selector */}
//         <div style={{ marginBottom: 16 }}>
//           <label>
//             Select Lab Test:&nbsp;
//             <select
//               value={selectedLabTest}
//               onChange={(e) => setSelectedLabTest(e.target.value)}
//             >
//               {LAB_TESTS.map((test) => (
//                 <option key={test} value={test}>
//                   {test}
//                 </option>
//               ))}
//             </select>
//           </label>
//         </div>

//         {/* Lab params */}
//         <fieldset style={{ marginBottom: 16, padding: 8 }}>
//           <legend>{selectedLabTest}</legend>
//           {LAB_PARAMS[selectedLabTest].map((param) => (
//             <div key={param} style={{ marginBottom: 12 }}>
//               <h4>{param}</h4>
//               <div style={{ display: "flex", gap: 16 }}>
//                 {["male", "female"].map((gender) => (
//                   <div key={gender}>
//                     {["min", "max"].map((field) => (
//                       <label
//                         key={field}
//                         style={{ display: "block", margin: "4px 0" }}
//                       >
//                         {field.charAt(0).toUpperCase() + field.slice(1)}:
//                         <input
//                           type="number"
//                           value={
//                             settings[selectedLabTest][param][gender][field]
//                           }
//                           onChange={(e) =>
//                             setSettings((prev) => ({
//                               ...prev,
//                               [selectedLabTest]: {
//                                 ...prev[selectedLabTest],
//                                 [param]: {
//                                   ...prev[selectedLabTest][param],
//                                   [gender]: {
//                                     ...prev[selectedLabTest][param][gender],
//                                     [field]: e.target.value,
//                                   },
//                                 },
//                               },
//                             }))
//                           }
//                         />
//                       </label>
//                     ))}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </fieldset>

//         <button type="submit">Save</button>
//       </form>
//     </div>
//   );
// }
// **********************************************8more simple code correct
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";

// // Constants
// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["Blood Cp", "TFT", "LFT"];
// const LAB_PARAMS = {
//   "Blood Cp": ["Haemoglobin", "RBC", "WBC"],
//   TFT: ["T3", "T4", "TSH"],
//   LFT: ["Indirect Bilirubin", "Direct Bilirubin", "Total Bilirubin"],
// };

// export default function SettingsScreen() {
//   const navigate = useNavigate();
//   const { db, saveDatabase } = useDatabase();

//   // State holds values like { BloodPressure: { male: {min, max}, female: {...} }, TFT: { T3: {...}, ... } }
//   const [settings, setSettings] = useState({});
//   const [selectedLab, setSelectedLab] = useState(LAB_TESTS[0]);

//   // Initialize blank structure on mount
//   useEffect(() => {
//     const init = {};
//     VITALS.forEach((test) => {
//       init[test] = { male: { min: "", max: "" }, female: { min: "", max: "" } };
//     });
//     LAB_TESTS.forEach((test) => {
//       init[test] = {};
//       LAB_PARAMS[test].forEach((param) => {
//         init[test][param] = {
//           male: { min: "", max: "" },
//           female: { min: "", max: "" },
//         };
//       });
//     });
//     setSettings(init);
//   }, []);

//   // Load saved settings
//   useEffect(() => {
//     if (!db || Object.keys(settings).length === 0) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const loaded = { ...settings };
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       // vitals: name matches directly
//       if (loaded[vitalName] && loaded[vitalName][gender]) {
//         loaded[vitalName][gender] = {
//           min: String(minValue),
//           max: String(maxValue),
//         };
//       } else {
//         // labs: key is "Test-Param"
//         const [test, param] = vitalName.split("-");
//         if (loaded[test] && loaded[test][param]) {
//           loaded[test][param][gender] = {
//             min: String(minValue),
//             max: String(maxValue),
//           };
//         }
//       }
//     }
//     stmt.free();
//     setSettings(loaded);
//   }, [db, settings]);

//   // Handle input changes for any test/param/gender/field
//   const handleChange = (
//     test,
//     paramOrGender,
//     genderOrField,
//     fieldOrValue,
//     maybeValue
//   ) => {
//     // Determine if it's a vital or lab parameter by checking structure
//     const isVital = VITALS.includes(test);
//     setSettings((prev) => {
//       const copy = { ...prev };
//       if (isVital) {
//         // handleChange(test, gender, field, value)
//         const gender = paramOrGender;
//         const field = genderOrField; // "min" or "max"
//         const value = fieldOrValue;
//         copy[test] = {
//           ...prev[test],
//           [gender]: { ...prev[test][gender], [field]: value },
//         };
//       } else {
//         // handleChange(test, param, gender, field, value)
//         const param = paramOrGender;
//         const gender = genderOrField;
//         const field = fieldOrValue;
//         const value = maybeValue;
//         copy[test] = {
//           ...prev[test],
//           [param]: {
//             ...prev[test][param],
//             [gender]: { ...prev[test][param][gender], [field]: value },
//           },
//         };
//       }
//       return copy;
//     });
//   };

//   const saveSettings = () => {
//     if (!db) return;
//     db.run("DELETE FROM Settings");
//     // Save vitals
//     VITALS.forEach((test) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[test][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [test, gender, Number(min), Number(max)]
//         );
//       });
//     });
//     // Save lab params for selected test
//     LAB_PARAMS[selectedLab].forEach((param) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[selectedLab][param][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [`${selectedLab}-${param}`, gender, Number(min), Number(max)]
//         );
//       });
//     });
//     saveDatabase();
//     alert("Settings saved!");
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Configure Ranges</h2>
//       <div>
//         {VITALS.map((test) => (
//           <div key={test} style={{ marginBottom: 16 }}>
//             <h3>{test}</h3>
//             {["male", "female"].map((gender) => (
//               <div key={gender}>
//                 <strong>{gender}:</strong>
//                 Min:{" "}
//                 <input
//                   type="number"
//                   value={settings[test]?.[gender]?.min || ""}
//                   onChange={(e) =>
//                     handleChange(test, gender, "min", e.target.value)
//                   }
//                 />
//                 Max:{" "}
//                 <input
//                   type="number"
//                   value={settings[test]?.[gender]?.max || ""}
//                   onChange={(e) =>
//                     handleChange(test, gender, "max", e.target.value)
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>

//       <div style={{ margin: "20px 0" }}>
//         <label>
//           Lab Test:
//           <select
//             value={selectedLab}
//             onChange={(e) => setSelectedLab(e.target.value)}
//           >
//             {LAB_TESTS.map((test) => (
//               <option key={test} value={test}>
//                 {test}
//               </option>
//             ))}
//           </select>
//         </label>
//       </div>

//       <div>
//         <h3>{selectedLab} Parameters</h3>
//         {LAB_PARAMS[selectedLab].map((param) => (
//           <div key={param} style={{ marginBottom: 12 }}>
//             <h4>{param}</h4>
//             {["male", "female"].map((gender) => (
//               <div key={gender}>
//                 <strong>{gender}:</strong>
//                 Min:{" "}
//                 <input
//                   type="number"
//                   value={settings[selectedLab]?.[param]?.[gender]?.min || ""}
//                   onChange={(e) =>
//                     handleChange(
//                       selectedLab,
//                       param,
//                       gender,
//                       "min",
//                       e.target.value
//                     )
//                   }
//                 />
//                 Max:{" "}
//                 <input
//                   type="number"
//                   value={settings[selectedLab]?.[param]?.[gender]?.max || ""}
//                   onChange={(e) =>
//                     handleChange(
//                       selectedLab,
//                       param,
//                       gender,
//                       "max",
//                       e.target.value
//                     )
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>

//       <button onClick={saveSettings}>Save Settings</button>
//     </div>
//   );
// }
// __________________________________________________________--better UI issue ya ara tha data delete kar raha tha blood cp dalo tft ka data delete ya issue ara tha
// import React, { useState, useEffect } from "react";

// import useDatabase from "../Components/useDatabase";

// // Constants
// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["Blood Cp", "TFT", "LFT"];
// const LAB_PARAMS = {
//   "Blood Cp": [
//     "Haemoglobin(g/dL)",
//     "RBC(mil/mm3)",
//     "WBC(/mm3)",
//     "Plateletts(/mm3)",
//     "HCT(%)",
//   ],
//   TFT: ["T3(ng/mL)", "T4(μg/dL)", "TSH(μIU/mL)"],
//   LFT: [
//     "Indirect Bilirubin(mg/dL)",
//     "Direct Bilirubin(mg/dL)",
//     "Total Bilirubin(mg/dL)",
//     "Alkaline Phosphatase(IU/L)",
//     "Gamma(IU/L)",
//     "AST(IU/L)",
//     "ALT(IU/L)",
//   ],
// };

// export default function SettingsScreen() {
//   const { db, saveDatabase } = useDatabase();

//   const [settings, setSettings] = useState({});
//   const [selectedLab, setSelectedLab] = useState(LAB_TESTS[0]);

//   // Initialize blank structure on mount
//   useEffect(() => {
//     const init = {};
//     VITALS.forEach((test) => {
//       init[test] = { male: { min: "", max: "" }, female: { min: "", max: "" } };
//     });
//     LAB_TESTS.forEach((test) => {
//       init[test] = {};
//       LAB_PARAMS[test].forEach((param) => {
//         init[test][param] = {
//           male: { min: "", max: "" },
//           female: { min: "", max: "" },
//         };
//       });
//     });
//     setSettings(init);
//   }, []);

//   // Load saved settings
//   useEffect(() => {
//     if (!db || Object.keys(settings).length === 0) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const loaded = JSON.parse(JSON.stringify(settings));
//     console.log("/////", stmt);
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       console.log(stmt.getAsObject());
//       if (loaded[vitalName] && loaded[vitalName][gender]) {
//         loaded[vitalName][gender] = {
//           min: String(minValue),
//           max: String(maxValue),
//         };
//       } else {
//         const [test, param] = vitalName.split("-");
//         if (loaded[test] && loaded[test][param]) {
//           loaded[test][param][gender] = {
//             min: String(minValue),
//             max: String(maxValue),
//           };
//         }
//       }
//     }
//     stmt.free();
//     setSettings(loaded);
//   }, [db]);

//   // Generic change handler
//   const handleChange = (test, key1, key2, key3, maybeValue) => {
//     const isVital = VITALS.includes(test);
//     setSettings((prev) => {
//       const copy = { ...prev };
//       if (isVital) {
//         const gender = key1;
//         const field = key2;
//         const value = key3;
//         copy[test] = {
//           ...prev[test],
//           [gender]: { ...prev[test][gender], [field]: value },
//         };
//       } else {
//         const param = key1;
//         const gender = key2;
//         const field = key3;
//         const value = maybeValue;
//         copy[test] = {
//           ...prev[test],
//           [param]: {
//             ...prev[test][param],
//             [gender]: { ...prev[test][param][gender], [field]: value },
//           },
//         };
//       }
//       return copy;
//     });
//   };

//   // Save to DB with validation
//   const saveSettings = () => {
//     if (!db) return;

//     // Simple check: ensure all vitals and selected lab params have min and max
//     const allFilled =
//       VITALS.every((test) =>
//         ["male", "female"].every(
//           (gender) =>
//             settings[test]?.[gender]?.min !== "" &&
//             settings[test]?.[gender]?.max !== ""
//         )
//       ) &&
//       LAB_PARAMS[selectedLab].every((param) =>
//         ["male", "female"].every(
//           (gender) =>
//             settings[selectedLab]?.[param]?.[gender]?.min !== "" &&
//             settings[selectedLab]?.[param]?.[gender]?.max !== ""
//         )
//       );

//     if (!allFilled) {
//       alert("Please fill all values before saving.");
//       return;
//     }

//     db.run("DELETE FROM Settings");
//     VITALS.forEach((test) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[test][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [test, gender, Number(min), Number(max)]
//         );
//       });
//     });
//     // for lab Test
//     LAB_PARAMS[selectedLab].forEach((param) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[selectedLab][param][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [`${selectedLab}-${param}`, gender, Number(min), Number(max)]
//         );
//       });
//     });
//     saveDatabase();
//     alert("Settings saved!");
//   };

//   // UI Styles
//   const cardStyle = {
//     border: "1px solid #ccc",
//     borderRadius: 4,
//     padding: 12,
//     marginBottom: 20,
//   };
//   const rowStyle = {
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 8,
//   };
//   const labelStyle = { width: 60 };

//   return (
//     <div
//       style={{
//         maxWidth: 800,
//         margin: "0 auto",
//         padding: 20,
//         fontFamily: "Arial, sans-serif",
//       }}
//     >
//       <h2 style={{ textAlign: "center", marginBottom: 24 }}>
//         Configure Ranges
//       </h2>

//       {/* Vitals Section */}
//       <div>
//         {VITALS.map((test) => (
//           <div key={test} style={cardStyle}>
//             <h3 style={{ margin: "0 0 12px" }}>{test}</h3>
//             {["male", "female"].map((gender) => (
//               <div key={gender} style={rowStyle}>
//                 <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
//                   {gender}
//                 </span>
//                 <label style={labelStyle}>Min:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[test]?.[gender]?.min || ""}
//                   onChange={(e) =>
//                     handleChange(test, gender, "min", e.target.value)
//                   }
//                 />
//                 <label style={labelStyle}>Max:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[test]?.[gender]?.max || ""}
//                   onChange={(e) =>
//                     handleChange(test, gender, "max", e.target.value)
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>

//       {/* Lab Selector */}
//       <div style={{ margin: "20px 0", textAlign: "center" }}>
//         <label style={{ marginRight: 8, fontWeight: 600 }}>Lab Test:</label>
//         <select
//           value={selectedLab}
//           onChange={(e) => setSelectedLab(e.target.value)}
//           style={{ padding: 6 }}
//         >
//           {LAB_TESTS.map((test) => (
//             <option key={test} value={test}>
//               {test}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Lab Parameters Section */}
//       <div>
//         {LAB_PARAMS[selectedLab].map((param) => (
//           <div key={param} style={cardStyle}>
//             <h3 style={{ margin: "0 0 12px" }}>{param}</h3>
//             {["male", "female"].map((gender) => (
//               <div key={gender} style={rowStyle}>
//                 <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
//                   {gender}
//                 </span>
//                 <label style={labelStyle}>Min:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[selectedLab]?.[param]?.[gender]?.min || ""}
//                   onChange={(e) =>
//                     handleChange(
//                       selectedLab,
//                       param,
//                       gender,
//                       "min",
//                       e.target.value
//                     )
//                   }
//                 />
//                 <label style={labelStyle}>Max:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[selectedLab]?.[param]?.[gender]?.max || ""}
//                   onChange={(e) =>
//                     handleChange(
//                       selectedLab,
//                       param,
//                       gender,
//                       "max",
//                       e.target.value
//                     )
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>

//       {/* Save Button */}
//       <div style={{ textAlign: "center" }}>
//         <button
//           onClick={saveSettings}
//           style={{
//             padding: "10px 24px",
//             fontSize: 16,
//             cursor: "pointer",
//             borderRadius: 4,
//             border: "none",
//             background: "#007bff",
//             color: "#fff",
//           }}
//         >
//           Save Settings
//         </button>
//       </div>
//     </div>
//   );
// }

//***************************************************************** version 1 blood pressure have not systolic or diastolic value in it

// import React, { useState, useEffect } from "react";

// import useDatabase from "../Components/useDatabase";

// // Constants
// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["Blood Cp", "TFT", "LFT"];
// const LAB_PARAMS = {
//   "Blood Cp": [
//     "Haemoglobin(g/dL)",
//     "RBC(mil/mm3)",
//     "WBC(/mm3)",
//     "Plateletts(/mm3)",
//     "HCT(%)",
//   ],
//   TFT: ["T3(ng/mL)", "T4(μg/dL)", "TSH(μIU/mL)"],
//   LFT: [
//     "Indirect Bilirubin(mg/dL)",
//     "Direct Bilirubin(mg/dL)",
//     "Total Bilirubin(mg/dL)",
//     "Alkaline Phosphatase(IU/L)",
//     "Gamma(IU/L)",
//     "AST(IU/L)",
//     "ALT(IU/L)",
//   ],
// };

// export default function SettingsScreen() {
//   const { db, saveDatabase } = useDatabase();

//   const [settings, setSettings] = useState({});
//   const [selectedLab, setSelectedLab] = useState(LAB_TESTS[0]);

//   // Initialize blank structure on mount
//   useEffect(() => {
//     const init = {};
//     VITALS.forEach((test) => {
//       init[test] = { male: { min: "", max: "" }, female: { min: "", max: "" } };
//     });
//     LAB_TESTS.forEach((test) => {
//       init[test] = {};
//       LAB_PARAMS[test].forEach((param) => {
//         init[test][param] = {
//           male: { min: "", max: "" },
//           female: { min: "", max: "" },
//         };
//       });
//     });
//     setSettings(init);
//   }, []);

//   // Load saved settings
//   useEffect(() => {
//     if (!db || Object.keys(settings).length === 0) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const loaded = JSON.parse(JSON.stringify(settings));
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       if (loaded[vitalName] && loaded[vitalName][gender]) {
//         loaded[vitalName][gender] = {
//           min: String(minValue),
//           max: String(maxValue),
//         };
//       } else {
//         const [test, param] = vitalName.split("-");
//         if (loaded[test] && loaded[test][param]) {
//           loaded[test][param][gender] = {
//             min: String(minValue),
//             max: String(maxValue),
//           };
//         }
//       }
//     }
//     stmt.free();
//     console.log(">>>>>>>>>>>>", loaded);
//     setSettings(loaded);
//   }, [db]);

//   // Generic change handler
//   const handleChange = (test, key1, key2, key3, maybeValue) => {
//     console.log(">>>>>>>>", test);
//     const isVital = VITALS.includes(test);
//     setSettings((prev) => {
//       const copy = { ...prev };
//       if (isVital) {
//         const gender = key1;
//         const field = key2;
//         const value = key3;
//         copy[test] = {
//           ...prev[test],
//           [gender]: { ...prev[test][gender], [field]: value },
//         };
//       } else {
//         const param = key1;
//         const gender = key2;
//         const field = key3;
//         const value = maybeValue;
//         copy[test] = {
//           ...prev[test],
//           [param]: {
//             ...prev[test][param],
//             [gender]: { ...prev[test][param][gender], [field]: value },
//           },
//         };
//       }
//       return copy;
//     });
//   };

//   // ✅ Updated saveSettings
//   const saveSettings = () => {
//     if (!db) return;
//     console.log("Saving vitals:", VITALS);
//     // Check if all required values are filled
//     const allFilled =
//       VITALS.every((test) =>
//         ["male", "female"].every(
//           (gender) =>
//             settings[test]?.[gender]?.min !== "" &&
//             settings[test]?.[gender]?.max !== ""
//         )
//       ) &&
//       LAB_PARAMS[selectedLab].every((param) =>
//         ["male", "female"].every(
//           (gender) =>
//             settings[selectedLab]?.[param]?.[gender]?.min !== "" &&
//             settings[selectedLab]?.[param]?.[gender]?.max !== ""
//         )
//       );

//     if (!allFilled) {
//       alert("Please fill all values before saving.");
//       return;
//     }

//     // Delete only relevant vitals rows
//     VITALS.forEach((test) => {
//       ["male", "female"].forEach((gender) => {
//         db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
//           test,
//           gender,
//         ]);
//       });
//     });

//     // Delete only relevant lab rows for selectedLab
//     LAB_PARAMS[selectedLab].forEach((param) => {
//       ["male", "female"].forEach((gender) => {
//         db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
//           `${selectedLab}-${param}`,
//           gender,
//         ]);
//       });
//     });

//     // Insert vitals
//     VITALS.forEach((test) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[test][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [test, gender, Number(min), Number(max)]
//         );
//       });
//     });

//     // Insert selected lab params
//     LAB_PARAMS[selectedLab].forEach((param) => {
//       ["male", "female"].forEach((gender) => {
//         const { min, max } = settings[selectedLab][param][gender];
//         db.run(
//           "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//           [`${selectedLab}-${param}`, gender, Number(min), Number(max)]
//         );
//       });
//     });

//     saveDatabase();
//     alert("Settings saved!");
//   };

//   // UI Styles
//   const cardStyle = {
//     border: "1px solid #ccc",
//     borderRadius: 4,
//     padding: 12,
//     marginBottom: 20,
//   };
//   const rowStyle = {
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 8,
//   };
//   const labelStyle = { width: 60 };

//   return (
//     <div
//       style={{
//         maxWidth: 800,
//         margin: "0 auto",
//         padding: 20,
//         fontFamily: "Arial, sans-serif",
//       }}
//     >
//       <h2 style={{ textAlign: "center", marginBottom: 24 }}>
//         Configure Ranges
//       </h2>

//       {/* Vitals Section */}
//       <div>
//         {VITALS.map((test) => (
//           <div key={test} style={cardStyle}>
//             <h3 style={{ margin: "0 0 12px" }}>{test}</h3>
//             {["male", "female"].map((gender) => (
//               <div key={gender} style={rowStyle}>
//                 <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
//                   {gender}
//                 </span>
//                 <label style={labelStyle}>Min:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[test]?.[gender]?.min || ""}
//                   onChange={(e) =>
//                     handleChange(test, gender, "min", e.target.value)
//                   }
//                 />
//                 <label style={labelStyle}>Max:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[test]?.[gender]?.max || ""}
//                   onChange={(e) =>
//                     handleChange(test, gender, "max", e.target.value)
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>

//       {/* Lab Selector */}
//       <div style={{ margin: "20px 0", textAlign: "center" }}>
//         <label style={{ marginRight: 8, fontWeight: 600 }}>Lab Test:</label>
//         <select
//           value={selectedLab}
//           onChange={(e) => setSelectedLab(e.target.value)}
//           style={{ padding: 6 }}
//         >
//           {LAB_TESTS.map((test) => (
//             <option key={test} value={test}>
//               {test}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Lab Parameters Section */}
//       <div>
//         {LAB_PARAMS[selectedLab].map((param) => (
//           <div key={param} style={cardStyle}>
//             <h3 style={{ margin: "0 0 12px" }}>{param}</h3>
//             {["male", "female"].map((gender) => (
//               <div key={gender} style={rowStyle}>
//                 <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
//                   {gender}
//                 </span>
//                 <label style={labelStyle}>Min:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[selectedLab]?.[param]?.[gender]?.min || ""}
//                   onChange={(e) =>
//                     handleChange(
//                       selectedLab,
//                       param,
//                       gender,
//                       "min",
//                       e.target.value
//                     )
//                   }
//                 />
//                 <label style={labelStyle}>Max:</label>
//                 <input
//                   type="number"
//                   style={{ flex: 1, padding: 4 }}
//                   value={settings[selectedLab]?.[param]?.[gender]?.max || ""}
//                   onChange={(e) =>
//                     handleChange(
//                       selectedLab,
//                       param,
//                       gender,
//                       "max",
//                       e.target.value
//                     )
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>

//       {/* Save Button */}
//       <div style={{ textAlign: "center" }}>
//         <button
//           onClick={saveSettings}
//           style={{
//             padding: "10px 24px",
//             fontSize: 16,
//             cursor: "pointer",
//             borderRadius: 4,
//             border: "none",
//             background: "#007bff",
//             color: "#fff",
//           }}
//         >
//           Save Settings
//         </button>
//       </div>
//     </div>
//   );
// }

// version 2 blood have systolic and diastolic
// import React, { useState, useEffect, useCallback } from "react";
// import useDatabase from "../Components/useDatabase";

// const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
// const LAB_TESTS = ["Blood Cp", "TFT", "LFT"];
// const LAB_PARAMS = {
//   "Blood Cp": [
//     "Haemoglobin(g/dL)",
//     "RBC(mil/mm3)",
//     "WBC(/mm3)",
//     "Plateletts(/mm3)",
//     "HCT(%)",
//   ],
//   TFT: ["T3(ng/mL)", "T4(μg/dL)", "TSH(μIU/mL)"],
//   LFT: [
//     "Indirect Bilirubin(mg/dL)",
//     "Direct Bilirubin(mg/dL)",
//     "Total Bilirubin(mg/dL)",
//     "Alkaline Phosphatase(IU/L)",
//     "Gamma(IU/L)",
//     "AST(IU/L)",
//     "ALT(IU/L)",
//   ],
// };

// export default function SettingsScreen() {
//   const { db, saveDatabase } = useDatabase();
//   const [settings, setSettings] = useState({});
//   const [selectedLab, setSelectedLab] = useState(LAB_TESTS[0]);

//   const buildEmptySettings = useCallback(() => {
//     const init = {};
//     //Har vital ke liye male/female ka structure banata hai.
//     //BloodPressure special case hai kyunki isme systolic aur diastolic dono hote hain.
//     VITALS.forEach((test) => {
//       if (test === "BloodPressure") {
//         init[test] = {
//           male: {
//             systolic: { min: "", max: "" },
//             diastolic: { min: "", max: "" },
//           },
//           female: {
//             systolic: { min: "", max: "" },
//             diastolic: { min: "", max: "" },
//           },
//         };
//       } else {
//         init[test] = {
//           male: { min: "", max: "" },
//           female: { min: "", max: "" },
//         };
//       }
//     });
//     //Har lab test ke har parameter ke liye male/female min/max banata hai.
//     LAB_TESTS.forEach((test) => {
//       init[test] = {};
//       LAB_PARAMS[test].forEach((param) => {
//         init[test][param] = {
//           male: { min: "", max: "" },
//           female: { min: "", max: "" },
//         };
//       });
//     });
//     //Ye initial blank settings return karta hai.
//     return init;
//   }, []);
//   //Jab component mount hota hai, blank settings set karta hai.
//   useEffect(() => {
//     setSettings(buildEmptySettings());
//   }, [buildEmptySettings]);
//   //Database available hone par data load karega.
//   useEffect(() => {
//     if (!db) return;

//     const loaded = buildEmptySettings();

//     //Database se rows fetch karta hai.
//     const stmt = db.prepare("SELECT * FROM Settings");

//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
//       console.log("}}}}}}}}}}}}}}}}}", stmt.getAsObject());
//       //Null values ko empty string me convert karta hai.
//       //vitalName ko split karke pata lagata hai ki test ka type kya hai (BP, HeartRate, Lab param, etc.)
//       const minStr = minValue == null ? "" : String(minValue);
//       const maxStr = maxValue == null ? "" : String(maxValue);

//       const parts = vitalName.split("-");
//       // Agar parts.length === 1 → simple vital hai (like HeartRate).

//       //Agar parts.length === 2 → ya to BP ka sub-type hoga ya lab parameter.
//       if (parts.length === 1) {
//         const test = parts[0];
//         if (loaded[test] && loaded[test][gender] !== undefined) {
//           loaded[test][gender] = { min: minStr, max: maxStr };
//         }
//       } else if (parts.length === 2) {
//         const test = parts[0];
//         const param = parts[1];
//         //Database se loaded data ko settings me daal deta hai.
//         if (test === "BloodPressure") {
//           if (
//             loaded[test] &&
//             loaded[test][gender] &&
//             loaded[test][gender][param] !== undefined
//           ) {
//             loaded[test][gender][param] = { min: minStr, max: maxStr };
//           }
//         } else {
//           if (
//             loaded[test] &&
//             loaded[test][param] &&
//             loaded[test][param][gender]
//           ) {
//             loaded[test][param][gender] = { min: minStr, max: maxStr };
//           }
//         }
//       }
//     }
//     stmt.free();
//     console.log("<<<<<<<<<<<", loaded);
//     setSettings(loaded);
//   }, [db, buildEmptySettings]);
//   //Check karta hai ki value filled hai ya nahi.
//   const isFilled = (val) => val !== "" && val !== null && val !== undefined;
//   //Validation ke liye missing fields ka array banata hai.

//   //Agar koi bhi min/max empty hai to missing me add karta hai.

//   // Lab aur vitals ka alag logic hai (BP ke liye bhi special handling).
//   const validateSection = (type, name) => {
//     // returns array of missing-field labels (empty array => valid)
//     const missing = [];
//     if (type === "vital") {
//       const test = name;
//       if (test === "BloodPressure") {
//         ["male", "female"].forEach((gender) =>
//           ["systolic", "diastolic"].forEach((bpType) => {
//             const obj = settings?.[test]?.[gender]?.[bpType] || {};
//             if (!isFilled(obj.min)) {
//               missing.push(`${test} - ${gender} - ${bpType} - min`);
//             }
//             if (!isFilled(obj.max)) {
//               missing.push(`${test} - ${gender} - ${bpType} - max`);
//             }
//           })
//         );
//       } else {
//         ["male", "female"].forEach((gender) => {
//           const obj = settings?.[test]?.[gender] || {};
//           if (!isFilled(obj.min)) missing.push(`${test} - ${gender} - min`);
//           if (!isFilled(obj.max)) missing.push(`${test} - ${gender} - max`);
//         });
//       }
//     } else if (type === "lab") {
//       const lab = name;
//       LAB_PARAMS[lab].forEach((param) => {
//         ["male", "female"].forEach((gender) => {
//           const obj = settings?.[lab]?.[param]?.[gender] || {};
//           if (!isFilled(obj.min))
//             missing.push(`${lab} - ${param} - ${gender} - min`);
//           if (!isFilled(obj.max))
//             missing.push(`${lab} - ${param} - ${gender} - max`);
//         });
//       });
//     }
//     return missing;
//   };
//   //Settings ko deep clone karta hai aur update karta hai.
//   //BP, normal vitals, aur labs ka handling alag hai.
//   const handleChange = (test, ...args) => {
//     setSettings((prev) => {
//       const updated = structuredClone(prev);
//       if (test === "BloodPressure") {
//         const [gender, type, field, value] = args;
//         updated[test][gender][type][field] = value;
//       } else if (VITALS.includes(test)) {
//         const [gender, field, value] = args;
//         updated[test][gender][field] = value;
//       } else {
//         const [param, gender, field, value] = args;
//         updated[test][param][gender][field] = value;
//       }
//       return updated;
//     });
//   };
//   //Pehle validation karta hai.
//   //Agar koi field missing hai → alert.
//   const saveSection = (type, name) => {
//     if (!db) return;

//     // validation
//     const missing = validateSection(type, name);
//     if (missing.length > 0) {
//       // show concise alert but also list a few missing items (limit so alert isn't enormous)
//       const listPreview = missing.slice(0, 12).join("\n - ");
//       const more =
//         missing.length > 12 ? `\n - ...and ${missing.length - 12} more` : "";
//       alert(
//         `Please fill all fields before saving.\nMissing fields:\n - ${listPreview}${more}`
//       );
//       return;
//     }

//     // proceed to save (same logic as before)
//     //Data ko database me save karta hai aur alert dikhata hai.
//     if (type === "vital") {
//       const test = name;
//       if (test === "BloodPressure") {
//         ["male", "female"].forEach((gender) =>
//           ["systolic", "diastolic"].forEach((bpType) => {
//             const { min, max } = settings[test][gender][bpType];
//             db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
//               `${test}-${bpType}`,
//               gender,
//             ]);
//             db.run(
//               "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//               [`${test}-${bpType}`, gender, Number(min), Number(max)]
//             );
//           })
//         );
//       } else {
//         ["male", "female"].forEach((gender) => {
//           const { min, max } = settings[test][gender];
//           db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
//             test,
//             gender,
//           ]);
//           db.run(
//             "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//             [test, gender, Number(min), Number(max)]
//           );
//         });
//       }
//     }

//     if (type === "lab") {
//       const lab = name;
//       LAB_PARAMS[lab].forEach((param) => {
//         ["male", "female"].forEach((gender) => {
//           const { min, max } = settings[lab][param][gender];
//           db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
//             `${lab}-${param}`,
//             gender,
//           ]);
//           db.run(
//             "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
//             [`${lab}-${param}`, gender, Number(min), Number(max)]
//           );
//         });
//       });
//     }

//     saveDatabase();
//     alert(`${name} settings saved!`);
//   };
//   //Min/Max number input field.
//   const NumberInput = ({ value, onChange }) => (
//     <input
//       type="number"
//       style={{ flex: 1, padding: 4 }}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//     />
//   );

//   const cardStyle = {
//     border: "1px solid #ccc",
//     borderRadius: 4,
//     padding: 12,
//     marginBottom: 20,
//   };
//   const rowStyle = {
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 8,
//   };
//   const labelStyle = { width: 60 };

//   return (
//     <div
//       style={{
//         maxWidth: 800,
//         margin: "0 auto",
//         padding: 20,
//         fontFamily: "Arial, sans-serif",
//       }}
//     >
//       <h2 style={{ textAlign: "center", marginBottom: 24 }}>
//         Configure Ranges
//       </h2>

//       {VITALS.map((test) => (
//         <div key={test} style={cardStyle}>
//           <h3 style={{ marginBottom: 12 }}>{test}</h3>
//           {["male", "female"].map((gender) =>
//             test === "BloodPressure" ? (
//               ["systolic", "diastolic"].map((type) => (
//                 <div key={`${gender}-${type}`} style={rowStyle}>
//                   <span style={{ fontWeight: 600 }}>
//                     {gender} - {type}
//                   </span>
//                   <label style={labelStyle}>Min:</label>
//                   <NumberInput
//                     value={settings[test]?.[gender]?.[type]?.min || ""}
//                     onChange={(v) => handleChange(test, gender, type, "min", v)}
//                   />
//                   <label style={labelStyle}>Max:</label>
//                   <NumberInput
//                     value={settings[test]?.[gender]?.[type]?.max || ""}
//                     onChange={(v) => handleChange(test, gender, type, "max", v)}
//                   />
//                 </div>
//               ))
//             ) : (
//               <div key={gender} style={rowStyle}>
//                 <span style={{ fontWeight: 600 }}>{gender}</span>
//                 <label style={labelStyle}>Min:</label>
//                 <NumberInput
//                   value={settings[test]?.[gender]?.min || ""}
//                   onChange={(v) => handleChange(test, gender, "min", v)}
//                 />
//                 <label style={labelStyle}>Max:</label>
//                 <NumberInput
//                   value={settings[test]?.[gender]?.max || ""}
//                   onChange={(v) => handleChange(test, gender, "max", v)}
//                 />
//               </div>
//             )
//           )}
//           <button
//             onClick={() => saveSection("vital", test)}
//             style={{ marginTop: 8, padding: "6px 12px" }}
//           >
//             Save {test}
//           </button>
//         </div>
//       ))}

//       <div style={{ margin: "20px 0", textAlign: "center" }}>
//         <label style={{ marginRight: 8, fontWeight: 600 }}>Lab Test:</label>
//         <select
//           value={selectedLab}
//           onChange={(e) => setSelectedLab(e.target.value)}
//           style={{ padding: 6 }}
//         >
//           {LAB_TESTS.map((test) => (
//             <option key={test} value={test}>
//               {test}
//             </option>
//           ))}
//         </select>
//       </div>

//       {LAB_PARAMS[selectedLab].map((param) => (
//         <div key={param} style={cardStyle}>
//           <h3 style={{ marginBottom: 12 }}>{param}</h3>
//           {["male", "female"].map((gender) => (
//             <div key={`${param}-${gender}`} style={rowStyle}>
//               <span style={{ fontWeight: 600 }}>{gender}</span>
//               <label style={labelStyle}>Min:</label>
//               <NumberInput
//                 value={settings[selectedLab]?.[param]?.[gender]?.min || ""}
//                 onChange={(v) =>
//                   handleChange(selectedLab, param, gender, "min", v)
//                 }
//               />
//               <label style={labelStyle}>Max:</label>
//               <NumberInput
//                 value={settings[selectedLab]?.[param]?.[gender]?.max || ""}
//                 onChange={(v) =>
//                   handleChange(selectedLab, param, gender, "max", v)
//                 }
//               />
//             </div>
//           ))}
//         </div>
//       ))}
//       <button
//         onClick={() => saveSection("lab", selectedLab)}
//         style={{ marginTop: 8, padding: "6px 12px" }}
//       >
//         Save {selectedLab}
//       </button>
//     </div>
//   );
// }

// wasai
import React, { useState, useEffect, useCallback } from "react";
import useDatabase from "../Components/useDatabase";

// --- Constants --------------------------------------------------------------
// Lists of vitals and lab tests that the UI will render.
const VITALS = ["BloodPressure", "HeartRate", "Temperature"];
const LAB_TESTS = ["Blood Cp", "TFT", "LFT"];
// For each lab test we list its parameters (used to build inputs)
const LAB_PARAMS = {
  "Blood Cp": [
    "Haemoglobin(g/dL)",
    "RBC(mil/mm3)",
    "WBC(/mm3)",
    "Plateletts(/mm3)",
    "HCT(%)",
  ],
  TFT: ["T3(ng/mL)", "T4(μg/dL)", "TSH(μIU/mL)"],
  LFT: [
    "Indirect Bilirubin(mg/dL)",
    "Direct Bilirubin(mg/dL)",
    "Total Bilirubin(mg/dL)",
    "Alkaline Phosphatase(IU/L)",
    "Gamma(IU/L)",
    "AST(IU/L)",
    "ALT(IU/L)",
  ],
};

// Age groups we support. The special 'all' key denotes "applies to all ages".
// These strings are used verbatim as suffixes in the DB (e.g. `HeartRate::19-45`).
const AGE_GROUPS = ["all", "0-1", "1-12", "13-18", "19-45", "46-65", "66+"];

// --- Component --------------------------------------------------------------
export default function SettingsScreen() {
  // db & saveDatabase come from your custom hook wrapping the persistent store.
  const { db, saveDatabase } = useDatabase();

  // `settings` holds the in-memory structure the UI binds to. It is
  // nested by test -> ageKey -> param/gender -> { min, max }.
  const [settings, setSettings] = useState({});

  // which lab is selected in the lab dropdown (for the lab section)
  const [selectedLab, setSelectedLab] = useState(LAB_TESTS[0]);

  // remembers the selected age group for each test (so each card keeps its own age)
  const [selectedAgeGroups, setSelectedAgeGroups] = useState({});

  // --- Utility: build initial empty settings skeleton ----------------------
  // This creates the full nested object shape used across the component so
  // bindings are safe even when DB has no rows yet.
  const buildEmptySettings = useCallback(() => {
    const init = {};

    // For each vital, create an entry per age group and gender
    VITALS.forEach((test) => {
      init[test] = {};
      AGE_GROUPS.forEach((ageKey) => {
        if (test === "BloodPressure") {
          // BloodPressure stores systolic & diastolic separately
          init[test][ageKey] = {
            male: {
              systolic: { min: "", max: "" },
              diastolic: { min: "", max: "" },
            },
            female: {
              systolic: { min: "", max: "" },
              diastolic: { min: "", max: "" },
            },
          };
        } else {
          // simple vital with one min/max per gender
          init[test][ageKey] = {
            male: { min: "", max: "" },
            female: { min: "", max: "" },
          };
        }
      });
    });

    // For lab tests: create ageKey -> each parameter -> genders
    LAB_TESTS.forEach((test) => {
      init[test] = {};
      AGE_GROUPS.forEach((ageKey) => {
        init[test][ageKey] = {};
        LAB_PARAMS[test].forEach((param) => {
          init[test][ageKey][param] = {
            male: { min: "", max: "" },
            female: { min: "", max: "" },
          };
        });
      });
    });

    return init;
  }, []);

  // --- Initial setup: create skeleton and default selected ages ------------
  useEffect(() => {
    const empty = buildEmptySettings();
    setSettings(empty);

    // set default age selection to 'all' for every test/lab
    const ageMap = {};
    VITALS.concat(LAB_TESTS).forEach((t) => (ageMap[t] = "all"));
    setSelectedAgeGroups(ageMap);
  }, [buildEmptySettings]);

  // --- Central DB loader --------------------------------------------------
  // Pulls all rows from Settings and merges into the skeleton built above.
  const loadSettings = useCallback(() => {
    if (!db) return; // DB not ready yet

    const loaded = buildEmptySettings(); // start from a fresh skeleton

    const stmt = db.prepare("SELECT * FROM Settings");

    while (stmt.step()) {
      const { vitalName, gender, minValue, maxValue } = stmt.getAsObject();
      //console.log("LLLLL", stmt.getAsObject());
      // convert null to empty string so UI shows empty input
      const minStr = minValue == null ? "" : String(minValue);
      const maxStr = maxValue == null ? "" : String(maxValue);

      // support names like "HeartRate::19-45" or "Blood Cp-RBC(...)::66+".
      // If there's no "::" we treat the row as the legacy `all` group.
      let ageKey = "all";
      let namePart = vitalName;
      if (vitalName.includes("::")) {
        const parts = vitalName.split("::");
        namePart = parts[0];
        ageKey = parts[1] || "all";
      }

      // namePart typically looks like: "HeartRate" or "BloodPressure-systolic" or "Blood Cp-RBC(mil/mm3)"
      const parts = namePart.split("-");

      if (parts.length === 1) {
        // simple vital (HeartRate, Temperature)
        const test = parts[0];
        if (loaded[test] && loaded[test][ageKey] !== undefined) {
          loaded[test][ageKey][gender] = { min: minStr, max: maxStr };
        }
      } else if (parts.length === 2) {
        // parameterized entry (either BloodPressure-systolic or Lab-Parameter)
        const test = parts[0];
        const param = parts[1];

        if (test === "BloodPressure") {
          // BloodPressure has nested systolic/diastolic objects
          if (
            loaded[test] &&
            loaded[test][ageKey] &&
            loaded[test][ageKey][gender] &&
            loaded[test][ageKey][gender][param] !== undefined
          ) {
            loaded[test][ageKey][gender][param] = { min: minStr, max: maxStr };
          }
        } else {
          // labs: test is e.g. "Blood Cp" and param is the specific lab parameter
          if (
            loaded[test] &&
            loaded[test][ageKey] &&
            loaded[test][ageKey][param] &&
            loaded[test][ageKey][param][gender] !== undefined
          ) {
            loaded[test][ageKey][param][gender] = { min: minStr, max: maxStr };
          }
        }
      }
    }
    stmt.free();

    // replace UI state with merged DB + skeleton
    setSettings(loaded);
    console.log("LOADED", loaded);
  }, [db, buildEmptySettings]);

  // call loader whenever DB becomes available
  useEffect(() => {
    loadSettings();
  }, [db, loadSettings]);

  // --- Small helpers ------------------------------------------------------
  // checks whether a field is filled (not empty/null/undefined)
  const isFilled = (val) => val !== "" && val !== null && val !== undefined;

  // Validate the currently selected age-group only. Returns an array of errors
  // (empty => valid). This enforces numeric min/max and min <= max.
  const validateSection = (type, name, ageKey) => {
    const missing = [];

    const pushMinMaxCheck = (label, min, max) => {
      if (!isFilled(min)) missing.push(`${label} - min`);
      if (!isFilled(max)) missing.push(`${label} - max`);
      // if both present, check numeric and ordering
      if (isFilled(min) && isFilled(max)) {
        const nmin = Number(min);
        const nmax = Number(max);
        if (!isFinite(nmin) || !isFinite(nmax)) {
          missing.push(`${label} - values must be numeric`);
        } else if (nmin > nmax) {
          missing.push(`${label} - min should be <= max`);
        }
      }
    };

    if (type === "vital") {
      const test = name;
      if (test === "BloodPressure") {
        // check systolic & diastolic for both genders
        ["male", "female"].forEach((gender) =>
          ["systolic", "diastolic"].forEach((bpType) => {
            const obj = settings?.[test]?.[ageKey]?.[gender]?.[bpType] || {};
            pushMinMaxCheck(
              `${test} - ${ageKey} - ${gender} - ${bpType}`,
              obj.min,
              obj.max
            );
          })
        );
      } else {
        // check simple vital for both genders
        ["male", "female"].forEach((gender) => {
          const obj = settings?.[test]?.[ageKey]?.[gender] || {};
          pushMinMaxCheck(`${test} - ${ageKey} - ${gender}`, obj.min, obj.max);
        });
      }
    } else if (type === "lab") {
      // iterate lab parameters and genders
      const lab = name;
      LAB_PARAMS[lab].forEach((param) => {
        ["male", "female"].forEach((gender) => {
          const obj = settings?.[lab]?.[ageKey]?.[param]?.[gender] || {};
          pushMinMaxCheck(
            `${lab} - ${ageKey} - ${param} - ${gender}`,
            obj.min,
            obj.max
          );
        });
      });
    }

    return missing;
  };

  // Update settings in memory when an input changes. We use structuredClone to
  // produce a deep copy, mutate it, and set state. This keeps React state immutable.
  const handleChange = (test, ageKey, ...args) => {
    setSettings((prev) => {
      const updated = structuredClone(prev);
      if (test === "BloodPressure") {
        const [gender, type, field, value] = args; // e.g. ("male","systolic","min","120")
        updated[test][ageKey][gender][type][field] = value;
      } else if (VITALS.includes(test)) {
        const [gender, field, value] = args; // e.g. ("female","min","36.5")
        updated[test][ageKey][gender][field] = value;
      } else {
        // lab: (param, gender, field, value)
        const [param, gender, field, value] = args;
        updated[test][ageKey][param][gender][field] = value;
      }
      return updated;
    });
  };

  // --- Save to DB ---------------------------------------------------------
  // Saves only the currently selected ageKey for the given section. Important:
  // we only delete the exact age-specific row before inserting so other age
  // groups and legacy rows are preserved.
  const saveSection = (type, name, ageKey) => {
    if (!db) return;

    // validation — only for the selected age group
    const missing = validateSection(type, name, ageKey);
    if (missing.length > 0) {
      const listPreview = missing.slice(0, 12).join("-");
      const more =
        missing.length > 12
          ? `
 - ...and ${missing.length - 12} more`
          : "";
      alert(
        `Please fix the following before saving (age group: ${ageKey}):
 - ${listPreview}${more}`
      );
      return;
    }

    if (type === "vital") {
      const test = name;
      if (test === "BloodPressure") {
        // for both genders and systolic/diastolic create names like
        // `BloodPressure-systolic::19-45` then insert values
        ["male", "female"].forEach((gender) =>
          ["systolic", "diastolic"].forEach((bpType) => {
            const { min, max } = settings[test][ageKey][gender][bpType];
            const nameWithAge = `${test}-${bpType}::${ageKey}`;
            // remove any existing row for this exact ageKey/gender (keeps other rows intact)
            db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
              nameWithAge,
              gender,
            ]);
            db.run(
              "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
              [nameWithAge, gender, Number(min), Number(max)]
            );
          })
        );
      } else {
        // simple vitals (HeartRate, Temperature) example name: `HeartRate::19-45`
        ["male", "female"].forEach((gender) => {
          const { min, max } = settings[test][ageKey][gender];
          const nameWithAge = `${test}::${ageKey}`;

          db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
            nameWithAge,
            gender,
          ]);
          db.run(
            "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
            [nameWithAge, gender, Number(min), Number(max)]
          );
        });
      }
    }

    if (type === "lab") {
      const lab = name;
      // each lab parameter becomes e.g. `Blood Cp-RBC(mil/mm3)::19-45`
      LAB_PARAMS[lab].forEach((param) => {
        ["male", "female"].forEach((gender) => {
          const { min, max } = settings[lab][ageKey][param][gender];
          const nameWithAge = `${lab}-${param}::${ageKey}`;

          db.run("DELETE FROM Settings WHERE vitalName = ? AND gender = ?", [
            nameWithAge,
            gender,
          ]);
          db.run(
            "INSERT INTO Settings (vitalName, gender, minValue, maxValue) VALUES (?,?,?,?)",
            [nameWithAge, gender, Number(min), Number(max)]
          );
        });
      });
    }

    // persist DB and notify user
    saveDatabase();
    alert(`${name} settings saved for age group: ${ageKey}!`);

    // re-read DB so UI shows what is actually stored (keeps other age groups visible)
    loadSettings();
  };

  // --- Simple numeric input component ------------------------------------
  const NumberInput = ({ value, onChange }) => (
    <input
      type="number"
      style={{ flex: 1, padding: 4 }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  // --- Styling helpers (inline styles for simplicity) ---------------------
  const cardStyle = {
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  };
  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  };
  const labelStyle = { width: 60 };

  // --- Render ------------------------------------------------------------
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Configure Ranges
      </h2>

      {/* Render each vital's card */}
      {VITALS.map((test) => (
        <div key={test} style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ marginBottom: 12 }}>{test}</h3>
            <div>
              <label style={{ marginRight: 8, fontWeight: 600 }}>Age:</label>
              {/* Age dropdown — each test remembers its selection in selectedAgeGroups */}
              <select
                value={selectedAgeGroups[test]}
                onChange={(e) =>
                  setSelectedAgeGroups((prev) => ({
                    ...prev,
                    [test]: e.target.value,
                  }))
                }
                style={{ padding: 6 }}
              >
                {AGE_GROUPS.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag === "all" ? "All ages" : ag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* inputs per gender; BloodPressure has systolic & diastolic rows */}
          {["male", "female"].map((gender) =>
            test === "BloodPressure" ? (
              ["systolic", "diastolic"].map((type) => (
                <div
                  key={`${test}-${selectedAgeGroups[test]}-${gender}-${type}`}
                  style={rowStyle}
                >
                  <span style={{ fontWeight: 600 }}>
                    {gender} - {type}
                  </span>
                  <label style={labelStyle}>Min:</label>
                  <NumberInput
                    value={
                      settings[test]?.[selectedAgeGroups[test]]?.[gender]?.[
                        type
                      ]?.min || ""
                    }
                    onChange={(v) =>
                      handleChange(
                        test,
                        selectedAgeGroups[test],
                        gender,
                        type,
                        "min",
                        v
                      )
                    }
                  />
                  <label style={labelStyle}>Max:</label>
                  <NumberInput
                    value={
                      settings[test]?.[selectedAgeGroups[test]]?.[gender]?.[
                        type
                      ]?.max || ""
                    }
                    onChange={(v) =>
                      handleChange(
                        test,
                        selectedAgeGroups[test],
                        gender,
                        type,
                        "max",
                        v
                      )
                    }
                  />
                </div>
              ))
            ) : (
              <div
                key={`${test}-${selectedAgeGroups[test]}-${gender}`}
                style={rowStyle}
              >
                <span style={{ fontWeight: 600 }}>{gender}</span>
                <label style={labelStyle}>Min:</label>
                <NumberInput
                  value={
                    settings[test]?.[selectedAgeGroups[test]]?.[gender]?.min ||
                    ""
                  }
                  onChange={(v) =>
                    handleChange(
                      test,
                      selectedAgeGroups[test],
                      gender,
                      "min",
                      v
                    )
                  }
                />
                <label style={labelStyle}>Max:</label>
                <NumberInput
                  value={
                    settings[test]?.[selectedAgeGroups[test]]?.[gender]?.max ||
                    ""
                  }
                  onChange={(v) =>
                    handleChange(
                      test,
                      selectedAgeGroups[test],
                      gender,
                      "max",
                      v
                    )
                  }
                />
              </div>
            )
          )}

          <button
            onClick={() => saveSection("vital", test, selectedAgeGroups[test])}
            style={{ marginTop: 8, padding: "6px 12px" }}
          >
            SAVE {test}
            Save {test} (age:{" "}
            {selectedAgeGroups[test] === "all"
              ? "All"
              : selectedAgeGroups[test]}
            )
          </button>
        </div>
      ))}

      {/* Lab selector + inputs for chosen lab */}
      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <label style={{ marginRight: 8, fontWeight: 600 }}>Lab Test:</label>
        <select
          value={selectedLab}
          onChange={(e) => setSelectedLab(e.target.value)}
          style={{ padding: 6 }}
        >
          {LAB_TESTS.map((test) => (
            <option key={test} value={test}>
              {test}
            </option>
          ))}
        </select>
        <div>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Age:</label>
          <select
            value={selectedAgeGroups[selectedLab]}
            onChange={(e) =>
              setSelectedAgeGroups((prev) => ({
                ...prev,
                [selectedLab]: e.target.value,
              }))
            }
            style={{ padding: 6 }}
          >
            {AGE_GROUPS.map((ag) => (
              <option key={ag} value={ag}>
                {ag === "all" ? "All ages" : ag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {LAB_PARAMS[selectedLab].map((param) => (
        <div key={param} style={cardStyle}>
          <h3 style={{ marginBottom: 12 }}>{param}</h3>
          {["male", "female"].map((gender) => (
            <div
              key={`${param}-${selectedAgeGroups[selectedLab]}-${gender}`}
              style={rowStyle}
            >
              <span style={{ fontWeight: 600 }}>{gender}</span>
              <label style={labelStyle}>Min:</label>
              <NumberInput
                value={
                  settings[selectedLab]?.[selectedAgeGroups[selectedLab]]?.[
                    param
                  ]?.[gender]?.min || ""
                }
                onChange={(v) =>
                  handleChange(
                    selectedLab,
                    selectedAgeGroups[selectedLab],
                    param,
                    gender,
                    "min",
                    v
                  )
                }
              />
              <label style={labelStyle}>Max:</label>
              <NumberInput
                value={
                  settings[selectedLab]?.[selectedAgeGroups[selectedLab]]?.[
                    param
                  ]?.[gender]?.max || ""
                }
                onChange={(v) =>
                  handleChange(
                    selectedLab,
                    selectedAgeGroups[selectedLab],
                    param,
                    gender,
                    "max",
                    v
                  )
                }
              />
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={() =>
          saveSection("lab", selectedLab, selectedAgeGroups[selectedLab])
        }
        style={{ marginTop: 8, padding: "6px 12px" }}
      >
        save {selectedLab}
        Save {selectedLab} (age:{" "}
        {selectedAgeGroups[selectedLab] === "all"
          ? "All"
          : selectedAgeGroups[selectedLab]}
        )
      </button>
    </div>
  );
}
