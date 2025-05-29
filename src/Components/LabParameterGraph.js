import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import useDatabase from "../Components/useDatabase";

const LabParameterGraph = () => {
  const { state } = useLocation();
  const { profileName, testName, parameter } = state || {};
  const { db } = useDatabase();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!db || !profileName || !testName || !parameter) return;
    try {
      const stmt = db.prepare(
        `SELECT date, time, result FROM LabReports 
         WHERE profileName = ? AND testName = ? AND parameter = ?
         ORDER BY date ASC, time ASC`
      );
      stmt.bind([profileName, testName, parameter]);

      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push({
          datetime: `${row.date} ${row.time}`,
          value: parseFloat(row.result),
        });
      }
      stmt.free();
      setData(rows);
    } catch (err) {
      console.error("Error loading parameter history:", err);
    }
  }, [db, profileName, testName, parameter]);

  if (!state) return <p>No data passed to graph screen.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>
        {testName} - {parameter} (Graph)
      </h2>
      {data.length === 0 ? (
        <p>No historical data available for this parameter.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="datetime" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LabParameterGraph;
