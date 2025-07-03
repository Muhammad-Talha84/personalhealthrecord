import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/AllVitals.css";
import useDatabase from "../Components/useDatabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const AllVitalsScreen = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { profile } = state || {};
  const { db } = useDatabase();

  const [vitals, setVitals] = useState([]);

  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setVitals(rows);
  }, [db, profile]);

  const chartDatasets = useMemo(() => {
    // group vitals by type
    const grouped = vitals.reduce((acc, v) => {
      const type = v.vitalName;
      if (!acc[type]) acc[type] = [];

      // normalize time (replace dots with colons)
      const timeStr = v.time ? v.time.replace(/\./g, ":") : "";
      const dateTimeStr = `${v.date} ${timeStr}`;
      const datetime = new Date(dateTimeStr);

      // parse values
      let value = null;
      let systolic = null;
      let diastolic = null;

      if (type.toLowerCase() === "bloodpressure") {
        const raw = v.value?.toString() || "";
        if (raw.includes("/")) {
          const [sys, dia] = raw.split("/");
          systolic = Number(sys) || null;
          diastolic = Number(dia) || null;
        } else {
          // fallback to explicit columns
          systolic = v.maxValue != null ? Number(v.maxValue) : null;
          diastolic = v.minValue != null ? Number(v.minValue) : null;
        }
      } else {
        value = v.value != null ? Number(v.value) : null;
      }

      acc[type].push({ datetime, value, systolic, diastolic });
      return acc;
    }, {});

    // build dataset array
    return Object.entries(grouped).map(([type, entries]) => ({
      type,
      data: entries
        .sort((a, b) => a.datetime - b.datetime)
        .map(({ datetime, value, systolic, diastolic }) => ({
          datetime: datetime.toLocaleString(),
          value,
          systolic,
          diastolic,
        })),
    }));
  }, [vitals]);

  return (
    <div className="all-vitals-container">
      <h1>All Vitals Overview</h1>
      <div className="chart-grid">
        {chartDatasets.map(({ type, data }) => (
          <div key={type} className="chart-card">
            <h2>{type}</h2>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datetime" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {type.toLowerCase() === "bloodpressure" ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        name="Systolic"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolic"
                        name="Diastolic"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={type}
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No data for {type}</p>
            )}
            <button
              onClick={() =>
                navigate(
                  type.toLowerCase() === "bloodpressure"
                    ? "/bpgraph"
                    : "/vitaldetail",
                  {
                    state: {
                      profile,
                      type,
                      readings: vitals
                        .filter((v) => v.vitalName === type)
                        .sort(
                          (a, b) =>
                            new Date(
                              `${a.date} ${a.time.replace(/\./g, ":")}`
                            ) -
                            new Date(`${b.date} ${b.time.replace(/\./g, ":")}`)
                        ),
                    },
                  }
                )
              }
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllVitalsScreen;
