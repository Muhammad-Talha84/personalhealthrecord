import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AiOutlineArrowLeft } from "react-icons/ai";

const BloodPressureGraph = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data || [];

  // Map data: parse the systolic/diastolic values and create a combined dateTime field
  const chartData = data.map((record) => {
    const [systolic, diastolic] = record.value.split("/");
    return {
      ...record,
      dateTime: `${record.date} ${record.time}`,
      systolic: parseFloat(systolic),
      diastolic: parseFloat(diastolic),
    };
  });

  return (
    <div className="bloodpressurecontainer">
      <h2>Blood Pressure Graph</h2>
      <div className="graph-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="dateTime" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="systolic" stroke="#8884d8" />
            <Line type="monotone" dataKey="diastolic" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BloodPressureGraph;
