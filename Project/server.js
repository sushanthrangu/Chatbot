const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());

// 1. MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,                 // ← add this to be explicit
    user: 'root',
    password: 'Sushanth#31',  // <-- put your actual password
    database: 'mimiciiiv14',
    waitForConnections: true,
    connectionLimit: 10,
  });
  

// 2. GET /api/patients?limit=50&offset=0
app.get('/api/patients', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    const [rows] = await pool.query(
      `SELECT SUBJECT_ID, GENDER, DOB, EXPIRE_FLAG
       FROM PATIENTS
       ORDER BY SUBJECT_ID
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      data: rows,
      paging: { limit, offset }
    });
  } catch (err) {
    console.error('Error in /api/patients:', err);
    res.status(500).json({ error: 'database error' });
  }
});

// 3. GET /api/patients/:subjectId
app.get('/api/patients/:subjectId', async (req, res) => {
  try {
    const subjectId = req.params.subjectId;

    const [patientRows] = await pool.query(
      `SELECT SUBJECT_ID, GENDER, DOB, DOD, EXPIRE_FLAG
       FROM PATIENTS
       WHERE SUBJECT_ID = ?`,
      [subjectId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }

    res.json(patientRows[0]);
  } catch (err) {
    console.error('Error in /api/patients/:subjectId:', err);
    res.status(500).json({ error: 'database error' });
  }
});

// GET /api/admissions?limit=50&offset=0
app.get('/api/admissions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);
  
      const [rows] = await pool.query(
        `SELECT HADM_ID,
                SUBJECT_ID,
                ADMITTIME,
                DISCHTIME,
                ADMISSION_TYPE,
                DIAGNOSIS,
                HOSPITAL_EXPIRE_FLAG
         FROM ADMISSIONS
         ORDER BY ADMITTIME DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
  
      res.json({
        data: rows,
        paging: { limit, offset }
      });
    } catch (err) {
      console.error('Error in /api/admissions:', err);
      res.status(500).json({ error: 'database error' });
    }
  });
  
// 4. GET /api/patients/:subjectId/admissions
app.get('/api/patients/:subjectId/admissions', async (req, res) => {
  try {
    const subjectId = req.params.subjectId;

    const [admRows] = await pool.query(
      `SELECT HADM_ID,
              ADMITTIME,
              DISCHTIME,
              ADMISSION_TYPE,
              DIAGNOSIS,
              HOSPITAL_EXPIRE_FLAG
       FROM ADMISSIONS
       WHERE SUBJECT_ID = ?
       ORDER BY ADMITTIME DESC`,
      [subjectId]
    );

    res.json(admRows);
  } catch (err) {
    console.error('Error in /api/patients/:subjectId/admissions:', err);
    res.status(500).json({ error: 'database error' });
  }
});

// Get diagnoses for an admission
app.get('/api/admissions/:hadmId/diagnoses', async (req, res) => {
    try {
      const hadmId = req.params.hadmId;
      const [rows] = await pool.query(
        `SELECT ICD9_CODE
           FROM DIAGNOSES_ICD
          WHERE HADM_ID = ?
          ORDER BY SEQ_NUM ASC`,
        [hadmId]
      );
      res.json(rows.map(r => r.ICD9_CODE));
    } catch (err) {
      console.error('Error /diagnoses:', err);
      res.status(500).json({ error: 'database error' });
    }
  });
  
  // Get prescriptions for an admission
  app.get('/api/admissions/:hadmId/prescriptions', async (req, res) => {
    try {
      const hadmId = req.params.hadmId;
      const [rows] = await pool.query(
        `SELECT DRUG
           FROM PRESCRIPTIONS
          WHERE HADM_ID = ?
          AND DRUG IS NOT NULL
          LIMIT 50`,
        [hadmId]
      );
      res.json(rows.map(r => r.DRUG));
    } catch (err) {
      console.error('Error /prescriptions:', err);
      res.status(500).json({ error: 'database error' });
    }
  });
  
  // Get procedures for an admission
  app.get('/api/admissions/:hadmId/procedures', async (req, res) => {
    try {
      const hadmId = req.params.hadmId;
      const [rows] = await pool.query(
        `SELECT ICD9_CODE
           FROM PROCEDURES_ICD
          WHERE HADM_ID = ?
          ORDER BY SEQ_NUM ASC`,
        [hadmId]
      );
      res.json(rows.map(r => r.ICD9_CODE));
    } catch (err) {
      console.error('Error /procedures:', err);
      res.status(500).json({ error: 'database error' });
    }
  });
  
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
