import { useEffect, useRef, useState } from "react";
import { http } from "../api/http";
import { StatCard } from "../components/ui/StatCard";
import { AttendanceTrendChart } from "../components/charts/AttendanceTrendChart";
import { AttendanceStatusChart } from "../components/charts/AttendanceStatusChart";
import { AttendanceSubjectChart } from "../components/charts/AttendanceSubjectChart";
import { fileToBase64 } from "../lib/images";
import { COLLEGE } from "../lib/college";

const formatMarkedTime = (value) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
};

const getImageFromVideo = (video) => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext("2d").drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9);
};

export const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [history, setHistory] = useState([]);
  const [roster, setRoster] = useState([]);
  const [selection, setSelection] = useState({ subjectId: "", branchId: "", year: 4, section: "A" });
  const [manual, setManual] = useState({ studentId: "", status: "present" });
  const [capture, setCapture] = useState({ file: null, preview: "", status: "", lastMarkedAt: 0, busy: false });
  const videoRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const [subjectsRes, historyRes] = await Promise.all([
        http.get("/teacher/subjects"),
        http.get("/teacher/attendance/history")
      ]);

      setSubjects(subjectsRes.data.subjects);
      setHistory(historyRes.data.attendance);

      if (subjectsRes.data.subjects[0]) {
        const subject = subjectsRes.data.subjects[0];
        setSelection({
          subjectId: subject._id,
          branchId: subject.branch?._id || "",
          year: subject.year,
          section: subject.section
        });
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .catch(() => {
              // Autoplay can be delayed by the browser; capture will retry when requested.
            });
        }
      })
      .catch(() => {
        setCapture((current) => ({
          ...current,
          status: "Webcam access was blocked. You can still upload an individual or group photo for attendance."
        }));
      });

    load();

    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream && "getTracks" in stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startSession = async () => {
    const { data } = await http.post("/teacher/attendance/session", selection);
    setSession(data.session);
    setMatches([]);
    const rosterRes = await http.get("/teacher/roster", {
      params: {
        branchId: selection.branchId,
        year: selection.year,
        section: selection.section
      }
    });
    setRoster(rosterRes.data.students);
    setManual((current) => ({ ...current, studentId: rosterRes.data.students?.[0]?._id || "" }));
    setCapture((current) => ({ ...current, status: "", lastMarkedAt: 0 }));
  };

  const refreshHistory = async () => {
    const historyRes = await http.get("/teacher/attendance/history");
    setHistory(historyRes.data.attendance);
  };

  const recognizeImage = async (image) => {
    if (!session) return;
    const waitRemaining = Math.max(0, 2000 - (Date.now() - capture.lastMarkedAt));

    setCapture((current) => ({ ...current, busy: true, status: waitRemaining ? "Waiting 2 seconds before next mark..." : "" }));

    try {
      if (waitRemaining) {
        await new Promise((resolve) => setTimeout(resolve, waitRemaining));
      }

      const { data } = await http.post(`/teacher/attendance/session/${session._id}/recognize`, { image });
      setMatches(data.matches);
      await refreshHistory();

      setCapture((current) => ({
        ...current,
        busy: false,
        lastMarkedAt: Date.now(),
        status: data.matches.length
          ? `Detected ${data.matches.length} student${data.matches.length > 1 ? "s" : ""} from the uploaded image.`
          : "No enrolled student was matched in that image."
      }));
    } catch (error) {
      setCapture((current) => ({
        ...current,
        busy: false,
        status: error.response?.data?.message || error.response?.data?.detail || "Face detection failed for this image."
      }));
    }
  };

  const scanFrame = async () => {
    if (!session || !videoRef.current) return;

    const waitForCamera = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (videoRef.current?.readyState >= 2 && videoRef.current?.videoWidth && videoRef.current?.videoHeight) {
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      return false;
    };

    const ready = await waitForCamera();
    if (!ready) {
      setCapture((current) => ({
        ...current,
        status: "Webcam is not ready yet. Wait a moment, or use photo upload for attendance."
      }));
      return;
    }
    const image = getImageFromVideo(videoRef.current);
    await recognizeImage(image);
  };

  const stopSession = async () => {
    if (!session) return;

    try {
      await http.patch(`/teacher/attendance/session/${session._id}/stop`);
      await refreshHistory();
      setSession(null);
      setMatches([]);
      setRoster([]);
      setCapture((current) => ({
        ...current,
        busy: false,
        file: null,
        preview: "",
        status: "Attendance session stopped successfully.",
        lastMarkedAt: 0
      }));
    } catch (error) {
      setCapture((current) => ({
        ...current,
        status: error.response?.data?.message || "Unable to stop the current attendance session."
      }));
    }
  };

  const manualOverride = async () => {
    if (!session) return;
    await http.patch(`/teacher/attendance/session/${session._id}/manual`, manual);
    await refreshHistory();
  };

  const uploadAttendancePhoto = async () => {
    if (!session || !capture.file) return;
    const image = await fileToBase64(capture.file);
    await recognizeImage(image);
  };

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = await fileToBase64(file);
    setCapture((current) => ({
      ...current,
      file,
      preview,
      status: "Photo ready. Upload a single-student or group image to detect attendance."
    }));
  };

  const dailyData = Object.values(
    history.reduce((acc, row) => {
      if (!acc[row.date]) {
        acc[row.date] = { name: row.date.slice(5), attendance: 0 };
      }
      if (row.status === "present" || row.status === "late") {
        acc[row.date].attendance += 1;
      }
      return acc;
    }, {})
  );

  const statusData = ["present", "late", "absent", "excused"].map((status) => ({
    name: status,
    value: history.filter((row) => row.status === status).length
  }));

  const subjectData = Object.values(
    history.reduce((acc, row) => {
      const key = row.subject?.code || row.subject?.name || "Unknown";
      if (!acc[key]) {
        acc[key] = { name: key, total: 0, present: 0, percentage: 0 };
      }
      acc[key].total += 1;
      if (row.status === "present" || row.status === "late") {
        acc[key].present += 1;
      }
      acc[key].percentage = Number(((acc[key].present / acc[key].total) * 100).toFixed(2));
      return acc;
    }, {})
  );

  const activeStudent = roster[0];
  const presentRate = history.length
    ? Number(
        ((history.filter((row) => row.status === "present" || row.status === "late").length / history.length) * 100).toFixed(2)
      )
    : 0;

  return (
    <div className="dashboard-grid">
      <div>
        <p className="eyebrow">Teacher panel</p>
        <h2>Real-time attendance capture</h2>
        <p className="muted">
          Run live attendance for {COLLEGE.name}, inspect student statistics, and use seeded data to review charts even
          before a new class starts.
        </p>
      </div>

      <div className="stats-grid">
        <StatCard title="Assigned subjects" value={subjects.length} subtitle="Role-restricted access" />
        <StatCard title="Live session" value={session ? "Active" : "Idle"} subtitle="Attendance mode" />
        <StatCard title="Matches" value={matches.length} subtitle="Current frame" />
        <StatCard title="Roster size" value={roster.length || 1} subtitle="Active class list" />
        <StatCard title="Present rate" value={`${presentRate}%`} subtitle="Teacher-owned subjects" />
      </div>

      <div className="section-grid">
        <section className="panel">
          <p className="eyebrow">Attendance session</p>
          <h3>Class controls</h3>
          <div className="form-grid">
            <label className="field">
              <span>Subject</span>
              <select
                value={selection.subjectId}
                onChange={(e) => {
                  const subject = subjects.find((item) => item._id === e.target.value);
                  setSelection({
                    subjectId: e.target.value,
                    branchId: subject?.branch?._id || "",
                    year: subject?.year || selection.year,
                    section: subject?.section || selection.section
                  });
                }}
              >
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Year</span>
              <input value={selection.year} onChange={(e) => setSelection({ ...selection, year: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>Section</span>
              <input value={selection.section} onChange={(e) => setSelection({ ...selection, section: e.target.value })} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button className="primary-button" onClick={startSession}>
              Start session
            </button>
            <button className="ghost-button" onClick={scanFrame} disabled={!session || capture.busy}>
              Capture webcam
            </button>
            <button className="ghost-button" onClick={stopSession} disabled={!session}>
              Stop session
            </button>
          </div>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", borderRadius: 20, marginTop: 20 }}
          />
          <div className="form-grid" style={{ marginTop: 20 }}>
            <label className="field">
              <span>Upload individual or group photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} />
            </label>
            <button
              type="button"
              className="primary-button"
              style={{ alignSelf: "end" }}
              onClick={uploadAttendancePhoto}
              disabled={!session || !capture.file || capture.busy}
            >
              Detect from photo
            </button>
          </div>
          {capture.status ? <p className="muted" style={{ marginTop: 16 }}>{capture.status}</p> : null}
          {capture.preview ? (
            <img src={capture.preview} alt="Attendance capture preview" className="face-image" style={{ marginTop: 16 }} />
          ) : null}
        </section>

        <section className="panel">
          <p className="eyebrow">Recognition events</p>
          <h3>Latest matches</h3>
          {matches.length ? (
            matches.map((match) => (
              <div key={match.studentId} className="profile-card" style={{ marginTop: 12 }}>
                <span className="pill">{match.confidence}% match</span>
                <h4>{match.name}</h4>
                <p>Liveness: {match.livenessScore}</p>
              </div>
            ))
          ) : (
            <p className="muted">No faces matched yet. Start a session, then use the webcam or upload a single/group photo.</p>
          )}
        </section>
      </div>

      <div className="section-grid">
        <AttendanceTrendChart data={dailyData} title="Attendance trend by lecture" gradientId="teacherTrend" />
        <AttendanceStatusChart data={statusData} title="Recognition and attendance split" />
      </div>

      <div className="section-grid">
        <section className="panel">
          <p className="eyebrow">Manual control</p>
          <h3>Override attendance</h3>
          <div className="form-grid">
            <label className="field">
              <span>Student</span>
              <select value={manual.studentId} onChange={(e) => setManual({ ...manual, studentId: e.target.value })}>
                {roster.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.user?.name} ({student.rollNo})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select value={manual.status} onChange={(e) => setManual({ ...manual, status: e.target.value })}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </label>
            <button
              type="button"
              className="ghost-button"
              style={{ alignSelf: "end" }}
              onClick={manualOverride}
              disabled={!session}
            >
              Apply override
            </button>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Seeded student profile</p>
          <h3>Student identity and face samples</h3>
          {activeStudent ? (
            <>
              <div className="detail-grid">
                <div className="profile-card compact-card">
                  <span className="pill">Name</span>
                  <h4>{activeStudent.user?.name}</h4>
                  <p>{activeStudent.collegeId || activeStudent.admissionNo || activeStudent.rollNo}</p>
                </div>
                <div className="profile-card compact-card">
                  <span className="pill">Class</span>
                  <h4>
                    {(activeStudent.branch?.code || "CSE").toUpperCase()} Year {activeStudent.year}
                  </h4>
                  <p>Section {activeStudent.section}</p>
                </div>
              </div>
              <div className="image-grid" style={{ marginTop: 16 }}>
                {(activeStudent.sampleFaceImages || []).map((image, index) => (
                  <img key={image} src={image} alt={`Student face ${index + 1}`} className="face-image" />
                ))}
              </div>
            </>
          ) : (
            <p className="muted">Start a session to load the seeded roster profile.</p>
          )}
        </section>
      </div>

      <div className="section-grid">
        <AttendanceSubjectChart data={subjectData} title="Subject-wise teacher performance" />
        <section className="panel">
          <p className="eyebrow">Photo-driven attendance</p>
          <h3>Single or group detection</h3>
          <p className="muted" style={{ marginTop: 16 }}>
            The teacher flow now uses one attendance capture area. Start a session, upload an individual or group photo,
            and the system will detect all matched students with a 2-second gap between attendance marks.
          </p>
        </section>
      </div>

      <section className="panel">
        <p className="eyebrow">History</p>
        <h3>Recorded attendance</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>College ID</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Marked time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row._id}>
                <td>{row.student?.user?.name || "Unknown"}</td>
                <td>{row.student?.collegeId || row.student?.admissionNo || row.student?.rollNo || "N/A"}</td>
                <td>{row.subject?.name}</td>
                <td>{row.date}</td>
                <td>{formatMarkedTime(row.markedAt || row.createdAt)}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
