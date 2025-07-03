import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useDatabase from "../Components/useDatabase";

const BloodPressureGraph = () => {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db } = useDatabase();

  const [view, setView] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [chartData, setChartData] = useState([]);

  const formatDateTime = (ms) => {
    const d = new Date(ms);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (!db || !profile) return;

    let sql = "";
    let params = [profile.name];

    switch (view) {
      case "Most Recent": // show just the single latest reading
        sql = `
        SELECT
          date || ' ' || replace(time, '.', ':') AS dateTime,
          CAST(substr(value, 1, instr(value, '/')-1) AS INTEGER) AS systolic,
          CAST(substr(value, instr(value, '/')+1) AS INTEGER) AS diastolic
        FROM Vitals
        WHERE profileName = ?
          AND vitalName = 'BloodPressure'
        ORDER BY datetime(
          date || ' ' || replace(time, '.', ':')
        ) DESC
        LIMIT 1
      `;
        break;
      case "Daily":
        sql = `
          SELECT
            date || ' ' || replace(time, '.', ':') AS dateTime,
            CAST(substr(value, 1, instr(value, '/')-1) AS INTEGER) AS systolic,
            CAST(substr(value, instr(value, '/')+1) AS INTEGER) AS diastolic
          FROM Vitals
          WHERE profileName = ?
            AND vitalName = 'BloodPressure'
            AND date = date('now','localtime')
          ORDER BY dateTime
        `;
        break;

      case "Weekly":
        sql = `
        SELECT
        MAX(date || ' ' || replace(time, '.', ':')) AS dateTime,
        AVG(CAST(substr(value, 1, instr(value, '/')-1) AS INTEGER)) AS systolic,
        AVG(CAST(substr(value, instr(value, '/')+1) AS INTEGER)) AS diastolic
      FROM Vitals
      WHERE profileName = ?
        AND vitalName = 'BloodPressure'
        AND date >= date('now','-6 days','localtime')
      GROUP BY strftime('%Y-%m-%d', date)
      ORDER BY strftime('%Y-%m-%d', date)
    `;
        break;

      case "Monthly":
        sql = `
          SELECT
            MAX(date || ' ' || replace(time, '.', ':')) AS dateTime,
            AVG(CAST(substr(value, 1, instr(value, '/')-1) AS INTEGER)) AS systolic,
            AVG(CAST(substr(value, instr(value, '/')+1) AS INTEGER)) AS diastolic
          FROM Vitals
          WHERE profileName = ?
            AND vitalName = 'BloodPressure'
            AND date >= date('now', '-11 months', 'start of month')
          GROUP BY strftime('%Y-%m', date)
          ORDER BY strftime('%Y-%m', date)
        `;
        break;

      case "Custom":
        if (!customStartDate || !customEndDate) {
          setChartData([]);
          return;
        }
        sql = `
          SELECT
            date || ' ' || replace(time, '.', ':') AS dateTime,
            CAST(substr(value, 1, instr(value, '/')-1) AS INTEGER) AS systolic,
            CAST(substr(value, instr(value, '/')+1) AS INTEGER) AS diastolic
          FROM Vitals
          WHERE profileName = ?
            AND vitalName = 'BloodPressure'
            AND date BETWEEN ? AND ?
          ORDER BY dateTime
        `;
        params.push(customStartDate, customEndDate);
        break;

      case "All":
      default:
        sql = `
          SELECT
            date || ' ' || replace(time, '.', ':') AS dateTime,
            CAST(substr(value, 1, instr(value, '/')-1) AS INTEGER) AS systolic,
            CAST(substr(value, instr(value, '/')+1) AS INTEGER) AS diastolic
          FROM Vitals
          WHERE profileName = ?
            AND vitalName = 'BloodPressure'
          ORDER BY dateTime
        `;
    }

    const result = db.exec(sql, params);
    if (!result.length) {
      setChartData([]);
      return;
    }

    // Map date strings to timestamps for all views
    //const { values } = result[0];
    const rows = result[0].values.map(([dt, systolic, diastolic]) => ({
      dateTime: new Date(dt).getTime(),
      systolic,
      diastolic,
    }));

    setChartData(rows);
  }, [db, profile, view, customStartDate, customEndDate]);

  const ticks = chartData.map((d) => d.dateTime);

  return (
    <div style={{ width: "100%", height: 350 }}>
      <h2>Blood Pressure Over Time</h2>
      <div style={{ marginBottom: 16 }}>
        {["All", "Most Recent", "Daily", "Weekly", "Monthly", "Custom"].map(
          (v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                marginRight: 8,
                padding: "6px 12px",
                background: view === v ? "#007bff" : "#fff",
                color: view === v ? "#fff" : "#000",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            >
              {v}
            </button>
          )
        )}
      </div>

      {view === "Custom" && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>
            Start:
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{ marginLeft: 4 }}
            />
          </label>
          <label>
            End:
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{ marginLeft: 4 }}
            />
          </label>
        </div>
      )}

      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
        >
          <CartesianGrid
            horizontal={false}
            vertical={false}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="dateTime"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={formatDateTime}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[
              (min) => Math.floor(min / 10) * 10,
              (max) => Math.ceil(max / 10) * 10 + 10,
            ]}
          />
          <Tooltip
            labelFormatter={formatDateTime}
            formatter={(val, name) => [
              val,
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Line
            type="linear"
            dataKey="systolic"
            stroke="#007bff"
            dot={{ r: 4 }}
          />
          <Line
            type="linear"
            dataKey="diastolic"
            stroke="#dc3545"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BloodPressureGraph;
