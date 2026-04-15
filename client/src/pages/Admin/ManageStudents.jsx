import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createStudent, getAdminStudents, getReferenceData, trainStudentFacesAsAdmin } from "../../services/subjectService";
import { filesToBase64 } from "../../utils/helpers";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "Student@123",
    rollNo: "",
    branchId: "",
    year: 1,
    section: "A",
    parentEmail: ""
  });
  const [training, setTraining] = useState({ studentId: "", files: [] });

  const load = async () => {
    const [studentData, referenceData] = await Promise.all([getAdminStudents(), getReferenceData()]);
    setStudents(studentData.students);
    setBranches(referenceData.branches);
    setForm((current) => ({ ...current, branchId: current.branchId || referenceData.branches?.[0]?._id || "" }));
    setTraining((current) => ({ ...current, studentId: current.studentId || studentData.students?.[0]?._id || "" }));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    await createStudent(form);
    setForm((current) => ({ ...current, name: "", email: "", rollNo: "", parentEmail: "" }));
    await load();
  };

  const handleTraining = async (event) => {
    event.preventDefault();
    const images = await filesToBase64(training.files);
    await trainStudentFacesAsAdmin(training.studentId, images);
    setTraining((current) => ({ ...current, files: [] }));
  };

  return (
    <div className="dashboard-grid">
      <Navbar title="Manage Students" subtitle="Create student records and train face embeddings." />
      <div className="section-grid">
        <section className="panel">
          <h3>Create Student</h3>
          <form className="form-grid" onSubmit={handleCreate}>
            <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="field"><span>Roll No</span><input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} /></label>
            <label className="field"><span>Branch</span><select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}</select></label>
            <label className="field"><span>Year</span><input value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></label>
            <label className="field"><span>Section</span><input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></label>
            <label className="field"><span>Parent Email</span><input value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} /></label>
            <button className="primary-button">Create</button>
          </form>
        </section>
        <section className="panel">
          <h3>Train Faces</h3>
          <form className="form-grid" onSubmit={handleTraining}>
            <label className="field"><span>Student</span><select value={training.studentId} onChange={(e) => setTraining({ ...training, studentId: e.target.value })}>{students.map((student) => <option key={student._id} value={student._id}>{student.user?.name} ({student.rollNo})</option>)}</select></label>
            <label className="field"><span>Images</span><input type="file" multiple accept="image/*" onChange={(e) => setTraining({ ...training, files: e.target.files })} /></label>
            <button className="primary-button">Train</button>
          </form>
        </section>
      </div>
      <section className="panel">
        <h3>Student Records</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Roll No</th><th>Branch</th><th>Year</th><th>Section</th></tr></thead>
          <tbody>{students.map((student) => <tr key={student._id}><td>{student.user?.name}</td><td>{student.rollNo}</td><td>{student.branch?.code}</td><td>{student.year}</td><td>{student.section}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
