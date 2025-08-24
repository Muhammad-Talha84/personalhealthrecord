// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";

// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   // Raw data
//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);
//   const [settings, setSettings] = useState({});
//   // LabReports filters
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);

//   // Vitals filters
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);

//   // Selected vital for chart / navigation
//   const [selectedVitalType, setSelectedVitalType] = useState(null);

//   // Fetch Vitals from DB
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setVitals(rows);
//   }, [db, profile]);

//   // Fetch LabReports from DB
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setLabReports(rows);
//   }, [db, profile]);
//   // TASK
//   // Fetch Settings
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const cfg = {};
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue, abnormalTestsPerDay } =
//         stmt.getAsObject();
//       if (!cfg[vitalName]) cfg[vitalName] = {};
//       // assume one abnormalTestsPerDay per vital (same for both genders, or pick max)
//       cfg[vitalName].min = cfg[vitalName].min || {};
//       cfg[vitalName].max = cfg[vitalName].max || {};
//       cfg[vitalName].min[gender] = minValue;
//       cfg[vitalName].max[gender] = maxValue;
//       cfg[vitalName].abnormal = abnormalTestsPerDay;
//     }
//     stmt.free();
//     setSettings(cfg);
//   }, [db]);
//   // Compute abnormal counts & alerts & auto-show graph
//   useEffect(() => {
//     if (!vitals.length || !Object.keys(settings).length || !profile) return;
//     const today = new Date().toISOString().split("T")[0];
//     Object.keys(settings).forEach((vitalName) => {
//       const cfg = settings[vitalName];
//       const gender = profile.gender.toLowerCase();
//       const min = cfg.min[gender];
//       const max = cfg.max[gender];
//       const limit = cfg.abnormal;
//       if (min == null || max == null || !limit) return;
//       // count today's abnormal readings
//       const count = vitals.filter(
//         (v) =>
//           v.vitalName === vitalName &&
//           v.date === today &&
//           (Number(v.value) < min || Number(v.value) > max)
//       ).length;
//       if (count > 0 && count < limit) {
//         window.alert(
//           `You have performed ${count}/${limit} abnormal ${vitalName} tests today.`
//         );
//       }
//       if (count >= limit) {
//         setSelectedVitalType(vitalName);
//       }
//     });
//   }, [vitals, settings, profile]);
//   // Group LabReports by testName + date
//   const groupedReports = useMemo(() => {
//     return labReports.reduce((acc, report) => {
//       const key = `${report.testName}-${report.date}`;
//       if (!acc[key]) {
//         acc[key] = {
//           testName: report.testName,
//           date: report.date,
//           time: report.time,
//           reports: [],
//         };
//       }
//       acc[key].reports.push(report);
//       return acc;
//     }, {});
//   }, [labReports]);

//   // Apply LabReports filters
//   const filteredGroupedReports = useMemo(() => {
//     const entries = Object.entries(groupedReports);
//     if (filterDate) {
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === filterDate)
//       );
//     }
//     if (showMostRecent) {
//       const dates = entries.map(([, grp]) => grp.date);
//       if (!dates.length) return {};
//       const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === latest)
//       );
//     }
//     return groupedReports;
//   }, [groupedReports, filterDate, showMostRecent]);

//   // Apply Vitals filters
//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals) {
//       return vitals.filter((v) => v.date === filterDateVitals);
//     }
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   // Prepare data for the line chart of the selected vital
//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({
//         datetime: `${v.date} ${v.time}`,
//         value: Number(v.value),
//       }))
//       .sort(
//         (a, b) =>
//           new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
//       );
//   }, [filteredVitals, selectedVitalType]);

//   // Navigate to Lab Report detail
//   const goToReportDetail = (grp) => {
//     navigate("/reportsdetail", { state: { profile, report: grp, labReports } });
//   };

//   // Navigate to Vital detail or BP screen
//   const handleViewVital = (vital) => {
//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );
//     if (vital.vitalName.toLowerCase() === "bloodpressure") {
//       navigate("/bp", { state: { profile, data: readings } });
//     } else {
//       navigate("/vitaldetail", {
//         state: { profile, type: vital.vitalName, readings },
//       });
//     }
//   };

//   return (
//     <div className="profiledetailContainer">
//       {/* Profile Header */}
//       <div className="details">
//         <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <div className="profile-grid">
//               {[
//                 ["Name", profile.name],
//                 ["Relation", profile.relation],
//                 ["Gender", profile.gender],
//                 ["DOB", profile.dob],
//                 ["Blood Group", profile.bloodGroup],
//                 ["Height", profile.height],
//                 ["Weight", profile.weight],
//               ].map(([label, val]) => (
//                 <div key={label} className="profile-item">
//                   <strong>{label}:</strong> {val}
//                 </div>
//               ))}
//             </div>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       {/* Vitals & Lab Reports */}
//       <div className="dataSections">
//         {/* Vitals Section */}
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           {/* Vitals Filters */}
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Vitals List */}
//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}

//           {/* Vitals Chart */}
//           {/* {selectedVitalType && chartData.length > 0 && (
// //             <div
// //               className="vitalsChart"
// //               style={{ height: 300, marginTop: "2rem" }}
// //             >
// //               <ResponsiveContainer width="100%" height="100%">
// //                 <LineChart data={chartData}>
// //                   <CartesianGrid strokeDasharray="3 3" />
// //                   <XAxis dataKey="datetime" />
// //                   <YAxis />
// //                   <Tooltip />
// //                   <Line
// //                     type="monotone"
// //                     dataKey="value"
// //                     name={selectedVitalType}
// //                     stroke="#8884d8"
// //                     strokeWidth={2}
// //                     dot={{ r: 3 }}
// //                   />
// //                 </LineChart>
// //               </ResponsiveContainer>
// //             </div>
// //           )} */}
//           {/* task ki waja sa upper wala comment kiya wo apna scenario pa work sahi kar raha */}

//           {/* Vitals Chart: auto-shown when selectedVitalType is set by abnormal logic */}
//           {selectedVitalType && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <h3>{selectedVitalType} Trends</h3>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart
//                   data={chartData}
//                   margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//           {/* Vitals Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button>
//             <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button>

//             <button
//               onClick={() => navigate("/settings", { state: { profile } })}
//             >
//               Settings
//             </button>
//           </div>
//         </div>

//         {/* Lab Reports Section */}
//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>

//           {/* Lab Reports Filters */}
//           <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => {
//                 setFilterDate(e.target.value);
//                 setShowMostRecent(false);
//               }}
//             />
//             <button onClick={() => setShowMostRecent(false)}>Search</button>
//             <button
//               onClick={() => {
//                 setShowMostRecent(true);
//                 setFilterDate("");
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDate("");
//                 setShowMostRecent(false);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Lab Reports List */}
//           {Object.keys(filteredGroupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(([key, grp]) => (
//                 <div
//                   key={key}
//                   className="labReportItem"
//                   style={{
//                     cursor: "pointer",
//                     marginBottom: "1rem",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                   }}
//                   onClick={() => goToReportDetail(grp)}
//                 >
//                   <p>
//                     <strong>{grp.testName}</strong>
//                     <br />
//                     <small>
//                       Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
//                     </small>
//                   </p>
//                   {grp.reports.map((r) => (
//                     <p
//                       key={r.id || r.parameter}
//                       style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                     >
//                       {r.parameter}: {r.result} {r.unit || ""}
//                     </p>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Found
//             </p>
//           )}

//           {/* Lab Reports Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>
//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//             <button onClick={() => navigate("/allrep", { state: { profile } })}>
//               All Report
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;

//2
//  ya code b blkl ok ha zarorat hogi iski task ma to uncomment karna ha
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";

// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";
// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   // State for vitals and lab reports
//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);

//   // State for vitals filters
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);

//   // State for lab report filters
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);

//   // For charting vitals
//   const [selectedVitalType, setSelectedVitalType] = useState(null);
//   // For expanding lab test blocks
//   const [expandedTest, setExpandedTest] = useState(null);

//   // Toggle open/closed for a test block
//   const handleToggleTest = (testName) => {
//     setExpandedTest(expandedTest === testName ? null : testName);
//   };

//   // Navigate to graph view for lab reports
//   const goToGraph = (testName, parameter) => {
//     navigate("/graph", {
//       state: { profileName: profile.name, testName, parameter },
//     });
//   };

//   // Fetch Vitals
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       setVitals(rows);
//     } catch (err) {
//       console.error("Error fetching vitals:", err);
//     }
//   }, [db, profile]);

//   // Fetch Lab Reports
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       setLabReports(rows);
//     } catch (err) {
//       console.error("Error fetching lab reports:", err);
//     }
//   }, [db, profile]);

//   // Prepare filtered vitals based on date or most recent flags
//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals)
//       return vitals.filter((v) => v.date === filterDateVitals);
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   // Prepare data for vitals line chart
//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({ datetime: `${v.date} ${v.time}`, value: Number(v.value) }))
//       .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
//   }, [filteredVitals, selectedVitalType]);

//   // Group and filter lab reports
//   const reportsByTest = useMemo(() => {
//     let filtered = labReports;
//     if (filterDate) {
//       filtered = labReports.filter((r) => r.date === filterDate);
//     } else if (showMostRecent) {
//       const dates = Array.from(new Set(labReports.map((r) => r.date)));
//       if (dates.length) {
//         const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//         filtered = labReports.filter((r) => r.date === latest);
//       }
//     }
//     return filtered.reduce((byTest, rpt) => {
//       const { testName, date } = rpt;
//       byTest[testName] = byTest[testName] || {};
//       byTest[testName][date] = byTest[testName][date] || [];
//       byTest[testName][date].push(rpt);
//       return byTest;
//     }, {});
//   }, [labReports, filterDate, showMostRecent]);

//   // Handle navigation for a selected vital
//   const handleViewVital = (vital) => {
//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );
//     if (vital.vitalName.toLowerCase() === "bloodpressure") {
//       navigate("/bp", { state: { profile, data: readings } });
//     } else {
//       navigate("/vitaldetail", {
//         state: { profile, type: vital.vitalName, readings },
//       });
//     }
//   };

//   return (
//     <div className="profiledetailContainer">
//       {/* Profile Details */}
//       <div className="details">
//         <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <div className="profile-grid">
//               <div className="profile-item">
//                 <strong>Name:</strong> {profile.name}
//               </div>
//               <div className="profile-item">
//                 <strong>Relation:</strong> {profile.relation}
//               </div>
//               <div className="profile-item">
//                 <strong>Gender:</strong> {profile.gender}
//               </div>
//               <div className="profile-item">
//                 <strong>DOB:</strong> {profile.dob}
//               </div>
//               <div className="profile-item">
//                 <strong>Blood Group:</strong> {profile.bloodGroup}
//               </div>
//               <div className="profile-item">
//                 <strong>Height:</strong> {profile.height}
//               </div>
//               <div className="profile-item">
//                 <strong>Weight:</strong> {profile.weight}
//               </div>
//             </div>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       {/* Vitals & Lab Reports Sections */}
//       <div className="dataSections">
//         {/* Vitals Section */}
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>
//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}
//           {selectedVitalType && chartData.length > 0 && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button>
//             <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button>
//           </div>
//         </div>

//         {/* Lab Reports Section */}
//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>

//           {/* Filter Controls */}
//           <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => {
//                 setFilterDate(e.target.value);
//                 setShowMostRecent(false);
//               }}
//             />
//             <button onClick={() => setShowMostRecent(false)}>Search</button>
//             <button
//               onClick={() => {
//                 setShowMostRecent(true);
//                 setFilterDate("");
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDate("");
//                 setShowMostRecent(false);
//               }}
//             >
//               Show All
//             </button>
//           </div>
//           {/* for graph */}
//           <div className="labReportsList">
//             {Object.entries(reportsByTest).map(([testName, dateMap]) => {
//               // collect unique parameters across dates
//               const params = Array.from(
//                 new Set(
//                   Object.values(dateMap) // gives array of all report-arrays for each date
//                     .flat() // flattens into one big array of report objects
//                     .map((r) => r.parameter) // picks out the `parameter` field
//                 )
//               );

//               return (
//                 <div key={testName} className="testBlock">
//                   <div
//                     className="labReportItem"
//                     onClick={() => handleToggleTest(testName)}
//                     style={{
//                       cursor: "pointer",
//                       border: "1px solid #ddd",
//                       padding: "8px",
//                     }}
//                   >
//                     <p>
//                       <strong>{testName}</strong>
//                     </p>
//                     <small>
//                       Dates: {Object.keys(dateMap).sort().join(", ")}
//                     </small>
//                   </div>

//                   {expandedTest === testName && (
//                     <div
//                       className="parameterList"
//                       style={{ marginLeft: "1rem", marginTop: "4px" }}
//                     >
//                       {params.map((param) => (
//                         <div
//                           key={param}
//                           className="parameterItem"
//                           onClick={() => goToGraph(testName, param)}
//                           style={{ cursor: "pointer", padding: "4px" }}
//                         >
//                           {param}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>

//           {/* {Object.keys(filteredGroupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(([key, data]) => (
//                 <div
//                   key={key}
//                   className="labReportItem"
//                   style={{
//                     cursor: "pointer",
//                     marginBottom: "1rem",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                   }}
//                   onClick={() => goToReportDetail(data)}
//                 >
//                   <p>
//                     <strong>{data.testName}</strong>
//                     <br />
//                     <small>
//                       Date: {data.date} {data.time && `| Time: ${data.time}`}
//                     </small>
//                   </p>
//                   {data.reports.map((r) => (
//                     <p
//                       key={r.id || r.parameter}
//                       style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                     >
//                       {r.parameter}: {r.result} {r.unit || ""}
//                     </p>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Found
//             </p>
//           )} */}
//           {/* TESTING */}
//           {Object.entries(reportsByTest).map(([testName, dateMap]) => (
//             <div
//               key={testName}
//               className="labReportItem"
//               onClick={() =>
//                 navigate("/reportsdetail", {
//                   state: { profile, testName, dateMap },
//                 })
//               }
//             >
//               <p>
//                 <strong>{testName}</strong>
//                 <br />
//                 <small>Dates: {Object.keys(dateMap).sort().join(", ")}</small>
//               </p>
//             </div>
//           ))}

//           {/* Buttons Section */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>

//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;

// For task report and their parameter show in seperate screen
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";

// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   // Raw data
//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);

//   // LabReports filters
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);

//   // Vitals filters
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);

//   // Selected vital for chart / navigation
//   const [selectedVitalType, setSelectedVitalType] = useState(null);

//   // Fetch Vitals from DB
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setVitals(rows);
//   }, [db, profile]);

//   // Fetch LabReports from DB
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setLabReports(rows);
//   }, [db, profile]);

//   // Group LabReports by testName + date
//   const groupedReports = useMemo(() => {
//     return labReports.reduce((acc, report) => {
//       const key = `${report.testName}-${report.date}`;
//       if (!acc[key]) {
//         acc[key] = {
//           testName: report.testName,
//           date: report.date,
//           time: report.time,
//           reports: [],
//         };
//       }
//       acc[key].reports.push(report);
//       return acc;
//     }, {});
//   }, [labReports]);

//   // Apply LabReports filters
//   const filteredGroupedReports = useMemo(() => {
//     const entries = Object.entries(groupedReports);
//     if (filterDate) {
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === filterDate)
//       );
//     }
//     if (showMostRecent) {
//       const dates = entries.map(([, grp]) => grp.date);
//       if (!dates.length) return {};
//       const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === latest)
//       );
//     }
//     return groupedReports;
//   }, [groupedReports, filterDate, showMostRecent]);

//   // Apply Vitals filters
//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals) {
//       return vitals.filter((v) => v.date === filterDateVitals);
//     }
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   // Prepare data for the line chart of the selected vital
//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({
//         datetime: `${v.date} ${v.time}`,
//         value: Number(v.value),
//       }))
//       .sort(
//         (a, b) =>
//           new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
//       );
//   }, [filteredVitals, selectedVitalType]);

//   // Navigation functions
//   const goToReportDetail = (grp) => {
//     navigate("/reportsdetail", {
//       state: { profile, report: grp, labReports },
//     });
//   };
//   const goToReportTable = (grp, e) => {
//     navigate("/reportstable", {
//       state: {
//         profile,
//         report: grp,
//       },
//     });
//   };

//   const handleViewVital = (vital) => {
//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );
//     if (vital.vitalName.toLowerCase() === "bloodpressure") {
//       navigate("/bp", { state: { profile, data: readings } });
//     } else {
//       navigate("/vitaldetail", {
//         state: { profile, type: vital.vitalName, readings },
//       });
//     }
//   };

//   return (
//     <div className="profiledetailContainer">
//       {/* Profile Header */}
//       <div className="details">
//         <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <div className="profile-grid">
//               {[
//                 ["Name", profile.name],
//                 ["Relation", profile.relation],
//                 ["Gender", profile.gender],
//                 ["DOB", profile.dob],
//                 ["Blood Group", profile.bloodGroup],
//                 ["Height", profile.height],
//                 ["Weight", profile.weight],
//               ].map(([label, val]) => (
//                 <div key={label} className="profile-item">
//                   <strong>{label}:</strong> {val}
//                 </div>
//               ))}
//             </div>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       {/* Vitals & Lab Reports */}

//       <div className="dataSections">
//         {/* Vitals Section */}
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           {/* Vitals Filters */}
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Vitals List */}
//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}

//           {/* Vitals Chart */}
//           {selectedVitalType && chartData.length > 0 && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           {/* Vitals Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button>
//             <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button>
//           </div>
//         </div>

//         {/* Lab Reports Section */}
//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>

//           {/* Filters */}
//           <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => {
//                 setFilterDate(e.target.value);
//                 setShowMostRecent(false);
//               }}
//             />
//             <button onClick={() => setShowMostRecent(false)}>Search</button>
//             <button
//               onClick={() => {
//                 setShowMostRecent(true);
//                 setFilterDate("");
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDate("");
//                 setShowMostRecent(false);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Report Cards */}
//           {Object.entries(filteredGroupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(([key, grp]) => (
//                 <div
//                   key={key}
//                   className="labReportItem"
//                   style={{
//                     marginBottom: "1rem",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                   }}
//                   // onClick={() => goToReportDetail(grp)}
//                 >
//                   <p>
//                     <strong>{grp.testName}</strong>
//                     <br />
//                     <small>
//                       Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
//                     </small>
//                   </p>

//                   <div style={{ display: "flex", gap: "8px", marginBottom: 8 }}>
//                     <button
//                       type="button"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         goToReportDetail(grp);
//                       }}
//                     >
//                       Graph View
//                     </button>
//                     <button
//                       type="button"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         goToReportTable(grp);
//                       }}
//                     >
//                       Table View
//                     </button>
//                   </div>

//                   {grp.reports.map((r) => (
//                     <p
//                       key={r.id || r.parameter}
//                       style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                     >
//                       {r.parameter}: {r.result} {r.unit || ""}
//                     </p>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Found
//             </p>
//           )}

//           {/* Lab Reports Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>
//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//             <button onClick={() => navigate("/allrep", { state: { profile } })}>
//               All Reports
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;

// TASK CODE UMAR
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";
// import useDatabase from "../Components/useDatabase";
// import {
//   CartesianGrid,
//   Line,
//   LineChart,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);
//   const [abnormalMap, setAbnormalMap] = useState({});
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);
//   const [selectedVitalType, setSelectedVitalType] = useState(null);
//   const [lababnormalMap, setLabAbnormalMap] = useState([]);
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       const abnormal = {};
//       const gender = profile.gender?.toLowerCase();

//       let age = 0;
//       if (profile.dob) {
//         const dob = new Date(profile.dob);
//         const today = new Date();
//         age = today.getFullYear() - dob.getFullYear();
//         const m = today.getMonth() - dob.getMonth();
//         if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
//           age--;
//         }
//       }

//       while (stmt.step()) {
//         const row = stmt.getAsObject();
//         rows.push(row);

//         const value = parseFloat(row.value);
//         const name = row.vitalName?.toLowerCase();
//         let isAbnormal = false;

//         if (name === "bloodpressure") {
//           if (age < 18) isAbnormal = value < 90 || value > 120;
//           else if (gender === "female") isAbnormal = value < 90 || value > 130;
//           else isAbnormal = value < 95 || value > 140;
//         } else if (name === "temperature") {
//           isAbnormal = value < 95 || value > 99.5;
//         } else if (name === "heartrate") {
//           if (age < 1) isAbnormal = value < 100 || value > 160;
//           else if (age < 10) isAbnormal = value < 70 || value > 130;
//           else isAbnormal = value < 60 || value > 100;
//         } else if (name === "breathingrate") {
//           if (age < 1) isAbnormal = value < 30 || value > 60;
//           else if (age < 5) isAbnormal = value < 20 || value > 30;
//           else if (age < 12) isAbnormal = value < 18 || value > 25;
//           else isAbnormal = value < 12 || value > 20;
//         }

//         if (isAbnormal) abnormal[name] = true;
//       }

//       stmt.free();
//       setVitals(rows);
//       setAbnormalMap(abnormal);
//     } catch (err) {
//       console.error("Error fetching vitals:", err);
//     }
//   }, [db, profile]);

//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) {
//         rows.push(stmt.getAsObject());
//       }
//       stmt.free();
//       setLabReports(rows);
//     } catch (err) {
//       console.error("Error fetching lab reports:", err);
//     }
//   }, [db, profile]);

//   const groupedReports = labReports.reduce((acc, report) => {
//     const key = `${report.testName}-${report.date}`;
//     if (!acc[key]) {
//       acc[key] = {
//         testName: report.testName,
//         date: report.date,
//         time: report.time,
//         reports: [],
//       };
//     }
//     acc[key].reports.push(report);
//     return acc;
//   }, {});

//   const filteredGroupedReports = useMemo(() => {
//     const entries = Object.entries(groupedReports);
//     if (filterDate) {
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === filterDate)
//       );
//     }
//     if (showMostRecent) {
//       const dates = entries.map(([, grp]) => grp.date);
//       if (!dates.length) return {};
//       const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === latest)
//       );
//     }
//     return groupedReports;
//   }, [groupedReports, filterDate, showMostRecent]);

//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals) {
//       return vitals.filter((v) => v.date === filterDateVitals);
//     }
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({
//         datetime: `${v.date} ${v.time}`,
//         value: Number(v.value),
//       }))
//       .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
//   }, [filteredVitals, selectedVitalType]);

//   const handleViewVital = (vital) => {
//     const predefinedReports = [
//       { name: "Blood Pressure", route: "/prebp" },
//       { name: "Temperature", route: "/pretemp" },
//       { name: "Heart Rate", route: "/preheart" },
//       { name: "Breathing Rate", route: "/prebreath" },
//     ];

//     const report = predefinedReports.find(
//       (r) => r.name.toLowerCase() === vital.vitalName.toLowerCase()
//     );

//     if (!report) return;

//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );

//     navigate(report.route, {
//       state: { profile, type: vital.vitalName, readings },
//     });
//   };

//   const goToReportDetail = (report) => {
//     navigate("/reportsdetail", { state: { profile, report } });
//   };

//   // Adding the reports here
//   const predefinedReports = [
//     {
//       name: "Blood CP",
//       icon: "🩸",
//       route: "/precp",
//     },
//     {
//       name: "Thyroid Function Test",
//       icon: "🦋",
//       route: "/prethyroid",
//     },
//     {
//       name: "RFT",
//       icon: "💧",
//       route: "/prerft",
//     },
//     {
//       name: "LFT",
//       icon: "🧪",
//       route: "/prelft",
//     },
//     {
//       name: "LIPID PROFILE",
//       icon: "🥓",
//       route: "/prelipid",
//     },
//     {
//       name: "Electrolytes",
//       icon: "⚡",
//       route: "/preelectrolyte",
//     },
//   ];

//   const handleReportShortcutClick = (report) => {
//     navigate(report.route, { state: { profile } });
//   };

//   return (
//     <div className="profiledetailContainer">
//       <div className="details">
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <p>
//               <strong>Name:</strong> {profile.name}
//             </p>
//             <p>
//               <strong>Relation:</strong> {profile.relation}
//             </p>
//             <p>
//               <strong>Gender:</strong> {profile.gender}
//             </p>
//             <p>
//               <strong>DOB:</strong> {profile.dob}
//             </p>
//             <p>
//               <strong>Blood Group:</strong> {profile.bloodGroup}
//             </p>
//             <p>
//               <strong>Height:</strong> {profile.height}
//             </p>
//             <p>
//               <strong>Weight:</strong> {profile.weight}
//             </p>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       <div className="dataSections">
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}

//           {selectedVitalType && chartData.length > 0 && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button>
//             <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button>
//           </div>
//           <h4>Report Vitals</h4>

//           <div className="vitalsList">
//             {[
//               "Blood Pressure",
//               "Temperature",
//               "Heart Rate",
//               "Breathing Rate",
//             ].map((vitalName, idx) => {
//               const key = vitalName.toLowerCase().replace(/\s+/g, "");
//               const isAbnormal = abnormalMap[key];
//               return (
//                 <div
//                   key={idx}
//                   className="vitalItem"
//                   onClick={() => handleViewVital({ vitalName })}
//                   style={{
//                     cursor: "pointer",
//                     borderLeft: isAbnormal
//                       ? "6px solid red"
//                       : "6px solid transparent",
//                     backgroundColor: isAbnormal ? "#ffe5e5" : "#ffffff",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     padding: "10px",
//                     marginBottom: "10px",
//                     borderRadius: "6px",
//                     boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
//                   }}
//                 >
//                   <strong>{vitalName}</strong>
//                   {isAbnormal && (
//                     <span
//                       style={{ color: "red", fontSize: "18px" }}
//                       title="Abnormal"
//                     >
//                       &#9888;
//                     </span>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>
//           {Object.keys(groupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(
//                 ([groupKey, groupData]) => (
//                   <div
//                     key={groupKey}
//                     className="labReportItem"
//                     style={{
//                       cursor: "pointer",
//                       marginBottom: "1rem",
//                       border: "1px solid #ddd",
//                       padding: "10px",
//                     }}
//                     onClick={() => goToReportDetail(groupData)}
//                   >
//                     <p>
//                       <strong>{groupData.testName}</strong> <br />
//                       <small>
//                         Date: {groupData.date}{" "}
//                         {groupData.time && ` | Time: ${groupData.time}`}
//                       </small>
//                     </p>
//                     {groupData.reports.map((report) => (
//                       <p
//                         key={report.id || report.parameter}
//                         style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                       >
//                         {report.parameter}: {report.result} {report.unit || ""}
//                       </p>
//                     ))}
//                   </div>
//                 )
//               )}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Added
//             </p>
//           )}
//           {/* Lab Reports Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>
//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//             <button onClick={() => navigate("/allrep", { state: { profile } })}>
//               All Report
//             </button>{" "}
//           </div>
//           <div className="reportShortcuts">
//             <h4>Report Shortcuts</h4>
//             <div className="reportShortcutList">
//               {predefinedReports.map((report, index) => (
//                 <div
//                   key={index}
//                   className="reportShortcutItem"
//                   onClick={() => handleReportShortcutClick(report)}
//                 >
//                   <span className="reportIcon">{report.icon}</span>
//                   <span className="reportName">{report.name}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;

//KAL KIYA THA
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";
// import useDatabase from "../Components/useDatabase";
// import {
//   CartesianGrid,
//   Line,
//   LineChart,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   // const { profile } = location.state || {};
//   const { profile, reload } = location.state || {};
//   const { db } = useDatabase();

//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);
//   const [abnormalMap, setAbnormalMap] = useState({});
//   const [labAbnormalMap, setLabAbnormalMap] = useState({
//     bloodcp: false,
//     tft: false,
//     rft: false,
//     lft: false,
//     lipidprofile: false,
//     electrolytes: false,
//   });
//   const [tftWarning, setTftWarning] = useState(false);
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);
//   const [selectedVitalType, setSelectedVitalType] = useState(null);

//   // Fetch Vitals
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       const abnormal = {};
//       const gender = profile.gender?.toLowerCase();
//       let age = 0;
//       if (profile.dob) {
//         const dob = new Date(profile.dob);
//         const today = new Date();
//         age = today.getFullYear() - dob.getFullYear();
//         const m = today.getMonth() - dob.getMonth();
//         if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
//       }
//       while (stmt.step()) {
//         const row = stmt.getAsObject();
//         rows.push(row);
//         const value = parseFloat(row.value);
//         const name = row.vitalName?.toLowerCase();
//         let isAbnormal = false;
//         if (name === "bloodpressure") {
//           const [systolic, diastolic] = row.value.split("/").map(Number);
//           if (!systolic || !diastolic) {
//             isAbnormal = true; // invalid format
//           } else {
//             if (age < 18) {
//               isAbnormal =
//                 systolic < 90 ||
//                 systolic > 120 ||
//                 diastolic < 60 ||
//                 diastolic > 80;
//             } else if (gender === "female") {
//               isAbnormal =
//                 systolic < 90 ||
//                 systolic > 130 ||
//                 diastolic < 60 ||
//                 diastolic > 85;
//             } else {
//               isAbnormal =
//                 systolic < 95 ||
//                 systolic > 140 ||
//                 diastolic < 60 ||
//                 diastolic > 90;
//             }
//           }
//         } else if (name === "temperature") {
//           isAbnormal = value < 95 || value > 99.5;
//         } else if (name === "heartrate") {
//           if (age < 1) isAbnormal = value < 100 || value > 160;
//           else if (age < 10) isAbnormal = value < 70 || value > 130;
//           else isAbnormal = value < 60 || value > 100;
//         } else if (name === "breathingrate") {
//           if (age < 1) isAbnormal = value < 30 || value > 60;
//           else if (age < 5) isAbnormal = value < 20 || value > 30;
//           else if (age < 12) isAbnormal = value < 18 || value > 25;
//           else isAbnormal = value < 12 || value > 20;
//         }
//         if (isAbnormal) abnormal[name] = true;
//       }
//       stmt.free();
//       setVitals(rows);
//       setAbnormalMap(abnormal);
//     } catch (err) {
//       console.error("Error fetching vitals:", err);
//     }
//   }, [db, profile, reload]);

//   // AGAR TASK AYA SUGAR KA PHR UNCOMMENT
//   // useEffect(() => {
//   //   if (!db || !profile) return;
//   //   try {
//   //     const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//   //     stmt.bind([profile.name]);
//   //     const rows = [];
//   //     const abnormal = {};
//   //     const gender = profile.gender?.toLowerCase();
//   //     let age = 0;
//   //     if (profile.dob) {
//   //       const dob = new Date(profile.dob);
//   //       const today = new Date();
//   //       age = today.getFullYear() - dob.getFullYear();
//   //       const m = today.getMonth() - dob.getMonth();
//   //       if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
//   //     }

//   //     while (stmt.step()) {
//   //       const row = stmt.getAsObject();
//   //       rows.push(row);

//   //       const name = row.vitalName?.toLowerCase();
//   //       const value = parseFloat(row.value);
//   //       let isAbnormal = false;

//   //       if (name === "bloodpressure") {
//   //         const [systolic, diastolic] = row.value.split("/").map(Number);
//   //         if (!systolic || !diastolic) {
//   //           isAbnormal = true;
//   //         } else {
//   //           if (age < 18) {
//   //             isAbnormal =
//   //               systolic < 90 ||
//   //               systolic > 120 ||
//   //               diastolic < 60 ||
//   //               diastolic > 80;
//   //           } else if (gender === "female") {
//   //             isAbnormal =
//   //               systolic < 90 ||
//   //               systolic > 130 ||
//   //               diastolic < 60 ||
//   //               diastolic > 85;
//   //           } else {
//   //             isAbnormal =
//   //               systolic < 95 ||
//   //               systolic > 140 ||
//   //               diastolic < 60 ||
//   //               diastolic > 90;
//   //           }
//   //         }
//   //       } else if (name === "temperature") {
//   //         isAbnormal = value < 95 || value > 99.5;
//   //       } else if (name === "heartrate") {
//   //         if (age < 1) isAbnormal = value < 100 || value > 160;
//   //         else if (age < 10) isAbnormal = value < 70 || value > 130;
//   //         else isAbnormal = value < 60 || value > 100;
//   //       } else if (name === "breathingrate") {
//   //         if (age < 1) isAbnormal = value < 30 || value > 60;
//   //         else if (age < 5) isAbnormal = value < 20 || value > 30;
//   //         else if (age < 12) isAbnormal = value < 18 || value > 25;
//   //         else isAbnormal = value < 12 || value > 20;
//   //       } else if (name === "glucose") {
//   //         const type = row.type?.toLowerCase(); // fasting or regular
//   //         let thresholdLow = 0;
//   //         let thresholdHigh = 0;

//   //         if (type === "fasting") {
//   //           if (gender === "female" && age >= 50) {
//   //             thresholdLow = 70;
//   //             thresholdHigh = 110;
//   //           } else if (gender === "male" && age < 40) {
//   //             thresholdLow = 70;
//   //             thresholdHigh = 100;
//   //           } else {
//   //             thresholdLow = 70;
//   //             thresholdHigh = 105;
//   //           }
//   //         } else {
//   //           // regular (non-fasting)
//   //           if (gender === "female" && age >= 50) {
//   //             thresholdLow = 90;
//   //             thresholdHigh = 140;
//   //           } else if (gender === "male" && age < 40) {
//   //             thresholdLow = 90;
//   //             thresholdHigh = 130;
//   //           } else {
//   //             thresholdLow = 90;
//   //             thresholdHigh = 135;
//   //           }
//   //         }

//   //         isAbnormal = isNaN(value) || value < thresholdLow || value > thresholdHigh;
//   //       }

//   //       if (isAbnormal) abnormal[name] = true;
//   //     }

//   //     stmt.free();
//   //     setVitals(rows);
//   //     setAbnormalMap(abnormal);
//   //   } catch (err) {
//   //     console.error("Error fetching vitals:", err);
//   //   }
//   // }, [db, profile, reload]);

//   // Fetch LabReports + compute abnormal flags
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       const flags = {
//         bloodcp: false,
//         tft: false,
//         rft: false,
//         lft: false,
//         lipidprofile: false,
//         electrolytes: false,
//       };
//       let tftFlag = false;
//       while (stmt.step()) {
//         const report = stmt.getAsObject();
//         console.log(report);
//         rows.push(report);
//         const test = report.testName?.toLowerCase().replace(/\s+/g, "");
//         const param = report.parameter?.toLowerCase();
//         const val = parseFloat(report.result);
//         if (
//           test === "tft" &&
//           ((param === "tsh" && (val < 0.4 || val > 4.5)) ||
//             (param === "t3" && (val < 80 || val > 200)) ||
//             (param === "t4" && (val < 5 || val > 12)))
//         ) {
//           flags.tft = true;
//           tftFlag = true;
//         }
//         if (
//           test === "bloodcp" &&
//           ((param === "rbc" && (val < 4.2 || val > 6.1)) ||
//             (param === "wbc" && (val < 4000 || val > 11000)) ||
//             (param === "platelets" && (val < 150000 || val > 450000)) ||
//             (param === "hb" && (val < 12 || val > 17.5)) ||
//             (param === "hct" && (val < 36 || val > 53)))
//         )
//           flags.bloodcp = true;
//         if (
//           test === "rft" &&
//           ((param === "blood urea" && (val < 10 || val > 50)) ||
//             (param === "serum" && (val < 0.4 || val > 1.3)) ||
//             (param === "uric acid" && (val < 3.7 || val > 7.7)) ||
//             (param === "bun" && (val < 5 || val > 24)))
//         )
//           flags.rft = true;
//         if (
//           test === "lft" &&
//           ((param === "directbilirubin" && (val < 0 || val > 0.3)) ||
//             (param === "indirectbilirubin" && (val < 0.1 || val > 0.8)) ||
//             (param === "totalbilirubin" && (val < 0.2 || val > 1.1)) ||
//             (param === "ast" && (val < 9 || val > 40)) ||
//             (param === "alt" && (val < 5 || val > 50)) ||
//             (param === "alkalinephosphatase" && (val < 56 || val > 167)) ||
//             (param === "gamma" && (val < 0 || val > 69)))
//         )
//           flags.lft = true;
//         if (
//           test === "lipidprofile" &&
//           ((param === "cholesterol" && val > 200) ||
//             (param === "hdl" &&
//               val < (profile.gender === "Female" ? 50 : 40)) ||
//             (param === "ldl" && val > 130) ||
//             (param === "triglycerides" && val > 150))
//         )
//           flags.lipidprofile = true;
//         if (
//           test === "electrolytes" &&
//           ((param === "sodium" && (val < 135 || val > 145)) ||
//             (param === "potassium" && (val < 3.5 || val > 5.0)) ||
//             (param === "chloride" && (val < 96 || val > 106)))
//         )
//           flags.electrolytes = true;
//       }
//       stmt.free();
//       setLabReports(rows);
//       setLabAbnormalMap(flags);
//       setTftWarning(tftFlag);
//     } catch (err) {
//       console.error("Error fetching lab reports:", err);
//     }
//   }, [db, profile]);

//   const groupedReports = labReports.reduce((acc, report) => {
//     const key = `${report.testName}-${report.date}`;
//     if (!acc[key]) {
//       acc[key] = {
//         testName: report.testName,
//         date: report.date,
//         time: report.time,
//         reports: [],
//       };
//     }
//     acc[key].reports.push(report);
//     return acc;
//   }, {});

//   const filteredGroupedReports = useMemo(() => {
//     const entries = Object.entries(groupedReports);
//     if (filterDate) {
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === filterDate)
//       );
//     }
//     if (showMostRecent) {
//       const dates = entries.map(([, grp]) => grp.date);
//       if (!dates.length) return {};
//       const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === latest)
//       );
//     }
//     return groupedReports;
//   }, [groupedReports, filterDate, showMostRecent]);

//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals) {
//       return vitals.filter((v) => v.date === filterDateVitals);
//     }
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({
//         datetime: `${v.date} ${v.time}`,
//         value: Number(v.value),
//       }))
//       .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
//   }, [filteredVitals, selectedVitalType]);

//   const handleViewVital = (vital) => {
//     const predefinedReports = [
//       { name: "Blood Pressure", route: "/prebp" },
//       { name: "Temperature", route: "/pretemp" },
//       { name: "Heart Rate", route: "/preheart" },
//       { name: "Breathing Rate", route: "/prebreath" },
//     ];

//     const report = predefinedReports.find(
//       (r) => r.name.toLowerCase() === vital.vitalName.toLowerCase()
//     );

//     if (!report) return;

//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );

//     navigate(report.route, {
//       state: { profile, type: vital.vitalName, readings },
//     });
//   };

//   const goToReportDetail = (report) => {
//     navigate("/reportsdetail", { state: { profile, report } });
//   };

//   // Adding the reports here
//   const predefinedReports = [
//     {
//       name: "Blood CP",
//       icon: "🩸",
//       route: "/precp",
//     },
//     {
//       name: "Thyroid Function Test",
//       icon: "🦋",
//       route: "/prethyroid",
//     },
//     {
//       name: "RFT",
//       icon: "💧",
//       route: "/prerft",
//     },
//     {
//       name: "LFT",
//       icon: "🧪",
//       route: "/prelft",
//     },
//     {
//       name: "LIPID PROFILE",
//       icon: "🥓",
//       route: "/prelipid",
//     },
//     {
//       name: "Electrolytes",
//       icon: "⚡",
//       route: "/preelectrolyte",
//     },
//   ];

//   const handleReportShortcutClick = (report) => {
//     navigate(report.route, { state: { profile } });
//   };

//   return (
//     <div className="profiledetailContainer">
//       <div className="details">
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <p>
//               <strong>Name:</strong> {profile.name}
//             </p>
//             <p>
//               <strong>Relation:</strong> {profile.relation}
//             </p>
//             <p>
//               <strong>Gender:</strong> {profile.gender}
//             </p>
//             <p>
//               <strong>DOB:</strong> {profile.dob}
//             </p>
//             <p>
//               <strong>Blood Group:</strong> {profile.bloodGroup}
//             </p>
//             <p>
//               <strong>Height:</strong> {profile.height}
//             </p>
//             <p>
//               <strong>Weight:</strong> {profile.weight}
//             </p>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       <div className="dataSections">
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}

//           {selectedVitalType && chartData.length > 0 && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button>
//             <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button>
//             <button onClick={() => navigate("/task", { state: { profile } })}>
//               TASK
//             </button>
//           </div>
//           <h4>Report Vitals</h4>

//           <div className="vitalsList">
//             {[
//               "Blood Pressure",
//               "Temperature",
//               "Heart Rate",
//               "Breathing Rate",
//             ].map((vitalName, idx) => {
//               const key = vitalName.toLowerCase().replace(/\s+/g, "");
//               const isAbnormal = abnormalMap[key];
//               return (
//                 <div
//                   key={idx}
//                   className="vitalItem"
//                   onClick={() => handleViewVital({ vitalName })}
//                   style={{
//                     cursor: "pointer",
//                     borderLeft: isAbnormal
//                       ? "6px solid red"
//                       : "6px solid transparent",
//                     backgroundColor: isAbnormal ? "#ffe5e5" : "#ffffff",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     padding: "10px",
//                     marginBottom: "10px",
//                     borderRadius: "6px",
//                     boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
//                   }}
//                 >
//                   <strong>{vitalName}</strong>
//                   {isAbnormal && (
//                     <span
//                       style={{ color: "red", fontSize: "18px" }}
//                       title="Abnormal"
//                     >
//                       &#9888;
//                     </span>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>
//           {Object.keys(groupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(
//                 ([groupKey, groupData]) => (
//                   <div
//                     key={groupKey}
//                     className="labReportItem"
//                     style={{
//                       cursor: "pointer",
//                       marginBottom: "1rem",
//                       border: "1px solid #ddd",
//                       padding: "10px",
//                     }}
//                     onClick={() => goToReportDetail(groupData)}
//                   >
//                     <p>
//                       <strong>{groupData.testName}</strong> <br />
//                       <small>
//                         Date: {groupData.date}{" "}
//                         {groupData.time && `| Time: ${groupData.time}`}
//                       </small>
//                     </p>
//                     {groupData.reports.map((report) => (
//                       <p
//                         key={report.id || report.parameter}
//                         style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                       >
//                         {report.parameter}: {report.result} {report.unit || ""}
//                       </p>
//                     ))}
//                   </div>
//                 )
//               )}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Added
//             </p>
//           )}
//           {/* Lab Reports Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>
//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//             <button onClick={() => navigate("/allrep", { state: { profile } })}>
//               All Report
//             </button>{" "}
//           </div>
//           <div className="reportShortcuts">
//             <h4>Report Shortcuts</h4>
//             <div className="reportShortcutList">
//               {predefinedReports.map((report, index) => {
//                 // const isTFT = report.name.toLowerCase().includes("thyroid");
//                 // const showWarning = isTFT && tftWarning;

//                 const reportKey = report.name.toLowerCase().replace(/\s+/g, "");
//                 const isAbnormal = labAbnormalMap[reportKey];

//                 return (
//                   <div
//                     key={index}
//                     className={`reportShortcutItem ${
//                       isAbnormal ? "abnormal" : ""
//                     }`}
//                     onClick={() => handleReportShortcutClick(report)}
//                   >
//                     <span className="reportIcon">{report.icon}</span>
//                     <span className="reportName">{report.name}</span>
//                     {isAbnormal && <span className="warningIcon">⚠️</span>}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;

//SUGAR LOGIC ADD HOI BS
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";
// import useDatabase from "../Components/useDatabase";
// import {
//   CartesianGrid,
//   Line,
//   LineChart,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile, reload } = location.state || {};
//   const { db } = useDatabase();

//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);
//   const [abnormalMap, setAbnormalMap] = useState({});
//   const [labAbnormalMap, setLabAbnormalMap] = useState({
//     bloodcp: false,
//     tft: false,
//     rft: false,
//     lft: false,
//     lipidprofile: false,
//     electrolytes: false,
//   });
//   const [tftWarning, setTftWarning] = useState(false);
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);
//   const [selectedVitalType, setSelectedVitalType] = useState(null);

//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       const abnormal = {};
//       const gender = profile.gender?.toLowerCase();
//       let age = 0;
//       if (profile.dob) {
//         const dob = new Date(profile.dob);
//         const today = new Date();
//         age = today.getFullYear() - dob.getFullYear();
//         const m = today.getMonth() - dob.getMonth();
//         if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
//       }
//       while (stmt.step()) {
//         const row = stmt.getAsObject();
//         rows.push(row);
//         const name = row.vitalName?.toLowerCase();
//         const value = parseFloat(row.value);
//         let isAbnormal = false;

//         if (name === "bloodpressure") {
//           const [systolic, diastolic] = row.value.split("/").map(Number);
//           if (!systolic || !diastolic) {
//             isAbnormal = true;
//           } else {
//             if (age < 18) {
//               isAbnormal = systolic < 90 || systolic > 120 || diastolic < 60 || diastolic > 80;
//             } else if (gender === "female") {
//               isAbnormal = systolic < 90 || systolic > 130 || diastolic < 60 || diastolic > 85;
//             } else {
//               isAbnormal = systolic < 95 || systolic > 140 || diastolic < 60 || diastolic > 90;
//             }
//           }
//         } else if (name === "temperature") {
//           isAbnormal = value < 95 || value > 99.5;
//         } else if (name === "heartrate") {
//           if (age < 1) isAbnormal = value < 100 || value > 160;
//           else if (age < 10) isAbnormal = value < 70 || value > 130;
//           else isAbnormal = value < 60 || value > 100;
//         } else if (name === "breathingrate") {
//           if (age < 1) isAbnormal = value < 30 || value > 60;
//           else if (age < 5) isAbnormal = value < 20 || value > 30;
//           else if (age < 12) isAbnormal = value < 18 || value > 25;
//           else isAbnormal = value < 12 || value > 20;
//         } else if (name === "glucose") {
//           const type = row.type?.toLowerCase();
//           let thresholdLow = 0;
//           let thresholdHigh = 0;

//           if (type === "fasting") {
//             if (gender === "female" && age >= 50) {
//               thresholdLow = 70;
//               thresholdHigh = 110;
//             } else if (gender === "male" && age < 40) {
//               thresholdLow = 70;
//               thresholdHigh = 100;
//             } else {
//               thresholdLow = 70;
//               thresholdHigh = 105;
//             }
//           } else {
//             if (gender === "female" && age >= 50) {
//               thresholdLow = 90;
//               thresholdHigh = 140;
//             } else if (gender === "male" && age < 40) {
//               thresholdLow = 90;
//               thresholdHigh = 130;
//             } else {
//               thresholdLow = 90;
//               thresholdHigh = 135;
//             }
//           }

//           isAbnormal = isNaN(value) || value < thresholdLow || value > thresholdHigh;
//         }

//         if (isAbnormal) abnormal[name] = true;
//       }
//       stmt.free();
//       setVitals(rows);
//       setAbnormalMap(abnormal);
//     } catch (err) {
//       console.error("Error fetching vitals:", err);
//     }
//   }, [db, profile, reload]);

//   // Other logic and rendering unchanged from your latest code
// };

// export default ProfileDetailScreen;

// TASK SETTINGS////////////////////////////////////////

// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";

// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);
//   const [settings, setSettings] = useState({});
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);
//   const [selectedVitalType, setSelectedVitalType] = useState(null);

//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setVitals(rows);
//   }, [db, profile]);

//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     console.log("🔍 labReports rows:", rows);
//     setLabReports(rows);
//   }, [db, profile]);

//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM Settings");
//     const cfg = {};
//     while (stmt.step()) {
//       const { vitalName, gender, minValue, maxValue, abnormalTestsPerDay } =
//         stmt.getAsObject();
//       if (!cfg[vitalName]) cfg[vitalName] = {};
//       cfg[vitalName].min = cfg[vitalName].min || {};
//       cfg[vitalName].max = cfg[vitalName].max || {};
//       cfg[vitalName].min[gender] = minValue;
//       cfg[vitalName].max[gender] = maxValue;
//       cfg[vitalName].abnormal = abnormalTestsPerDay;
//     }
//     stmt.free();
//     setSettings(cfg);
//   }, [db]);

//   useEffect(() => {
//     if (!vitals.length || !Object.keys(settings).length || !profile) return;
//     const today = new Date().toISOString().split("T")[0];
//     Object.keys(settings).forEach((vitalName) => {
//       const cfg = settings[vitalName];
//       const gender = profile.gender.toLowerCase();
//       const min = cfg.min[gender];
//       const max = cfg.max[gender];
//       const limit = cfg.abnormal;
//       if (min == null || max == null || !limit) return;
//       const count = vitals.filter(
//         (v) =>
//           v.vitalName === vitalName &&
//           v.date === today &&
//           (Number(v.value) < min || Number(v.value) > max)
//       ).length;
//       if (count > 0 && count < limit) {
//         window.alert(
//           `You have performed ${count}/${limit} abnormal ${vitalName} tests today.`
//         );
//       }
//       if (count >= limit) {
//         setSelectedVitalType(vitalName);
//       }
//     });
//   }, [vitals, settings, profile]);

//   useEffect(() => {
//     if (!labReports.length || !Object.keys(settings).length || !profile) return;
//     const today = new Date().toISOString().split("T")[0];
//     const abnormalCountByTest = {};

//     labReports.forEach((r) => {
//       const cfg = settings[r.testName];
//       if (!cfg) return;
//       const gender = profile.gender.toLowerCase();
//       const min = cfg.min[gender];
//       const max = cfg.max[gender];
//       const limit = cfg.abnormal;
//       if (min == null || max == null || !limit) return;
//       if (
//         r.date === today &&
//         (Number(r.result) < min || Number(r.result) > max)
//       ) {
//         abnormalCountByTest[r.testName] =
//           (abnormalCountByTest[r.testName] || 0) + 1;
//       }
//     });

//     Object.entries(abnormalCountByTest).forEach(([testName, count]) => {
//       const limit = settings[testName].abnormal;
//       if (count > 0 && count < limit) {
//         window.alert(
//           `You have performed ${count}/${limit} abnormal ${testName} lab tests today.`
//         );
//       }
//     });
//   }, [labReports, settings, profile]);

//   const groupedReports = useMemo(() => {
//     return labReports.reduce((acc, report) => {
//       const key = `${report.testName}-${report.date}`;
//       if (!acc[key]) {
//         acc[key] = {
//           testName: report.testName,
//           date: report.date,
//           time: report.time,
//           // carry the location from the very first row
//           location: report.location,
//           reports: [],
//         };
//       }
//       acc[key].reports.push(report);
//       return acc;
//     }, {});
//   }, [labReports]);

//   //CODE SAHI HA SRF LOCATION NAI HA
//   // const groupedReports = useMemo(() => {
//   //   return labReports.reduce((acc, report) => {
//   //     const key = `${report.testName}-${report.date}`;
//   //     if (!acc[key]) {
//   //       acc[key] = {
//   //         testName: report.testName,
//   //         date: report.date,
//   //         time: report.time,
//   //         reports: [],
//   //       };
//   //     }
//   //     acc[key].reports.push(report);
//   //     return acc;
//   //   }, {});
//   // }, [labReports]);

//   const filteredGroupedReports = useMemo(() => {
//     const entries = Object.entries(groupedReports);
//     if (filterDate) {
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === filterDate)
//       );
//     }
//     if (showMostRecent) {
//       const dates = entries.map(([, grp]) => grp.date);
//       if (!dates.length) return {};
//       const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === latest)
//       );
//     }
//     return groupedReports;
//   }, [groupedReports, filterDate, showMostRecent]);

//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals) {
//       return vitals.filter((v) => v.date === filterDateVitals);
//     }
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({
//         datetime: `${v.date} ${v.time}`,
//         value: Number(v.value),
//       }))
//       .sort(
//         (a, b) =>
//           new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
//       );
//   }, [filteredVitals, selectedVitalType]);

//   // const goToReportDetail = (grp) => {
//   //   const reportLocation = grp.reports[0]?.location || "-";

//   //   navigate("/reportsdetail", {
//   //     state: {
//   //       profile,
//   //       // spread in everything you already had, plus a top‑level `location`
//   //       report: { ...grp, location: reportLocation },
//   //       labReports,
//   //     },
//   //   });
//   // };
//   // const goToReportDetail = (grp) => {
//   //   console.log("navigating with grp:", grp);
//   //   // nechy walay navigate ma location nai ha
//   //   // navigate("/reportsdetail", {
//   //   //   state: { profile, report: grp, labReports, reportLocation: grp.location },
//   //   // });

//   //   navigate("/reportsdetail", {
//   //     state: {
//   //       profile,
//   //       report: {
//   //         ...grp,
//   //         location: grp.reports[0]?.location || "-",
//   //       },
//   //     },
//   //   });
//   // };
//   // click‑handler in ProfileDetailScreen
//   const goToReportDetail = (grp) => {
//     navigate("/reportsdetail", { state: { profile, report: grp } });
//   };

//   const handleViewVital = (vital) => {
//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );
//     if (vital.vitalName.toLowerCase() === "bloodpressure") {
//       navigate("/bp", { state: { profile, data: readings } });
//     } else {
//       navigate("/vitaldetail", {
//         state: { profile, type: vital.vitalName, readings },
//       });
//     }
//   };

//   return (
//     <div className="profiledetailContainer">
//       {/* Profile Header */}
//       <div className="details">
//         <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <div className="profile-grid">
//               {[
//                 ["Name", profile.name],
//                 ["Relation", profile.relation],
//                 ["Gender", profile.gender],
//                 ["DOB", profile.dob],
//                 ["Blood Group", profile.bloodGroup],
//                 ["Height", profile.height],
//                 ["Weight", profile.weight],
//               ].map(([label, val]) => (
//                 <div key={label} className="profile-item">
//                   <strong>{label}:</strong> {val}
//                 </div>
//               ))}
//             </div>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       {/* Vitals & Lab Reports */}
//       <div className="dataSections">
//         {/* Vitals Section */}
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           {/* Vitals Filters */}
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Vitals List */}
//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}

//           {/* Vitals Chart */}
//           {/* {selectedVitalType && chartData.length > 0 && (
// //             <div
// //               className="vitalsChart"
// //               style={{ height: 300, marginTop: "2rem" }}
// //             >
// //               <ResponsiveContainer width="100%" height="100%">
// //                 <LineChart data={chartData}>
// //                   <CartesianGrid strokeDasharray="3 3" />
// //                   <XAxis dataKey="datetime" />
// //                   <YAxis />
// //                   <Tooltip />
// //                   <Line
// //                     type="monotone"
// //                     dataKey="value"
// //                     name={selectedVitalType}
// //                     stroke="#8884d8"
// //                     strokeWidth={2}
// //                     dot={{ r: 3 }}
// //                   />
// //                 </LineChart>
// //               </ResponsiveContainer>
// //             </div>
// //           )} */}
//           {/* task ki waja sa upper wala comment kiya wo apna scenario pa work sahi kar raha */}

//           {/* Vitals Chart: auto-shown when selectedVitalType is set by abnormal logic */}
//           {selectedVitalType && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <h3>{selectedVitalType} Trends</h3>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart
//                   data={chartData}
//                   margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//           {/* Vitals Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             {/* <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button> */}
//             {/* <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button> */}

//             <button
//               onClick={() => navigate("/settings", { state: { profile } })}
//             >
//               Settings
//             </button>
//           </div>
//         </div>

//         {/* Lab Reports Section */}
//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>

//           {/* Lab Reports Filters */}
//           <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => {
//                 setFilterDate(e.target.value);
//                 setShowMostRecent(false);
//               }}
//             />
//             <button onClick={() => setShowMostRecent(false)}>Search</button>
//             <button
//               onClick={() => {
//                 setShowMostRecent(true);
//                 setFilterDate("");
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDate("");
//                 setShowMostRecent(false);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Lab Reports List */}
//           {Object.keys(filteredGroupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(([key, grp]) => (
//                 <div
//                   key={key}
//                   className="labReportItem"
//                   style={{
//                     cursor: "pointer",
//                     marginBottom: "1rem",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                   }}
//                   onClick={() => goToReportDetail(grp)}
//                 >
//                   <p>
//                     <strong>{grp.testName}</strong>
//                     <br />
//                     <small>
//                       Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
//                     </small>
//                   </p>
//                   {grp.reports.map((r) => (
//                     <p
//                       key={r.id || r.parameter}
//                       style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                     >
//                       {r.parameter}: {r.result} {r.unit || ""}
//                     </p>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Found
//             </p>
//           )}

//           {/* Lab Reports Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>
//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//             {/* <button onClick={() => navigate("/allrep", { state: { profile } })}>
//               All Report
//             </button> */}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;

// favourite or unfavourite code
//ProfileDetailScreen.jsx;
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/ProfileDetail.css";

import useDatabase from "../Components/useDatabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// normalize helpers
const norm = (s) => (s == null ? "" : String(s).trim().toLowerCase());
const nkey = (s) =>
  s == null
    ? ""
    : String(s)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

// robust testName extractor
const getTestName = (r) => r.testName ?? r.test ?? r.test_name ?? "";

// BP parser
const parseBP = (val) => {
  if (val == null) return null;
  const s = String(val);
  const m = s.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
  if (!m) return null;
  return { systolic: Number(m[1]), diastolic: Number(m[2]) };
};

// tolerant settings finder (find exact key or first key that contains token)
const findCfg = (settingsObj, key) => {
  if (!settingsObj || !key) return null;
  if (settingsObj[key]) return settingsObj[key];
  const lower = key.toLowerCase();
  for (const k of Object.keys(settingsObj)) {
    if ((k || "").toLowerCase().includes(lower)) return settingsObj[k];
  }
  return null;
};

// check abnormal for a single vital row (numeric or BP)
const isVitalAbnormal = (v, settingsObj, gender) => {
  const key = norm(v.vitalName);
  const raw = v.value;

  // numeric vitals
  const cfg = findCfg(settingsObj, key);
  const num = Number(raw);
  if (!Number.isNaN(num) && cfg) {
    const min = cfg.min?.[gender];
    const max = cfg.max?.[gender];
    if (min == null || max == null) return false;
    return num < Number(min) || num > Number(max);
  }

  // BP handling
  if (
    key.includes("blood") ||
    key.includes("bp") ||
    key.includes("bloodpressure")
  ) {
    const bp = parseBP(raw);
    if (!bp) return false;

    const systCfg =
      findCfg(settingsObj, `${key}-systolic`) ||
      findCfg(settingsObj, "bloodpressure-systolic");
    const diasCfg =
      findCfg(settingsObj, `${key}-diastolic`) ||
      findCfg(settingsObj, "bloodpressure-diastolic");

    if (systCfg) {
      const minS = systCfg.min?.[gender];
      const maxS = systCfg.max?.[gender];
      if (
        minS != null &&
        maxS != null &&
        (bp.systolic < Number(minS) || bp.systolic > Number(maxS))
      )
        return true;
    }
    if (diasCfg) {
      const minD = diasCfg.min?.[gender];
      const maxD = diasCfg.max?.[gender];
      if (
        minD != null &&
        maxD != null &&
        (bp.diastolic < Number(minD) || bp.diastolic > Number(maxD))
      )
        return true;
    }

    // generic bloodpressure config fallback
    const genericCfg =
      findCfg(settingsObj, "bloodpressure") || findCfg(settingsObj, key);
    if (genericCfg) {
      const min = genericCfg.min?.[gender];
      const max = genericCfg.max?.[gender];
      if (
        min != null &&
        max != null &&
        (bp.systolic < Number(min) || bp.systolic > Number(max))
      )
        return true;
    }
  }

  return false;
};

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db, saveDatabase } = useDatabase();

  const [vitals, setVitals] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [settings, setSettings] = useState({});
  const [filterDate, setFilterDate] = useState("");
  const [showMostRecent, setShowMostRecent] = useState(false);
  const [filterDateVitals, setFilterDateVitals] = useState("");
  const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);
  const [selectedVitalType, setSelectedVitalType] = useState(null);

  // favorites: Set of strings "type::nameNorm"
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    console.log("Favorites (ProfileDetailScreen):", Array.from(favorites));
  }, [favorites]);

  // ensure Favorites table exists (defensive)
  useEffect(() => {
    if (!db) return;
    try {
      db.run(
        `CREATE TABLE IF NOT EXISTS Favorites (
          profileName TEXT,
          itemType TEXT,
          itemName TEXT,
          PRIMARY KEY(profileName, itemType, itemName)
        );`
      );
    } catch (e) {
      console.error("Failed to ensure Favorites table:", e);
    }
  }, [db]);

  // load favorites for the profile (and reload when location.key changes)
  const loadFavorites = () => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        "SELECT itemType, itemName FROM Favorites WHERE profileName = ?"
      );
      stmt.bind([profile.name]);
      const favSet = new Set();
      while (stmt.step()) {
        const row = stmt.getAsObject();
        // itemName stored normalized (nkey)
        favSet.add(`${row.itemType}::${row.itemName}`);
      }
      stmt.free();
      setFavorites(favSet);
      console.log("Loaded favorites from DB:", Array.from(favSet));
    } catch (e) {
      console.error("Error loading favorites:", e);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [db, profile, location.key]);

  // add/remove favorites (update UI first, persist DB and localStorage)
  const addFavoriteToDb = (itemType, itemName) => {
    const nameNorm = nkey(itemName);
    setFavorites((prev) => {
      const copy = new Set(prev ?? []);
      copy.add(`${itemType}::${nameNorm}`);
      return copy;
    });

    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO Favorites (profileName, itemType, itemName) VALUES (?, ?, ?)"
      );
      stmt.bind([profile.name, itemType, nameNorm]);
      stmt.step();
      stmt.free();
      if (typeof saveDatabase === "function") saveDatabase();
      console.log("Inserted favorite into DB:", itemType, nameNorm);
    } catch (e) {
      console.error("Error adding favorite:", e);
    }
  };

  const removeFavoriteFromDb = (itemType, itemName) => {
    const nameNorm = nkey(itemName);
    setFavorites((prev) => {
      const copy = new Set(prev ?? []);
      copy.delete(`${itemType}::${nameNorm}`);
      return copy;
    });

    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        "DELETE FROM Favorites WHERE profileName = ? AND itemType = ? AND itemName = ?"
      );
      stmt.bind([profile.name, itemType, nameNorm]);
      stmt.step();
      stmt.free();
      if (typeof saveDatabase === "function") saveDatabase();
      console.log("Removed favorite from DB:", itemType, nameNorm);
    } catch (e) {
      console.error("Error removing favorite:", e);
    }
  };

  const toggleFavorite = (itemType, itemName) => {
    const keyNorm = `${itemType}::${nkey(itemName)}`;
    if (favorites.has(keyNorm)) removeFavoriteFromDb(itemType, itemName);
    else addFavoriteToDb(itemType, itemName);
  };

  const isFavorite = (itemType, itemName) =>
    favorites.has(`${itemType}::${nkey(itemName)}`);

  /* -------------------------
     load vitals, lab reports, settings
  ------------------------- */
  useEffect(() => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setVitals(rows);
    } catch (e) {
      console.error("Failed to load vitals:", e);
    }
  }, [db, profile]);

  useEffect(() => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      setLabReports(rows);
    } catch (e) {
      console.error("Failed to load lab reports:", e);
    }
  }, [db, profile]);

  useEffect(() => {
    if (!db) return;
    try {
      const stmt = db.prepare("SELECT * FROM Settings");
      const cfg = {};
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const rawName = row.vitalName ?? row.testName ?? row.name;
        if (!rawName) continue;
        const key = String(rawName).trim().toLowerCase();
        if (!cfg[key]) cfg[key] = {};
        cfg[key].min = cfg[key].min || {};
        cfg[key].max = cfg[key].max || {};
        cfg[key].min[row.gender] = row.minValue;
        cfg[key].max[row.gender] = row.maxValue;
        cfg[key].abnormal = row.abnormalTestsPerDay;
      }
      stmt.free();
      setSettings(cfg);
      console.log("Loaded settings keys:", Object.keys(cfg));
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, [db]);

  /* -------------------------
     abnormal detection (vitals & labs)
  ------------------------- */
  useEffect(() => {
    if (!vitals.length || !Object.keys(settings).length || !profile) return;
    const today = new Date().toISOString().split("T")[0];
    Object.keys(settings).forEach((vitalName) => {
      const cfg = settings[vitalName];
      const gender = profile.gender.toLowerCase();
      const min = cfg.min[gender];
      const max = cfg.max[gender];
      const limit = cfg.abnormal;
      if (min == null || max == null || !limit) return;
      const count = vitals.filter(
        (v) =>
          norm(v.vitalName) === vitalName &&
          v.date === today &&
          isVitalAbnormal(v, settings, gender)
      ).length;
      if (count > 0 && count < limit) {
        window.alert(
          `You have performed ${count}/${limit} abnormal ${vitalName} tests today.`
        );
      }
      if (count >= limit) {
        setSelectedVitalType(vitalName);
      }
    });
  }, [vitals, settings, profile]);

  useEffect(() => {
    if (!labReports.length || !Object.keys(settings).length || !profile) return;
    const today = new Date().toISOString().split("T")[0];
    const abnormalCountByTest = {};
    labReports.forEach((r) => {
      const testName = getTestName(r);
      const cfg = findCfg(settings, norm(testName));
      if (!cfg) return;
      const gender = profile.gender.toLowerCase();
      const min = cfg.min[gender];
      const max = cfg.max[gender];
      const limit = cfg.abnormal;
      if (min == null || max == null || !limit) return;
      if (
        r.date === today &&
        (Number(r.result) < min || Number(r.result) > max)
      ) {
        abnormalCountByTest[testName] =
          (abnormalCountByTest[testName] || 0) + 1;
      }
    });

    Object.entries(abnormalCountByTest).forEach(([testName, count]) => {
      const limit = findCfg(settings, norm(testName))?.abnormal;
      if (count > 0 && limit && count < limit) {
        window.alert(
          `You have performed ${count}/${limit} abnormal ${testName} lab tests today.`
        );
      }
    });
  }, [labReports, settings, profile]);

  /* -------------------------
     grouping + filters (lab)
  ------------------------- */
  const groupedReports = useMemo(() => {
    return labReports.reduce((acc, report) => {
      const tname = getTestName(report);
      const key = `${tname}-${report.date}`;
      if (!acc[key]) {
        acc[key] = {
          testName: tname,
          date: report.date,
          time: report.time,
          location: report.location,
          reports: [],
        };
      }
      acc[key].reports.push(report);
      return acc;
    }, {});
  }, [labReports]);

  const filteredGroupedReports = useMemo(() => {
    const entries = Object.entries(groupedReports);
    if (filterDate)
      return Object.fromEntries(
        entries.filter(([, grp]) => grp.date === filterDate)
      );
    if (showMostRecent) {
      const dates = entries.map(([, grp]) => grp.date);
      if (!dates.length) return {};
      const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
      return Object.fromEntries(
        entries.filter(([, grp]) => grp.date === latest)
      );
    }
    return groupedReports;
  }, [groupedReports, filterDate, showMostRecent]);

  /* -------------------------
     filtering vitals
  ------------------------- */
  const filteredVitals = useMemo(() => {
    if (filterDateVitals)
      return vitals.filter((v) => v.date === filterDateVitals);
    if (showMostRecentVitals) {
      if (!vitals.length) return [];
      const latest = vitals
        .map((v) => v.date)
        .sort((a, b) => new Date(b) - new Date(a))[0];
      return vitals.filter((v) => v.date === latest);
    }
    return vitals;
  }, [vitals, filterDateVitals, showMostRecentVitals]);

  const chartData = useMemo(() => {
    if (!selectedVitalType) return [];
    return filteredVitals
      .filter((v) => v.vitalName === selectedVitalType)
      .map((v) => ({ datetime: `${v.date} ${v.time}`, value: Number(v.value) }))
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
  }, [filteredVitals, selectedVitalType]);

  const goToReportDetail = (grp) => {
    navigate("/reportsdetail", { state: { profile, report: grp } });
  };

  const handleViewVital = (vital) => {
    const readings = vitals
      .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
      .map((v) => ({
        date: v.date,
        time: v.time,
        value: v.value,
        unit: v.unit,
      }))
      .sort(
        (a, b) =>
          new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
      );
    if (vital.vitalName.toLowerCase() === "bloodpressure") {
      navigate("/bp", { state: { profile, data: readings } });
    } else {
      navigate("/vitaldetail", {
        state: { profile, type: vital.vitalName, readings },
      });
    }
  };

  return (
    <div className="profiledetailContainer">
      {/* Profile Header */}
      <div className="details">
        <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
        <h2>Profile Details</h2>
        {profile ? (
          <>
            <div className="profile-grid">
              {[
                ["Name", profile.name],
                ["Relation", profile.relation],
                ["Gender", profile.gender],
                ["DOB", profile.dob],
                ["Blood Group", profile.bloodGroup],
                ["Height", profile.height],
                ["Weight", profile.weight],
              ].map(([label, val]) => (
                <div key={label} className="profile-item">
                  <strong>{label}:</strong> {val}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                className="abnormalButton"
                onClick={() =>
                  navigate("/abnormal", {
                    state: { profile, favorites: Array.from(favorites) },
                  })
                }
              >
                View Abnormal Reports
              </button>

              <button
                onClick={() =>
                  navigate("/fav", {
                    state: {
                      profile,
                      favorites: Array.from(favorites),
                      onlyFavorites: true,
                    },
                  })
                }
              >
                View Favorites
              </button>
            </div>
          </>
        ) : (
          <p>No Profile Selected</p>
        )}
      </div>

      {/* Vitals & Lab Reports */}
      <div className="dataSections">
        {/* Vitals Section */}
        <div className="vitalsSection">
          <h3>Vitals</h3>

          {/* Filters */}
          <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
            <input
              type="date"
              value={filterDateVitals}
              onChange={(e) => {
                setFilterDateVitals(e.target.value);
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            />
            <button
              onClick={() => {
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            >
              Search
            </button>
            <button
              onClick={() => {
                setShowMostRecentVitals(true);
                setFilterDateVitals("");
                setSelectedVitalType(null);
              }}
            >
              Most Recent
            </button>
            <button
              onClick={() => {
                setFilterDateVitals("");
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            >
              Show All
            </button>
          </div>

          {/* Vitals List */}
          {filteredVitals.length > 0 ? (
            <div className="vitalsList">
              {filteredVitals.map((v, idx) => (
                <div
                  key={idx}
                  className={`vitalItem ${
                    selectedVitalType === v.vitalName ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedVitalType(v.vitalName);
                    handleViewVital(v);
                  }}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p>
                      <strong>{v.vitalName}</strong>: {v.value} {v.unit}{" "}
                      {v.date} {v.time}
                    </p>
                  </div>

                  {/* Favorite star */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite("vital", v.vitalName);
                    }}
                    style={{
                      cursor: "pointer",
                      fontSize: 18,
                      padding: "4px 8px",
                    }}
                    title={
                      isFavorite("vital", v.vitalName)
                        ? "Remove favorite"
                        : "Add to favorites"
                    }
                  >
                    {isFavorite("vital", v.vitalName) ? "★" : "☆"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              No Vitals Found
            </p>
          )}

          {/* Vitals Chart */}
          {selectedVitalType && (
            <div
              className="vitalsChart"
              style={{ height: 300, marginTop: "2rem" }}
            >
              <h3>{selectedVitalType} Trends</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datetime" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedVitalType}
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/addvital", { state: { profile } })}
            >
              Add Vital
            </button>
            <button
              onClick={() => navigate("/settings", { state: { profile } })}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Lab Reports Section */}
        <div className="labReportsSection">
          <h3>Lab Reports</h3>

          {/* Filters */}
          <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setShowMostRecent(false);
              }}
            />
            <button onClick={() => setShowMostRecent(false)}>Search</button>
            <button
              onClick={() => {
                setShowMostRecent(true);
                setFilterDate("");
              }}
            >
              Most Recent
            </button>
            <button
              onClick={() => {
                setFilterDate("");
                setShowMostRecent(false);
              }}
            >
              Show All
            </button>
          </div>

          {/* Lab Reports List */}
          {Object.keys(filteredGroupedReports).length > 0 ? (
            <div className="labReportsList">
              {Object.entries(filteredGroupedReports).map(([key, grp]) => (
                <div
                  key={key}
                  className="labReportItem"
                  style={{
                    cursor: "pointer",
                    marginBottom: "1rem",
                    border: "1px solid #ddd",
                    padding: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                  onClick={() => goToReportDetail(grp)}
                >
                  <div>
                    <p>
                      <strong>{grp.testName}</strong>
                      <br />
                      <small>
                        Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
                      </small>
                    </p>
                    {grp.reports.map((r) => (
                      <p
                        key={r.id || r.parameter}
                        style={{ margin: "2px 0", fontSize: "0.9rem" }}
                      >
                        {r.parameter}: {r.result} {r.unit || ""}
                      </p>
                    ))}
                  </div>

                  {/* Favorite star for lab test */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite("lab", grp.testName);
                    }}
                    style={{ cursor: "pointer", fontSize: 20, paddingLeft: 8 }}
                    title={
                      isFavorite("lab", grp.testName)
                        ? "Remove favorite"
                        : "Add to favorites"
                    }
                  >
                    {isFavorite("lab", grp.testName) ? "★" : "☆"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              No Lab Reports Found
            </p>
          )}

          {/* Actions */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <button
              onClick={() =>
                navigate("/compare", { state: { baseProfile: profile } })
              }
            >
              Compare Tests
            </button>
            <button
              onClick={() => navigate("/addreport", { state: { profile } })}
            >
              Add Lab Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailScreen;

///ADD REMINDER FEATURE FOR VITAL
// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";

// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";

// // normalize helpers
// const norm = (s) => (s == null ? "" : String(s).trim().toLowerCase());
// const nkey = (s) =>
//   s == null
//     ? ""
//     : String(s)
//         .trim()
//         .toLowerCase()
//         .replace(/[^a-z0-9]/g, "");

// // robust testName extractor
// const getTestName = (r) => r.testName ?? r.test ?? r.test_name ?? "";

// // BP parser
// const parseBP = (val) => {
//   if (val == null) return null;
//   const s = String(val);
//   const m = s.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
//   if (!m) return null;
//   return { systolic: Number(m[1]), diastolic: Number(m[2]) };
// };

// // tolerant settings finder (find exact key or first key that contains token)
// const findCfg = (settingsObj, key) => {
//   if (!settingsObj || !key) return null;
//   if (settingsObj[key]) return settingsObj[key];
//   const lower = key.toLowerCase();
//   for (const k of Object.keys(settingsObj)) {
//     if ((k || "").toLowerCase().includes(lower)) return settingsObj[k];
//   }
//   return null;
// };

// // check abnormal for a single vital row (numeric or BP)
// const isVitalAbnormal = (v, settingsObj, gender) => {
//   const key = norm(v.vitalName);
//   const raw = v.value;

//   // numeric vitals
//   const cfg = findCfg(settingsObj, key);
//   const num = Number(raw);
//   if (!Number.isNaN(num) && cfg) {
//     const min = cfg.min?.[gender];
//     const max = cfg.max?.[gender];
//     if (min == null || max == null) return false;
//     return num < Number(min) || num > Number(max);
//   }

//   // BP handling
//   if (
//     key.includes("blood") ||
//     key.includes("bp") ||
//     key.includes("bloodpressure")
//   ) {
//     const bp = parseBP(raw);
//     if (!bp) return false;

//     const systCfg =
//       findCfg(settingsObj, `${key}-systolic`) ||
//       findCfg(settingsObj, "bloodpressure-systolic");
//     const diasCfg =
//       findCfg(settingsObj, `${key}-diastolic`) ||
//       findCfg(settingsObj, "bloodpressure-diastolic");

//     if (systCfg) {
//       const minS = systCfg.min?.[gender];
//       const maxS = systCfg.max?.[gender];
//       if (
//         minS != null &&
//         maxS != null &&
//         (bp.systolic < Number(minS) || bp.systolic > Number(maxS))
//       )
//         return true;
//     }
//     if (diasCfg) {
//       const minD = diasCfg.min?.[gender];
//       const maxD = diasCfg.max?.[gender];
//       if (
//         minD != null &&
//         maxD != null &&
//         (bp.diastolic < Number(minD) || bp.diastolic > Number(maxD))
//       )
//         return true;
//     }

//     // generic bloodpressure config fallback
//     const genericCfg =
//       findCfg(settingsObj, "bloodpressure") || findCfg(settingsObj, key);
//     if (genericCfg) {
//       const min = genericCfg.min?.[gender];
//       const max = genericCfg.max?.[gender];
//       if (
//         min != null &&
//         max != null &&
//         (bp.systolic < Number(min) || bp.systolic > Number(max))
//       )
//         return true;
//     }
//   }

//   return false;
// };

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db, saveDatabase } = useDatabase();

//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);
//   const [settings, setSettings] = useState({});
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);
//   const [selectedVitalType, setSelectedVitalType] = useState(null);

//   // reminders state
//   const [reminders, setReminders] = useState([]);
//   const timersRef = useRef({}); // keeps scheduled timeouts so we can clear them

//   // favorites: Set of strings "type::nameNorm"
//   const [favorites, setFavorites] = useState(new Set());

//   useEffect(() => {
//     console.log("Favorites (ProfileDetailScreen):", Array.from(favorites));
//   }, [favorites]);

//   // ensure Favorites and Reminders table exists (defensive)
//   useEffect(() => {
//     if (!db) return;
//     try {
//       db.run(
//         `CREATE TABLE IF NOT EXISTS Favorites (
//           profileName TEXT,
//           itemType TEXT,
//           itemName TEXT,
//           PRIMARY KEY(profileName, itemType, itemName)
//         );`
//       );

//       // Reminders: id PK, profileName, vitalName, time (HH:MM), repeat ('once'|'daily'|'weekly'), enabled
//       db.run(
//         `CREATE TABLE IF NOT EXISTS Reminders (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           profileName TEXT,
//           vitalName TEXT,
//           time TEXT,
//           repeat TEXT,
//           enabled INTEGER
//         );`
//       );
//     } catch (e) {
//       console.error("Failed to ensure DB tables:", e);
//     }
//   }, [db]);

//   // load favorites for the profile (and reload when location.key changes)
//   const loadFavorites = () => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         "SELECT itemType, itemName FROM Favorites WHERE profileName = ?"
//       );
//       stmt.bind([profile.name]);
//       const favSet = new Set();
//       while (stmt.step()) {
//         const row = stmt.getAsObject();
//         favSet.add(`${row.itemType}::${row.itemName}`);
//       }
//       stmt.free();
//       setFavorites(favSet);
//       console.log("Loaded favorites from DB:", Array.from(favSet));
//     } catch (e) {
//       console.error("Error loading favorites:", e);
//     }
//   };

//   useEffect(() => {
//     loadFavorites();
//   }, [db, profile, location.key]);
//   // add/remove favorites (update UI first, persist DB and localStorage)
//   const addFavoriteToDb = (itemType, itemName) => {
//     const nameNorm = nkey(itemName);
//     setFavorites((prev) => {
//       const copy = new Set(prev ?? []);
//       copy.add(`${itemType}::${nameNorm}`);
//       return copy;
//     });

//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         "INSERT OR REPLACE INTO Favorites (profileName, itemType, itemName) VALUES (?, ?, ?)"
//       );
//       stmt.bind([profile.name, itemType, nameNorm]);
//       stmt.step();
//       stmt.free();
//       if (typeof saveDatabase === "function") saveDatabase();
//       console.log("Inserted favorite into DB:", itemType, nameNorm);
//     } catch (e) {
//       console.error("Error adding favorite:", e);
//     }
//   };

//   const removeFavoriteFromDb = (itemType, itemName) => {
//     const nameNorm = nkey(itemName);
//     setFavorites((prev) => {
//       const copy = new Set(prev ?? []);
//       copy.delete(`${itemType}::${nameNorm}`);
//       return copy;
//     });

//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         "DELETE FROM Favorites WHERE profileName = ? AND itemType = ? AND itemName = ?"
//       );
//       stmt.bind([profile.name, itemType, nameNorm]);
//       stmt.step();
//       stmt.free();
//       if (typeof saveDatabase === "function") saveDatabase();
//       console.log("Removed favorite from DB:", itemType, nameNorm);
//     } catch (e) {
//       console.error("Error removing favorite:", e);
//     }
//   };

//   const toggleFavorite = (itemType, itemName) => {
//     const keyNorm = `${itemType}::${nkey(itemName)}`;
//     if (favorites.has(keyNorm)) removeFavoriteFromDb(itemType, itemName);
//     else addFavoriteToDb(itemType, itemName);
//   };

//   const isFavorite = (itemType, itemName) =>
//     favorites.has(`${itemType}::${nkey(itemName)}`);

//   // reminders: load
//   const loadReminders = () => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         "SELECT id, vitalName, time, repeat, enabled FROM Reminders WHERE profileName = ?"
//       );
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       // normalize enabled to boolean
//       const map = rows.map((r) => ({ ...r, enabled: Number(r.enabled) === 1 }));
//       setReminders(map);
//       console.log("Loaded reminders:", map);
//     } catch (e) {
//       console.error("Failed to load reminders:", e);
//     }
//   };

//   // add reminder to DB
//   const addReminderToDb = (
//     vitalName,
//     time,
//     repeat = "daily",
//     enabled = true
//   ) => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare(
//         "INSERT INTO Reminders (profileName, vitalName, time, repeat, enabled) VALUES (?, ?, ?, ?, ?)"
//       );
//       stmt.bind([profile.name, vitalName, time, repeat, enabled ? 1 : 0]);
//       stmt.step();
//       stmt.free();
//       if (typeof saveDatabase === "function") saveDatabase();
//       loadReminders();
//       console.log("Inserted reminder:", vitalName, time, repeat);
//     } catch (e) {
//       console.error("Error adding reminder:", e);
//     }
//   };

//   const updateReminderEnabled = (id, enabled) => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("UPDATE Reminders SET enabled = ? WHERE id = ?");
//       stmt.bind([enabled ? 1 : 0, id]);
//       stmt.step();
//       stmt.free();
//       if (typeof saveDatabase === "function") saveDatabase();
//       loadReminders();
//     } catch (e) {
//       console.error("Error updating reminder enabled:", e);
//     }
//   };

//   const removeReminderFromDb = (id) => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("DELETE FROM Reminders WHERE id = ?");
//       stmt.bind([id]);
//       stmt.step();
//       stmt.free();
//       if (typeof saveDatabase === "function") saveDatabase();
//       loadReminders();
//     } catch (e) {
//       console.error("Error removing reminder:", e);
//     }
//   };

//   // schedule reminders: simple in-memory timers. NOTE: these run only while app is open.
//   const scheduleReminders = () => {
//     // clear existing timers
//     Object.values(timersRef.current || {}).forEach((t) => clearTimeout(t));
//     timersRef.current = {};

//     if (!reminders?.length) return;

//     reminders.forEach((r) => {
//       if (!r.enabled) return;
//       // time stored as HH:MM
//       const parts = (r.time || "").split(":");
//       if (parts.length < 2) return;
//       const hh = Number(parts[0]);
//       const mm = Number(parts[1]);
//       if (Number.isNaN(hh) || Number.isNaN(mm)) return;

//       const now = new Date();
//       let next = new Date();
//       next.setHours(hh, mm, 0, 0);
//       // if time already passed, pick next occurrence based on repeat
//       if (next <= now) {
//         if (r.repeat === "daily") next.setDate(next.getDate() + 1);
//         else if (r.repeat === "weekly") next.setDate(next.getDate() + 7);
//         else next.setDate(next.getDate() + 1); // 'once' fallback will be triggered immediately and then disabled
//       }

//       const delta = next.getTime() - now.getTime();
//       // guard: setTimeout max ~2^31-1 ms (~24.8 days)
//       if (delta <= 0 || delta > 0x7fffffff) return;

//       const t = setTimeout(() => {
//         // on trigger: show notification / alert
//         showReminderNotification(r);

//         // if once -> disable in db
//         if (r.repeat === "once") {
//           updateReminderEnabled(r.id, false);
//         }

//         // reschedule this reminder (if repeating) by calling scheduleReminders again after a short delay
//         setTimeout(() => scheduleReminders(), 500);
//       }, delta);

//       timersRef.current[r.id] = t;
//       console.log("Scheduled reminder", r.id, "in ms", delta);
//     });
//   };

//   const showReminderNotification = (r) => {
//     const title = `Reminder: ${r.vitalName}`;
//     const body = `Time to record ${r.vitalName} (${r.time})`;
//     try {
//       if (window.Notification && Notification.permission === "granted") {
//         new Notification(title, { body });
//       } else {
//         // fallback
//         alert(`${title}\n${body}`);
//       }
//     } catch (e) {
//       console.error("Notification failed", e);
//       alert(`${title}\n${body}`);
//     }
//   };

//   const requestNotificationPermission = async () => {
//     try {
//       if (!("Notification" in window)) return;
//       if (Notification.permission === "default")
//         await Notification.requestPermission();
//     } catch (e) {
//       console.error("Notification permission error", e);
//     }
//   };

//   // load vitals, lab reports, settings
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       setVitals(rows);
//     } catch (e) {
//       console.error("Failed to load vitals:", e);
//     }
//   }, [db, profile]);

//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       setLabReports(rows);
//     } catch (e) {
//       console.error("Failed to load lab reports:", e);
//     }
//   }, [db, profile]);

//   useEffect(() => {
//     if (!db) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM Settings");
//       const cfg = {};
//       while (stmt.step()) {
//         const row = stmt.getAsObject();
//         const rawName = row.vitalName ?? row.testName ?? row.name;
//         if (!rawName) continue;
//         const key = String(rawName).trim().toLowerCase();
//         if (!cfg[key]) cfg[key] = {};
//         cfg[key].min = cfg[key].min || {};
//         cfg[key].max = cfg[key].max || {};
//         cfg[key].min[row.gender] = row.minValue;
//         cfg[key].max[row.gender] = row.maxValue;
//         cfg[key].abnormal = row.abnormalTestsPerDay;
//       }
//       stmt.free();
//       setSettings(cfg);
//       console.log("Loaded settings keys:", Object.keys(cfg));
//     } catch (e) {
//       console.error("Failed to load settings:", e);
//     }
//   }, [db]);

//   // load reminders whenever db/profile change
//   useEffect(() => {
//     loadReminders();
//     // request notification permission once
//     requestNotificationPermission();
//     // clear timers on unmount
//     return () => {
//       Object.values(timersRef.current || {}).forEach((t) => clearTimeout(t));
//       timersRef.current = {};
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [db, profile]);

//   // whenever reminders change, schedule them
//   useEffect(() => {
//     scheduleReminders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [reminders]);

//   /* -------------------------
//      abnormal detection (vitals & labs)
//   ------------------------- */
//   useEffect(() => {
//     if (!vitals.length || !Object.keys(settings).length || !profile) return;
//     const today = new Date().toISOString().split("T")[0];
//     Object.keys(settings).forEach((vitalName) => {
//       const cfg = settings[vitalName];
//       const gender = profile.gender.toLowerCase();
//       const min = cfg.min[gender];
//       const max = cfg.max[gender];
//       const limit = cfg.abnormal;
//       if (min == null || max == null || !limit) return;
//       const count = vitals.filter(
//         (v) =>
//           norm(v.vitalName) === vitalName &&
//           v.date === today &&
//           isVitalAbnormal(v, settings, gender)
//       ).length;
//       if (count > 0 && count < limit) {
//         window.alert(
//           `You have performed ${count}/${limit} abnormal ${vitalName} tests today.`
//         );
//       }
//       if (count >= limit) {
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//         setSelectedVitalType(vitalName);
//       }
//     });
//   }, [vitals, settings, profile]);

//   useEffect(() => {
//     if (!labReports.length || !Object.keys(settings).length || !profile) return;
//     const today = new Date().toISOString().split("T")[0];
//     const abnormalCountByTest = {};
//     labReports.forEach((r) => {
//       const testName = getTestName(r);
//       const cfg = findCfg(settings, norm(testName));
//       if (!cfg) return;
//       const gender = profile.gender.toLowerCase();
//       const min = cfg.min[gender];
//       const max = cfg.max[gender];
//       const limit = cfg.abnormal;
//       if (min == null || max == null || !limit) return;
//       if (
//         r.date === today &&
//         (Number(r.result) < min || Number(r.result) > max)
//       ) {
//         abnormalCountByTest[testName] =
//           (abnormalCountByTest[testName] || 0) + 1;
//       }
//     });

//     Object.entries(abnormalCountByTest).forEach(([testName, count]) => {
//       const limit = findCfg(settings, norm(testName))?.abnormal;
//       if (count > 0 && limit && count < limit) {
//         window.alert(
//           `You have performed ${count}/${limit} abnormal ${testName} lab tests today.`
//         );
//       }
//     });
//   }, [labReports, settings, profile]);

//   /* -------------------------
//      grouping + filters (lab)
//   ------------------------- */
//   const groupedReports = useMemo(() => {
//     return labReports.reduce((acc, report) => {
//       const tname = getTestName(report);
//       const key = `${tname}-${report.date}`;
//       if (!acc[key]) {
//         acc[key] = {
//           testName: tname,
//           date: report.date,
//           time: report.time,
//           location: report.location,
//           reports: [],
//         };
//       }
//       acc[key].reports.push(report);
//       return acc;
//     }, {});
//   }, [labReports]);

//   const filteredGroupedReports = useMemo(() => {
//     const entries = Object.entries(groupedReports);
//     if (filterDate)
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === filterDate)
//       );
//     if (showMostRecent) {
//       const dates = entries.map(([, grp]) => grp.date);
//       if (!dates.length) return {};
//       const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === latest)
//       );
//     }
//     return groupedReports;
//   }, [groupedReports, filterDate, showMostRecent]);

//   /* -------------------------
//      filtering vitals
//   ------------------------- */
//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals)
//       return vitals.filter((v) => v.date === filterDateVitals);
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({ datetime: `${v.date} ${v.time}`, value: Number(v.value) }))
//       .sort(
//         (a, b) =>
//           new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
//       );
//   }, [filteredVitals, selectedVitalType]);

//   const goToReportDetail = (grp) => {
//     navigate("/reportsdetail", { state: { profile, report: grp } });
//   };

//   const handleViewVital = (vital) => {
//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );
//     if (vital.vitalName.toLowerCase() === "bloodpressure") {
//       navigate("/bp", { state: { profile, data: readings } });
//     } else {
//       navigate("/vitaldetail", {
//         state: { profile, type: vital.vitalName, readings },
//       });
//     }
//   };

//   // prompt-based reminder creation (simple UX) — asks user for HH:MM and repeat
//   const setReminderPrompt = (vitalName) => {
//     try {
//       const time = prompt("Enter reminder time (HH:MM, 24h), e.g. 08:30");
//       if (!time) return;
//       if (!/^\d{1,2}:\d{2}$/.test(time)) {
//         alert("Invalid time format. Use HH:MM");
//         return;
//       }
//       const repeat =
//         prompt("Repeat (once/daily/weekly). default: daily", "daily") ||
//         "daily";
//       if (!["once", "daily", "weekly"].includes(repeat)) {
//         alert("Invalid repeat. Use once, daily or weekly.");
//         return;
//       }
//       addReminderToDb(vitalName, time, repeat, true);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   return (
//     <div className="profiledetailContainer">
//       {/* Profile Header */}
//       <div className="details">
//         <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <div className="profile-grid">
//               {[
//                 ["Name", profile.name],
//                 ["Relation", profile.relation],
//                 ["Gender", profile.gender],
//                 ["DOB", profile.dob],
//                 ["Blood Group", profile.bloodGroup],
//                 ["Height", profile.height],
//                 ["Weight", profile.weight],
//               ].map(([label, val]) => (
//                 <div key={label} className="profile-item">
//                   <strong>{label}:</strong> {val}
//                 </div>
//               ))}
//             </div>

//             <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
//               <button
//                 className="abnormalButton"
//                 onClick={() =>
//                   navigate("/abnormal", {
//                     state: { profile, favorites: Array.from(favorites) },
//                   })
//                 }
//               >
//                 View Abnormal Reports
//               </button>

//               <button
//                 onClick={() =>
//                   navigate("/fav", {
//                     state: {
//                       profile,
//                       favorites: Array.from(favorites),
//                       onlyFavorites: true,
//                     },
//                   })
//                 }
//               >
//                 View Favorites
//               </button>
//             </div>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       {/* Vitals & Lab Reports */}
//       <div className="dataSections">
//         {/* Vitals Section */}
//         <div className="vitalsSection">
//           <h3>Vitals</h3>

//           {/* Filters */}
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Vitals List */}
//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{
//                     cursor: "pointer",
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                   }}
//                 >
//                   <div>
//                     <p>
//                       <strong>{v.vitalName}</strong>: {v.value} {v.unit}{" "}
//                       {v.date} {v.time}
//                     </p>
//                   </div>

//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     {/* Reminder bell */}
//                     <div
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setReminderPrompt(v.vitalName);
//                       }}
//                       style={{
//                         cursor: "pointer",
//                         fontSize: 18,
//                         padding: "4px 8px",
//                       }}
//                       title="Set reminder for this vital"
//                     >
//                       🔔
//                     </div>

//                     {/* Favorite star */}
//                     <div
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         toggleFavorite("vital", v.vitalName);
//                       }}
//                       style={{
//                         cursor: "pointer",
//                         fontSize: 18,
//                         padding: "4px 8px",
//                       }}
//                       title={
//                         isFavorite("vital", v.vitalName)
//                           ? "Remove favorite"
//                           : "Add to favorites"
//                       }
//                     >
//                       {isFavorite("vital", v.vitalName) ? "★" : "☆"}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}

//           {/* Reminders panel (for vitals only) */}
//           <div
//             style={{
//               marginTop: "1rem",
//               borderTop: "1px solid #eee",
//               paddingTop: 12,
//             }}
//           >
//             <h4>Reminders (Vitals)</h4>
//             {reminders.length > 0 ? (
//               <div>
//                 {reminders.map((r) => (
//                   <div
//                     key={r.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       padding: "6px 0",
//                     }}
//                   >
//                     <div>
//                       <strong>{r.vitalName}</strong> — {r.time} ({r.repeat}){" "}
//                       {r.enabled ? "" : "• disabled"}
//                     </div>
//                     <div style={{ display: "flex", gap: 8 }}>
//                       <button
//                         onClick={() => updateReminderEnabled(r.id, !r.enabled)}
//                       >
//                         {r.enabled ? "Disable" : "Enable"}
//                       </button>
//                       <button onClick={() => removeReminderFromDb(r.id)}>
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p style={{ color: "gray" }}>
//                 No reminders set for this profile.
//               </p>
//             )}

//             <div style={{ marginTop: 8 }}>
//               <small>
//                 Tip: click the 🔔 next to a vital to quickly create a reminder
//                 (asks for time & repeat).
//               </small>
//             </div>
//           </div>

//           {/* Vitals Chart */}
//           {selectedVitalType && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <h3>{selectedVitalType} Trends</h3>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart
//                   data={chartData}
//                   margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           {/* Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() => navigate("/settings", { state: { profile } })}
//             >
//               Settings
//             </button>
//           </div>
//         </div>

//         {/* Lab Reports Section */}
//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>

//           {/* Filters */}
//           <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => {
//                 setFilterDate(e.target.value);
//                 setShowMostRecent(false);
//               }}
//             />
//             <button onClick={() => setShowMostRecent(false)}>Search</button>
//             <button
//               onClick={() => {
//                 setShowMostRecent(true);
//                 setFilterDate("");
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDate("");
//                 setShowMostRecent(false);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Lab Reports List */}
//           {Object.keys(filteredGroupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(([key, grp]) => (
//                 <div
//                   key={key}
//                   className="labReportItem"
//                   style={{
//                     cursor: "pointer",
//                     marginBottom: "1rem",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "flex-start",
//                   }}
//                   onClick={() => goToReportDetail(grp)}
//                 >
//                   <div>
//                     <p>
//                       <strong>{grp.testName}</strong>
//                       <br />
//                       <small>
//                         Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
//                       </small>
//                     </p>
//                     {grp.reports.map((r) => (
//                       <p
//                         key={r.id || r.parameter}
//                         style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                       >
//                         {r.parameter}: {r.result} {r.unit || ""}
//                       </p>
//                     ))}
//                   </div>

//                   {/* Favorite star for lab test */}
//                   <div
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       toggleFavorite("lab", grp.testName);
//                     }}
//                     style={{ cursor: "pointer", fontSize: 20, paddingLeft: 8 }}
//                     title={
//                       isFavorite("lab", grp.testName)
//                         ? "Remove favorite"
//                         : "Add to favorites"
//                     }
//                   >
//                     {isFavorite("lab", grp.testName) ? "★" : "☆"}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Found
//             </p>
//           )}

//           {/* Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>
//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;
