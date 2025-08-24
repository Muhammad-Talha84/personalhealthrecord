// FavoritesScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/ProfileDetail.css";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const norm = (s) => (s == null ? "" : String(s).trim().toLowerCase());
const nkey = (s) =>
  s == null
    ? ""
    : String(s)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const parseBP = (val) => {
  if (val == null) return null;
  const s = String(val);
  const m = s.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
  if (!m) return null;
  return { systolic: Number(m[1]), diastolic: Number(m[2]) };
};

const findCfg = (settingsObj, key) => {
  if (!settingsObj || !key) return null;
  if (settingsObj[key]) return settingsObj[key];
  const lower = key.toLowerCase();
  for (const k of Object.keys(settingsObj)) {
    if ((k || "").toLowerCase().includes(lower)) return settingsObj[k];
  }
  return null;
};

// tolerant matcher between favorite name and actual DB name
const matchesName = (favNorm, actualName) => {
  const a = nkey(actualName);
  const f = nkey(favNorm);
  if (!f || !a) return false;
  if (f === a) return true;
  if (a.includes(f) || f.includes(a)) return true;
  const aFirst = a.split(/[^a-z0-9]/)[0];
  const fFirst = f.split(/[^a-z0-9]/)[0];
  if (aFirst && fFirst && aFirst === fFirst) return true;
  return false;
};

export default function FavoritesScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedFavs = location.state?.favorites; // optional passed array
  const { profile: profileFromState } = location.state || {};

  const { db, saveDatabase } = useDatabase();
  const [profile, setProfile] = useState(profileFromState || null);

  const [favorites, setFavorites] = useState([]); // { itemType, itemName, nameNorm }
  const [vitals, setVitals] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [settings, setSettings] = useState({});

  const [filterDate, setFilterDate] = useState("");
  const [showMostRecent, setShowMostRecent] = useState(false);

  // fallback profile from localStorage
  useEffect(() => {
    if (!profile && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("profile");
        if (raw) setProfile(JSON.parse(raw));
      } catch (e) {}
    }
  }, [profile]);

  // load favorites (passed quickly, then reconcile with DB). Add debug logging.
  useEffect(() => {
    if (!db || !profile) return;

    // quick use of passedFavs (if present)
    if (passedFavs && Array.isArray(passedFavs) && passedFavs.length) {
      const mapped = passedFavs
        .map((s) => {
          if (typeof s === "string") {
            const [itemType, ...rest] = s.split("::");
            const itemName = rest.join("::");
            return { itemType, itemName, nameNorm: nkey(itemName) };
          } else if (s && s.itemType && s.itemName) {
            return {
              itemType: s.itemType,
              itemName: s.itemName,
              nameNorm: nkey(s.itemName),
            };
          }
          return null;
        })
        .filter(Boolean);
      if (mapped.length) {
        const uniq = [];
        const seen = new Set();
        mapped.forEach((f) => {
          const key = `${f.itemType}::${f.nameNorm}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniq.push(f);
          }
        });
        setFavorites(uniq);
      }
    }

    // reconcile with DB: SELECT and log rows
    try {
      const stmt = db.prepare(
        "SELECT itemType, itemName FROM Favorites WHERE profileName = ?"
      );
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) {
        const r = stmt.getAsObject();
        rows.push({ itemType: r.itemType, itemName: r.itemName });
      }
      stmt.free();
      console.log("DEBUG favorites rows from DB:", rows);
      const mapped = rows.map((r) => ({
        itemType: r.itemType,
        itemName: r.itemName,
        nameNorm: nkey(r.itemName),
      }));
      // dedupe
      const uniq = [];
      const seen = new Set();
      mapped.forEach((f) => {
        const key = `${f.itemType}::${f.nameNorm}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniq.push(f);
        }
      });
      setFavorites(uniq);
      console.log("Resolved favorites:", uniq);
    } catch (e) {
      console.error("Failed to load favorites from DB:", e);
    }
  }, [db, profile, passedFavs]);

  // load vitals & labReports
  useEffect(() => {
    if (!db || !profile) return;
    try {
      const s1 = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
      s1.bind([profile.name]);
      const vrows = [];
      while (s1.step()) vrows.push(s1.getAsObject());
      s1.free();
      setVitals(vrows);

      const s2 = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
      s2.bind([profile.name]);
      const lrows = [];
      while (s2.step()) lrows.push(s2.getAsObject());
      s2.free();
      setLabReports(lrows);
    } catch (e) {
      console.error("Failed to load vitals/lab reports:", e);
    }
  }, [db, profile]);

  // load settings (keep raw keys but findCfg will search them)
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
      console.log("DEBUG settings keys:", Object.keys(cfg));
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, [db]);

  // debug logs
  useEffect(() => {
    if (!favorites.length) return;
    console.log("DEBUG favorites (resolved):", favorites);
    console.log("DEBUG vitals sample:", vitals.slice(0, 8));
    console.log("DEBUG labReports sample:", labReports.slice(0, 8));
  }, [favorites, vitals, labReports, settings]);

  // remove favorite (persist)
  const removeFavorite = (itemType, itemName) => {
    const nameNorm = nkey(itemName);
    setFavorites((prev) =>
      prev.filter((f) => !(f.itemType === itemType && f.nameNorm === nameNorm))
    );

    if (!db || !profile) return;
    try {
      const stmt = db.prepare(
        "DELETE FROM Favorites WHERE profileName = ? AND itemType = ? AND itemName = ?"
      );
      stmt.bind([profile.name, itemType, nameNorm]);
      stmt.step();
      stmt.free();
      if (typeof saveDatabase === "function") saveDatabase();
      console.log("Removed favorite in DB:", itemType, nameNorm);
    } catch (e) {
      console.error("Failed to remove favorite:", e);
    }
  };

  // compute abnormal favorites with tolerant matching & tolerant settings lookup
  // Replace your existing abnormalFavorites useMemo with this block
  const abnormalFavorites = useMemo(() => {
    if (!profile || !favorites.length) return { vitals: [], labs: [] };

    const gender = (profile.gender || "").toLowerCase();

    const favVitalNames = favorites
      .filter((f) => f.itemType === "vital")
      .map((f) => f.nameNorm); // already normalized like "bloodcp" or "temperature"

    const favLabNames = favorites
      .filter((f) => f.itemType === "lab")
      .map((f) => f.nameNorm);

    // --- VITALS ---
    // Keep only vitals that are favorited (tolerant name match)
    let vitList = vitals
      .filter((v) =>
        favVitalNames.some((fn) => matchesName(fn, v.vitalName ?? v.name ?? ""))
      )
      .map((v) => ({ ...v }));

    // apply date filters
    if (filterDate) {
      vitList = vitList.filter((v) => v.date === filterDate);
    } else if (showMostRecent && vitList.length) {
      const latest = vitList
        .map((v) => v.date)
        .sort((a, b) => new Date(b) - new Date(a))[0];
      vitList = vitList.filter((v) => v.date === latest);
    }

    // evaluate abnormal for vitals (special-case temperature & BP)
    vitList = vitList.filter((v) => {
      const vKeyNorm = nkey(v.vitalName);
      // numeric vitals (HR, BR, Temperature when numeric)
      const numeric = Number(v.value);
      if (!Number.isNaN(numeric)) {
        // Temperature special: settings keys may be "temperature::19-45" or "temperature::all"
        if (vKeyNorm === "temperature") {
          // find all settings keys that start with "temperature"
          const tempKeys = Object.keys(settings || {}).filter((k) =>
            nkey(k).startsWith("temperature")
          );
          console.log("DEBUG matched tempKeys for temperature:", tempKeys);
          return tempKeys.some((k) => {
            const cfg = settings[k];
            const min = cfg?.min?.[gender];
            const max = cfg?.max?.[gender];
            if (min == null || max == null) return false;
            return numeric < Number(min) || numeric > Number(max);
          });
        }

        // default numeric path for other vitals (heartrate, breathingrate, etc.)
        const cfg = findCfg(settings, norm(v.vitalName));
        if (!cfg) return false;
        const min = cfg.min?.[gender];
        const max = cfg.max?.[gender];
        if (min == null || max == null) return false;
        return numeric < Number(min) || numeric > Number(max);
      }

      // BP handling when value like "130/90"
      const bp = parseBP(v.value);
      if (bp) {
        // try to find systolic/diastolic settings by searching keys (handles 'bloodpressure-systolic' or 'bloodpressure-systolic' etc.)
        const systCfg =
          findCfg(settings, `${norm(v.vitalName)}-systolic`) ||
          findCfg(settings, "bloodpressure-systolic");
        const diasCfg =
          findCfg(settings, `${norm(v.vitalName)}-diastolic`) ||
          findCfg(settings, "bloodpressure-diastolic");

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
      }

      return false;
    });

    // group vitals by vitalName
    const vitGrouped = {};
    vitList.forEach((r) => {
      const k = r.vitalName;
      if (!vitGrouped[k]) vitGrouped[k] = [];
      vitGrouped[k].push(r);
    });

    // --- LABS ---
    const getTestName = (r) => r.testName ?? r.test ?? r.test_name ?? "";

    // first filter to favorite tests (tolerant match)
    let labList = labReports.filter((r) =>
      favLabNames.some((fn) => matchesName(fn, getTestName(r)))
    );

    if (filterDate) {
      labList = labList.filter((r) => r.date === filterDate);
    } else if (showMostRecent && labList.length) {
      const latest = labList
        .map((r) => r.date)
        .sort((a, b) => new Date(b) - new Date(a))[0];
      labList = labList.filter((r) => r.date === latest);
    }

    // Now abnormal filter for labs:
    labList = labList.filter((r) => {
      const test = getTestName(r);
      const testNorm = nkey(test);

      // Special-case BloodCP: settings keys are like "blood cp-rbc(mil/mm3)"
      if (
        testNorm.startsWith("bloodcp") ||
        testNorm.includes("bloodcp") ||
        testNorm.startsWith("bloodcp")
      ) {
        // find candidate settings keys that start with "blood cp"
        const candidateKeys = Object.keys(settings || {}).filter(
          (k) => nkey(k).startsWith("bloodcp") || nkey(k).startsWith("bloodcp")
        );
        // fallback: keys that start with "bloodcp" OR "bloodcp" after removing spaces;
        // but to be safe also include keys that start with "bloodcp" when spaces removed:
        const candidateKeys2 = Object.keys(settings || {}).filter((k) =>
          nkey(k).startsWith(nkey("blood cp"))
        );
        const allCandidates = Array.from(
          new Set([...candidateKeys, ...candidateKeys2])
        );
        // now find one candidate that contains parameter (RBC, WBC, Platelets, HB, HCT)
        const paramNorm = nkey(r.parameter || "");
        const paramKey = allCandidates.find((k) => nkey(k).includes(paramNorm));
        console.log(
          "DEBUG BloodCP paramKey for parameter",
          r.parameter,
          "=>",
          paramKey
        );
        if (!paramKey) return false;
        const cfg = settings[paramKey];
        if (!cfg) return false;
        const min = cfg.min?.[gender];
        const max = cfg.max?.[gender];
        if (min == null || max == null) return false;
        const val = Number(r.result);
        if (Number.isNaN(val)) return false;
        return val < Number(min) || val > Number(max);
      }

      // Default lab path: find cfg by test name (tolerant)
      const cfg = findCfg(settings, norm(test));
      if (!cfg) return false;
      const min = cfg.min?.[gender];
      const max = cfg.max?.[gender];
      if (min == null || max == null) return false;
      const val = Number(r.result);
      if (Number.isNaN(val)) return false;
      return val < Number(min) || val > Number(max);
    });

    // group labs by testName::date
    const labGrouped = {};
    labList.forEach((r) => {
      const key = `${getTestName(r)}::${r.date}`;
      if (!labGrouped[key])
        labGrouped[key] = {
          testName: getTestName(r),
          date: r.date,
          time: r.time,
          reports: [],
        };
      labGrouped[key].reports.push(r);
    });

    console.log(
      "DEBUG abnormalFavorites vitGrouped keys:",
      Object.keys(vitGrouped)
    );
    console.log(
      "DEBUG abnormalFavorites labGrouped keys:",
      Object.keys(labGrouped)
    );

    return { vitals: vitGrouped, labs: labGrouped };
  }, [
    favorites,
    vitals,
    labReports,
    settings,
    profile,
    filterDate,
    showMostRecent,
  ]);

  const vitalsArray = useMemo(
    () =>
      Object.entries(abnormalFavorites.vitals || {}).map(
        ([vitalName, readings]) => ({ vitalName, readings })
      ),
    [abnormalFavorites]
  );
  const labsArray = useMemo(
    () => Object.values(abnormalFavorites.labs || {}),
    [abnormalFavorites]
  );

  const makeChartData = (readings, vitalName) => {
    const key = norm(vitalName || "");
    if (
      key.includes("blood") ||
      key.includes("bp") ||
      key.includes("bloodpressure")
    ) {
      return readings
        .map((r) => {
          const bp = parseBP(r.value);
          return bp
            ? {
                datetime: `${r.date} ${r.time}`,
                systolic: bp.systolic,
                diastolic: bp.diastolic,
              }
            : null;
        })
        .filter(Boolean);
    }
    return readings
      .map((r) => ({ datetime: `${r.date} ${r.time}`, value: Number(r.value) }))
      .filter((x) => !Number.isNaN(x.value));
  };

  return (
    <div className="profiledetailContainer">
      <div className="details">
        <h2>Favorite - Abnormal Items</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate(-1)}>Back</button>
          <button
            onClick={() => {
              setShowMostRecent(false);
              setFilterDate("");
            }}
          >
            Show All
          </button>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setShowMostRecent(false);
            }}
          />
          <button
            onClick={() => {
              setShowMostRecent(true);
              setFilterDate("");
            }}
          >
            Most Recent
          </button>
        </div>
        <p style={{ color: "#666", marginTop: 8 }}>
          Showing favorite items that are outside configured min/max ranges for
          the profile's gender.
        </p>
      </div>

      <div className="dataSections" style={{ gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h3>Favorite Vitals (Abnormal)</h3>
          {vitalsArray.length ? (
            vitalsArray.map((grp) => {
              const chartData = makeChartData(grp.readings, grp.vitalName);
              return (
                <div
                  key={grp.vitalName}
                  style={{
                    border: "1px solid #eee",
                    padding: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate("/vitaldetail", {
                          state: {
                            profile,
                            type: grp.vitalName,
                            readings: vitals.filter(
                              (x) => x.vitalName === grp.vitalName
                            ),
                          },
                        })
                      }
                    >
                      <strong>{grp.vitalName}</strong>
                      <div style={{ fontSize: 12, color: "#444" }}>
                        {grp.readings.length} abnormal reading(s)
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => removeFavorite("vital", grp.vitalName)}
                      >
                        Remove Favorite
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    {grp.readings.map((r, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        {r.value} {r.unit || ""} — {r.date} {r.time}
                      </div>
                    ))}
                  </div>

                  {chartData.length > 1 && (
                    <div style={{ height: 160, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="datetime" tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip />
                          {chartData[0].systolic !== undefined ? (
                            <>
                              <Line
                                type="monotone"
                                dataKey="systolic"
                                name="Systolic"
                                dot={{ r: 2 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="diastolic"
                                name="Diastolic"
                                dot={{ r: 2 }}
                              />
                            </>
                          ) : (
                            <Line
                              type="monotone"
                              dataKey="value"
                              name={grp.vitalName}
                              dot={{ r: 2 }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p style={{ color: "gray" }}>No favorite abnormal vitals found.</p>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Favorite Lab Tests (Abnormal)</h3>
          {labsArray.length ? (
            labsArray.map((grp, idx) => (
              <div
                key={`${grp.testName}::${grp.date}::${idx}`}
                style={{
                  border: "1px solid #eee",
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <strong>{grp.testName}</strong>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {grp.date} {grp.time}
                    </div>
                  </div>
                  <div>
                    <button onClick={() => removeFavorite("lab", grp.testName)}>
                      Remove Favorite
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  {grp.reports.map((r, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      {r.parameter}: {r.result} {r.unit || ""}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 6 }}>
                  <button
                    onClick={() =>
                      navigate("/reportsdetail", {
                        state: {
                          profile,
                          report: {
                            testName: grp.testName,
                            date: grp.date,
                            reports: grp.reports,
                          },
                        },
                      })
                    }
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "gray" }}>
              No favorite abnormal lab tests found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
