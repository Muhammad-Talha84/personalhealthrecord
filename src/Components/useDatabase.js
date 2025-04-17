// useDatabase.js
import { useState, useEffect } from "react";
import initSqlJs from "sql.js";

const DATABASE_KEY = "myHealthDatabase";

function useDatabase() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    async function initDb() {
      // Initialize sql.js with the location of the wasm file
      const SQL = await initSqlJs({
        locateFile: (file) => `/sql-wasm.wasm`,
      });

      let dbInstance;
      const savedDb = localStorage.getItem(DATABASE_KEY);
      if (savedDb) {
        // Decode the saved base64 string into a Uint8Array
        const binaryString = atob(savedDb);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        dbInstance = new SQL.Database(bytes);
      } else {
        // No saved database, so create a new one
        dbInstance = new SQL.Database();
        // Create a "users" table to store signup data
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fname TEXT,
            lname TEXT,
            email TEXT UNIQUE,
            password TEXT
          );
        `);
      }

      // Always run these commands to ensure the tables exist.
      dbInstance.run(`
      CREATE TABLE IF NOT EXISTS Vitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profileName TEXT,
        vitalName TEXT, -- new column
        type TEXT,
        value TEXT,
        unit TEXT,
        date TEXT,
        time TEXT
      );
      
      `);

      // If the table existed before without vitalName, add it
      try {
        dbInstance.run(`ALTER TABLE Vitals ADD COLUMN vitalName TEXT;`);
      } catch (e) {
        // column already exists → ignore
      }
      dbInstance.run(`
      CREATE TABLE IF NOT EXISTS LabReports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profileName TEXT,
        testName TEXT,
        parameter TEXT, -- T3, T4, TSH etc.
        result TEXT,
        unit TEXT,
        referenceValue TEXT,
        date TEXT,
        time TEXT,
        minValue REAL,
        maxValue REAL
      );
      
      `);
      // If the table existed before without vitalName, add it
      try {
        dbInstance.run(`ALTER TABLE LabReports ADD COLUMN parameter TEXT;`);
      } catch (e) {
        // column already exists → ignore
      }

      setDb(dbInstance);
    }
    initDb();
  }, []);

  // Function to persist the database state to localStorage
  const saveDatabase = () => {
    if (!db) return;
    const data = db.export();
    const binaryString = Array.from(data)
      .map((byte) => String.fromCharCode(byte))
      .join("");
    const base64 = btoa(binaryString);
    localStorage.setItem(DATABASE_KEY, base64);
  };

  return { db, saveDatabase };
}

export default useDatabase;
