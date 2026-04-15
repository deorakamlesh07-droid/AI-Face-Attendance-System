import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { getAdminTeachers } from "../../services/subjectService";
import api from "../../services/api";

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "Teacher@123",
    employeeId: "",
    department: "Computer Science"
  });

  const load = async () => {
    const data = await getAdminTeachers();
    setTeachers(data.teachers);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    await api.post("/admin/teachers", form);
    setForm({ ...form, name: "", email: "", employeeId: "" });
    await load();
  };

  return (
    <div className="dashboard-grid">
      <Navbar title="Manage Teachers" subtitle="Faculty onboarding and subject ownership." />
      <section className="panel">
        <h3>Create Teacher</h3>
        <form className="form-grid" onSubmit={handleCreate}>
          <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span>Employee ID</span><input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></label>
          <label className="field"><span>Department</span><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
          <button className="primary-button">Create</button>
        </form>
      </section>
      <section className="panel">
        <h3>Teacher Records</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Employee ID</th></tr></thead>
          <tbody>{teachers.map((teacher) => <tr key={teacher._id}><td>{teacher.user?.name}</td><td>{teacher.user?.email}</td><td>{teacher.employeeId}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
