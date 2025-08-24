import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlineArrowLeft } from "react-icons/ai";

const BloodPressureTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data || [];

  // Map data: parse the systolic/diastolic values
  const tableData = data.map((record) => {
    const [systolic, diastolic] = record.value.split("/");
    return {
      ...record,
      systolic,
      diastolic,
    };
  });

  return (
    <div className="bloodpressurecontainer">
      <h2>Blood Pressure Table</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Systolic</th>
            <th>Diastolic</th>
            <th>Note:</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((entry, index) => (
            <tr key={index}>
              <td>{entry.date}</td>
              <td>{entry.time}</td>
              <td>{entry.systolic}</td>
              <td>{entry.diastolic}</td>
              <td>{entry.vitalNote}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BloodPressureTable;
