import React, { useState } from "react";

function App() {
  const [activeView, setActiveView] = useState("patients"); // 'patients' | 'admissions' | 'diagnoses' | 'prescriptions' | 'procedures'

  // patient lookup state
  const [searchSubjectId, setSearchSubjectId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAdmissions, setPatientAdmissions] = useState([]);

  // admission expansion state
  const [openAdmissionId, setOpenAdmissionId] = useState(null);
  const [admissionDetails, setAdmissionDetails] = useState({
    diagnoses: [],
    prescriptions: [],
    procedures: [],
  });

  // hospital-wide admissions
  const [allAdmissions, setAllAdmissions] = useState([]);

  // patient-wide rollups for summary tabs
  const [patientSummary, setPatientSummary] = useState({
    diagnoses: [],
    prescriptions: [],
    procedures: [],
  });

  // ---------- utilities ----------
  const fmt = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const brand = {
    bg: "#f6f7fb",
    card: "#ffffff",
    ink: "#0f172a",
    inkSubtle: "#475569",
    border: "#e2e8f0",
    pill: "#1f2937",
    pillActive: "#111827",
    accent: "#2563eb",
  };

  // ---------- API helpers ----------
  async function fetchAdmissionBundle(hadmId) {
    const diagPromise = fetch(
      `http://localhost:4000/api/admissions/${hadmId}/diagnoses`
    ).then((r) => r.json());

    const rxPromise = fetch(
      `http://localhost:4000/api/admissions/${hadmId}/prescriptions`
    ).then((r) => r.json());

    const procPromise = fetch(
      `http://localhost:4000/api/admissions/${hadmId}/procedures`
    ).then((r) => r.json());

    const [diagnoses, prescriptions, procedures] = await Promise.all([
      diagPromise,
      rxPromise,
      procPromise,
    ]);

    return {
      diagnoses: diagnoses || [],
      prescriptions: prescriptions || [],
      procedures: procedures || [],
    };
  }

  async function hydratePatientSummaryDetails(admissions) {
    const hadmIds = admissions.map((a) => a.HADM_ID);
    if (hadmIds.length === 0) {
      setPatientSummary({ diagnoses: [], prescriptions: [], procedures: [] });
      return;
    }

    try {
      const bundles = await Promise.all(hadmIds.map((id) => fetchAdmissionBundle(id)));

      const allDiag = new Set();
      const allRx = new Set();
      const allProc = new Set();

      for (const b of bundles) {
        b.diagnoses.forEach((code) => code && allDiag.add(code));
        b.prescriptions.forEach((drug) => drug && allRx.add(drug));
        b.procedures.forEach((code) => code && allProc.add(code));
      }

      setPatientSummary({
        diagnoses: Array.from(allDiag),
        prescriptions: Array.from(allRx),
        procedures: Array.from(allProc),
      });
    } catch (err) {
      console.error(err);
      setPatientSummary({
        diagnoses: ["(error loading)"],
        prescriptions: ["(error loading)"],
        procedures: ["(error loading)"],
      });
    }
  }

  // ---------- flows ----------
  async function handleFetchPatient() {
    if (!searchSubjectId.trim()) {
      setSelectedPatient(null);
      setPatientAdmissions([]);
      setOpenAdmissionId(null);
      setPatientSummary({ diagnoses: [], prescriptions: [], procedures: [] });
      return;
    }

    try {
      const patientInfoRes = await fetch(
        `http://localhost:4000/api/patients/${searchSubjectId.trim()}`
      );

      if (!patientInfoRes.ok) {
        setSelectedPatient({ error: "Patient not found" });
        setPatientAdmissions([]);
        setOpenAdmissionId(null);
        setPatientSummary({ diagnoses: [], prescriptions: [], procedures: [] });
        return;
      }

      const patientInfo = await patientInfoRes.json();

      const admissionsRes = await fetch(
        `http://localhost:4000/api/patients/${searchSubjectId.trim()}/admissions`
      );
      const adms = await admissionsRes.json();

      setSelectedPatient(patientInfo);
      setPatientAdmissions(adms);
      setOpenAdmissionId(null);
      setAdmissionDetails({ diagnoses: [], prescriptions: [], procedures: [] });

      await hydratePatientSummaryDetails(adms);
    } catch (err) {
      console.error(err);
      setSelectedPatient({ error: "Error fetching patient" });
      setPatientAdmissions([]);
      setOpenAdmissionId(null);
      setPatientSummary({ diagnoses: [], prescriptions: [], procedures: [] });
    }
  }

  async function handleOpenAdmission(hadmId) {
    if (openAdmissionId === hadmId) {
      setOpenAdmissionId(null);
      return;
    }
    setOpenAdmissionId(hadmId);

    try {
      const bundle = await fetchAdmissionBundle(hadmId);
      setAdmissionDetails(bundle);
    } catch (err) {
      console.error(err);
      setAdmissionDetails({
        diagnoses: ["(error loading)"],
        prescriptions: ["(error loading)"],
        procedures: ["(error loading)"],
      });
    }
  }

  async function loadAllAdmissions() {
    try {
      const res = await fetch(
        "http://localhost:4000/api/admissions?limit=50&offset=0"
      );
      const data = await res.json();
      setAllAdmissions(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // ---------- UI primitives ----------
  function renderTopNav() {
    const tabStyle = (tabName) => ({
      cursor: "pointer",
      padding: "10px 14px",
      borderRadius: "9999px",
      fontSize: "0.92rem",
      fontWeight: 600,
      background:
        activeView === tabName
          ? `linear-gradient(180deg, ${brand.accent}, #1e40af)`
          : "transparent",
      color: activeView === tabName ? "#fff" : brand.pill,
      border:
        activeView === tabName ? "1px solid transparent" : `1px solid ${brand.border}`,
      boxShadow:
        activeView === tabName
          ? "0 2px 8px rgba(37,99,235,0.35)"
          : "0 0 0 rgba(0,0,0,0)",
      transition: "all .15s ease",
      whiteSpace: "nowrap",
    });

    return (
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#fff",
          borderBottom: `1px solid ${brand.border}`,
          boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "nowrap",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 800,
              color: brand.ink,
              letterSpacing: ".2px",
            }}
          >
            Clinical Dashboard
          </div>

          <nav style={{ display: "flex", gap: 10, flexWrap: "nowrap" }}>
            <div style={tabStyle("patients")} onClick={() => setActiveView("patients")}>
              Patient
            </div>
            <div
              style={tabStyle("admissions")}
              onClick={() => {
                setActiveView("admissions");
                loadAllAdmissions();
              }}
            >
              Admissions
            </div>
            <div style={tabStyle("diagnoses")} onClick={() => setActiveView("diagnoses")}>
              Diagnoses
            </div>
            <div
              style={tabStyle("prescriptions")}
              onClick={() => setActiveView("prescriptions")}
            >
              Prescriptions
            </div>
            <div style={tabStyle("procedures")} onClick={() => setActiveView("procedures")}>
              Procedures
            </div>
          </nav>
        </div>
      </header>
    );
  }

  const Shell = ({ children }) => (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(241,245,249,0.6), rgba(255,255,255,0.9))",
      }}
    >
      {renderTopNav()}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px" }}>{children}</main>
    </div>
  );

  const Card = ({ title, subtitle, children, style }) => (
    <section
      style={{
        background: brand.card,
        border: `1px solid ${brand.border}`,
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
        overflow: "hidden",
        ...style,
      }}
    >
      {(title || subtitle) && (
        <header
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${brand.border}`,
            background: "#fbfdff",
          }}
        >
          {title && (
            <div style={{ fontSize: "1rem", fontWeight: 700, color: brand.ink }}>{title}</div>
          )}
          {subtitle && (
            <div style={{ marginTop: 4, color: brand.inkSubtle, fontSize: ".85rem" }}>
              {subtitle}
            </div>
          )}
        </header>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );

  // ---------- VIEWS ----------
  function renderPatientsView() {
    return (
      <Shell>
        <Card title="Patient Lookup" subtitle="Enter SUBJECT_ID to view the profile.">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={searchSubjectId}
              onChange={(e) => setSearchSubjectId(e.target.value)}
              placeholder="e.g. 10006"
              style={{
                width: 220,
                border: `1px solid ${brand.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: ".95rem",
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleFetchPatient()}
            />
            <button
              onClick={handleFetchPatient}
              style={{
                background: `linear-gradient(180deg, ${brand.accent}, #1e40af)`,
                border: "none",
                color: "white",
                fontSize: ".95rem",
                fontWeight: 700,
                borderRadius: 9999,
                padding: "10px 14px",
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(37,99,235,0.35)",
              }}
            >
              Load Patient
            </button>
          </div>

          {selectedPatient?.error && (
            <div
              style={{
                marginTop: 14,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: 10,
                padding: 12,
                fontSize: ".92rem",
              }}
            >
              {selectedPatient.error}
            </div>
          )}

          {!selectedPatient && (
            <div
              style={{
                marginTop: 16,
                color: brand.inkSubtle,
                fontStyle: "italic",
                fontSize: ".95rem",
              }}
            >
              No patient loaded. Search by SUBJECT_ID above.
            </div>
          )}
        </Card>

        {selectedPatient && !selectedPatient.error && (
          <>
            <div style={{ height: 14 }} />
            <Card title={`Patient ${selectedPatient.SUBJECT_ID}`}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  fontSize: ".95rem",
                }}
              >
                <div>
                  <b>Gender:</b> {selectedPatient.GENDER}
                </div>
                <div>
                  <b>DOB:</b> {fmt(selectedPatient.DOB)}
                </div>
                <div>
                  <b>DOD:</b> {selectedPatient.DOD ? fmt(selectedPatient.DOD) : "Alive / Not recorded"}
                </div>
                <div>
                  <b>Expired flag:</b> {selectedPatient.EXPIRE_FLAG === 1 ? "Yes" : "No"}
                </div>
              </div>
            </Card>

            <div style={{ height: 14 }} />
            <Card title={`Admissions (${patientAdmissions.length})`}>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: ".9rem",
                    minWidth: 820,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f1f5f9",
                        textAlign: "left",
                        color: brand.ink,
                        fontWeight: 700,
                        borderBottom: `1px solid ${brand.border}`,
                      }}
                    >
                      <th style={{ padding: "10px 12px" }}>HADM_ID</th>
                      <th style={{ padding: "10px 12px" }}>Admit</th>
                      <th style={{ padding: "10px 12px" }}>Discharge</th>
                      <th style={{ padding: "10px 12px" }}>Type</th>
                      <th style={{ padding: "10px 12px" }}>Dx Summary</th>
                      <th style={{ padding: "10px 12px" }}>Expired?</th>
                      <th style={{ padding: "10px 12px" }}>More</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientAdmissions.map((a, i) => (
                      <React.Fragment key={a.HADM_ID}>
                        <tr
                          style={{
                            background: i % 2 ? "#fff" : "#fbfdff",
                            color: brand.ink,
                          }}
                        >
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}`, fontFamily: "monospace" }}>
                            {a.HADM_ID}
                          </td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>
                            {fmt(a.ADMITTIME)}
                          </td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>
                            {fmt(a.DISCHTIME)}
                          </td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}`, fontWeight: 600 }}>
                            {a.ADMISSION_TYPE}
                          </td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>{a.DIAGNOSIS}</td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>
                            {a.HOSPITAL_EXPIRE_FLAG === 1 ? "Yes" : "No"}
                          </td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>
                            <button
                              onClick={() => handleOpenAdmission(a.HADM_ID)}
                              style={{
                                background: openAdmissionId === a.HADM_ID ? brand.pillActive : brand.pill,
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontSize: ".8rem",
                              }}
                            >
                              {openAdmissionId === a.HADM_ID ? "Hide" : "Details"}
                            </button>
                          </td>
                        </tr>

                        {openAdmissionId === a.HADM_ID && (
                          <tr style={{ background: "#f8fafc" }}>
                            <td colSpan={7} style={{ padding: 14, borderBottom: `1px solid ${brand.border}` }}>
                              <div style={{ fontSize: ".9rem", lineHeight: "1.5rem", color: brand.ink }}>
                                <div style={{ fontWeight: 800, marginBottom: 8 }}>
                                  Admission {openAdmissionId} details
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                  <b>Diagnoses (ICD9):</b>{" "}
                                  <span style={{ fontFamily: "monospace" }}>
                                    {admissionDetails.diagnoses.length
                                      ? admissionDetails.diagnoses.join(", ")
                                      : "— none —"}
                                  </span>
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                  <b>Prescriptions:</b>{" "}
                                  <span style={{ fontFamily: "monospace" }}>
                                    {admissionDetails.prescriptions.length
                                      ? admissionDetails.prescriptions.join(", ")
                                      : "— none —"}
                                  </span>
                                </div>
                                <div>
                                  <b>Procedures (ICD9):</b>{" "}
                                  <span style={{ fontFamily: "monospace" }}>
                                    {admissionDetails.procedures.length
                                      ? admissionDetails.procedures.join(", ")
                                      : "— none —"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </Shell>
    );
  }

  function renderAdmissionsView() {
    return (
      <Shell>
        <Card title="Recent Admissions (last 50)" subtitle="Most recent encounters across the hospital.">
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: ".9rem",
                minWidth: 900,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f1f5f9",
                    textAlign: "left",
                    color: brand.ink,
                    fontWeight: 800,
                    borderBottom: `1px solid ${brand.border}`,
                  }}
                >
                  <th style={{ padding: "10px 12px" }}>HADM_ID</th>
                  <th style={{ padding: "10px 12px" }}>SUBJECT_ID</th>
                  <th style={{ padding: "10px 12px" }}>Admit</th>
                  <th style={{ padding: "10px 12px" }}>Discharge</th>
                  <th style={{ padding: "10px 12px" }}>Type</th>
                  <th style={{ padding: "10px 12px" }}>Dx Summary</th>
                  <th style={{ padding: "10px 12px" }}>Expired?</th>
                </tr>
              </thead>
              <tbody>
                {allAdmissions.map((adm, i) => (
                  <tr key={adm.HADM_ID} style={{ background: i % 2 ? "#fff" : "#fbfdff" }}>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}`, fontFamily: "monospace" }}>
                      {adm.HADM_ID}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}`, fontFamily: "monospace" }}>
                      {adm.SUBJECT_ID}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>{fmt(adm.ADMITTIME)}</td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>{fmt(adm.DISCHTIME)}</td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}`, fontWeight: 700 }}>
                      {adm.ADMISSION_TYPE}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>{adm.DIAGNOSIS}</td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${brand.border}` }}>
                      {adm.HOSPITAL_EXPIRE_FLAG === 1 ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}

                {allAdmissions.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 18,
                        textAlign: "center",
                        color: brand.inkSubtle,
                        fontStyle: "italic",
                      }}
                    >
                      No admissions loaded. Click the “Admissions” tab to refresh.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Shell>
    );
  }

  function renderSummaryListView(title, data, emptyMessage) {
    return (
      <Shell>
        <Card title={`${title} for ${selectedPatient ? selectedPatient.SUBJECT_ID : "(none)"}`}>
          {!selectedPatient && (
            <div style={{ color: brand.inkSubtle, fontStyle: "italic" }}>
              No patient selected. Go to Patient tab and load a SUBJECT_ID first.
            </div>
          )}

          {selectedPatient && data.length === 0 && (
            <div style={{ color: brand.inkSubtle, fontStyle: "italic" }}>{emptyMessage}</div>
          )}

          {selectedPatient && data.length > 0 && (
            <ul style={{ fontSize: ".95rem", color: brand.ink, lineHeight: "1.6rem" }}>
              {data.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${brand.border}`,
                    padding: "8px 2px",
                    fontFamily: title.includes("ICD9") ? "monospace" : "inherit",
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Shell>
    );
  }

  // ---------- MAIN ----------
  return (
    <>
      {activeView === "patients" && renderPatientsView()}
      {activeView === "admissions" && renderAdmissionsView()}
      {activeView === "diagnoses" &&
        renderSummaryListView("Diagnoses (ICD9 Codes)", patientSummary.diagnoses, "No diagnoses found.")}
      {activeView === "prescriptions" &&
        renderSummaryListView("Prescriptions (Meds Ordered)", patientSummary.prescriptions, "No prescriptions found.")}
      {activeView === "procedures" &&
        renderSummaryListView("Procedures (ICD9 Codes)", patientSummary.procedures, "No procedures found.")}
    </>
  );
}

export default App;
