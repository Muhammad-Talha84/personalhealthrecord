import { useState, useEffect, useCallback } from "react";
import initSqlJs from "sql.js";

const DATABASE_KEY = "myHealthDatabase";
const WASM_FILE = "/sql-wasm.wasm";

function useDatabase() {
  const [db, setDb] = useState(null);

  // Initialize the database instance
  const initDb = useCallback(async () => {
    // Load and configure sql.js
    const SQL = await initSqlJs({
      locateFile: (file) => WASM_FILE,
    });

    let dbInstance;
    const savedDb = localStorage.getItem(DATABASE_KEY);

    if (savedDb) {
      // Restore from localStorage
      const bytes = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0));
      dbInstance = new SQL.Database(bytes);
    } else {
      // Create a new database
      dbInstance = new SQL.Database();
    }

    // SQL statements to create tables if they don't exist
    const createTables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fname TEXT,
        lname TEXT,
        email TEXT UNIQUE,
        password TEXT
      );`,

      `CREATE TABLE IF NOT EXISTS Vitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profileName TEXT,
        vitalName TEXT,
        type TEXT,
        value REAL,
        unit TEXT,
        date TEXT,
        time TEXT,
        minValue REAL,
        maxValue REAL
      );`,

      `CREATE TABLE IF NOT EXISTS LabReports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profileName TEXT,
        testName TEXT,
        parameter TEXT,
        result TEXT,
        unit TEXT,
        referenceValue TEXT,
        date TEXT,
        time TEXT,
        minValue REAL,
        maxValue REAL
      );`,
    ];

    createTables.forEach((sql) => dbInstance.run(sql));

    // Backwards-compatibility: add columns if missing
    const alterStatements = [
      `ALTER TABLE Vitals ADD COLUMN vitalName TEXT;`,
      `ALTER TABLE Vitals ADD COLUMN minValue REAL;`,
      `ALTER TABLE Vitals ADD COLUMN maxValue REAL;`,
      `ALTER TABLE LabReports ADD COLUMN parameter TEXT;`,
    ];

    alterStatements.forEach((stmt) => {
      try {
        dbInstance.run(stmt);
      } catch {
        // ignore if column already exists
      }
    });

    setDb(dbInstance);
  }, []);

  // On mount, initialize the DB
  useEffect(() => {
    initDb();
  }, [initDb]);

  // Persist database to localStorage
  const saveDatabase = useCallback(() => {
    if (!db) return;
    const data = db.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DATABASE_KEY, base64);
  }, [db]);

  return { db, saveDatabase };
}

export default useDatabase;
