import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api";
const DOCTOR_PASSWORD = "MedSlot@Doctor2026";

function App() {
  const [loggedInPatient, setLoggedInPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [doctorPassword, setDoctorPassword] = useState("");
  const [doctorUnlocked, setDoctorUnlocked] = useState(false);
  const [doctorPasswordError, setDoctorPasswordError] = useState("");

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [bookingForm, setBookingForm] = useState({
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Load doctors from the backend.
  useEffect(() => {
    async function fetchDoctors() {
      setDoctorsLoading(true);
      setDoctorsError("");

      try {
        const response = await fetch(`${API}/doctors`);

        if (!response.ok) {
          throw new Error("Unable to load doctors.");
        }

        const data = await response.json();
        setDoctors(Array.isArray(data) ? data : []);
      } catch {
        setDoctorsError(
          "Could not load doctors. Check whether the backend is running."
        );
      } finally {
        setDoctorsLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  // Load appointments from the database.
  async function fetchAppointments() {
    setAppointmentsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/appointments`);

      if (!response.ok) {
        throw new Error("Unable to load appointments.");
      }

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message || "Could not load appointments.");
    } finally {
      setAppointmentsLoading(false);
    }
  }

  // Open the Doctor Approval password screen.
  function openDoctorPanel() {
    setDoctorPassword("");
    setDoctorPasswordError("");
    setDoctorUnlocked(false);
    setActiveTab("doctorLogin");
    setMessage("");
  }

  // Check the demonstration password.
  function handleDoctorLogin(e) {
    e.preventDefault();
    setDoctorPasswordError("");

    if (doctorPassword === DOCTOR_PASSWORD) {
      setDoctorUnlocked(true);
      setDoctorPassword("");
      setActiveTab("doctorPanel");
      fetchAppointments();
    } else {
      setDoctorPasswordError("Incorrect password. Please try again.");
      setDoctorPassword("");
    }
  }

  // Lock the Doctor Approval panel.
  function handleDoctorLogout() {
    setDoctorUnlocked(false);
    setDoctorPassword("");
    setDoctorPasswordError("");
    setActiveTab("home");
    setMessage("");
  }

  // Patient registration.
  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/patients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Registration failed."
        );
      }

      setMessage("Registration successful! Please log in.");

      setRegisterForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      setActiveTab("login");
    } catch (error) {
      setMessage(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  // Patient login.
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/patients/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed.");
      }

      const patient = data.patient || data;

      setLoggedInPatient(patient);
      setLoginForm({ email: "", password: "" });
      setMessage("");
      setActiveTab("dashboard");
    } catch (error) {
      setMessage(error.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  // Book an appointment.
  async function handleBooking(e) {
    e.preventDefault();
    setMessage("");

    if (!loggedInPatient) {
      setMessage("Please log in before booking.");
      setActiveTab("login");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        patientId: loggedInPatient.patientId,
        doctorId: Number(bookingForm.doctorId),
        appointmentDate: bookingForm.appointmentDate,
        appointmentTime: bookingForm.appointmentTime,
        reason: bookingForm.reason,
      };

      const response = await fetch(`${API}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Booking failed. Check the backend appointment endpoint."
        );
      }

      setBookingForm({
        doctorId: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
      });

      setMessage("Appointment submitted successfully!");
      await fetchAppointments();
      setActiveTab("appointments");
    } catch (error) {
      setMessage(error.message || "Could not book appointment.");
    } finally {
      setLoading(false);
    }
  }

  // Approve or reject an appointment.
  async function updateAppointmentStatus(id, status) {
    if (!doctorUnlocked) {
      setMessage("Please unlock the Doctor Approval panel first.");
      setActiveTab("doctorLogin");
      return;
    }

    setMessage("");

    try {
      const response = await fetch(`${API}/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Could not update appointment to ${status}.`
        );
      }

      setMessage(`Appointment ${status.toLowerCase()} successfully.`);
      await fetchAppointments();
    } catch (error) {
      setMessage(error.message || "Status update failed.");
    }
  }

  // Patient logout.
  function handleLogout() {
    setLoggedInPatient(null);
    setActiveTab("home");
    setMessage("");
  }

  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="app">
      {/* NAVIGATION */}
      <header className="navbar">
        <div
          className="logo"
          onClick={() => setActiveTab("home")}
          role="button"
          tabIndex={0}
        >
          MediSlot
        </div>

        <nav>
          <button onClick={() => setActiveTab("home")}>Home</button>

          <button onClick={() => setActiveTab("doctors")}>
            Find Doctors
          </button>

          {loggedInPatient ? (
            <>
              <button onClick={() => setActiveTab("dashboard")}>
                Dashboard
              </button>

              <button onClick={() => setActiveTab("book")}>
                Book Appointment
              </button>

              <button
                onClick={() => {
                  setActiveTab("appointments");
                  fetchAppointments();
                }}
              >
                My Appointments
              </button>

              <button onClick={openDoctorPanel}>
                Doctor Approval 🔒
              </button>

              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab("login")}>Login</button>

              <button onClick={() => setActiveTab("register")}>
                Register
              </button>

              <button onClick={openDoctorPanel}>
                Doctor Approval 🔒
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="main-content">
        {message && (
          <div className="message" role="status">
            {message}

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* HOME */}
        {activeTab === "home" && (
          <section className="content-card">
            <h1>Welcome to MediSlot</h1>

            <p>
              Your healthcare journey made simpler. Find doctors and
              manage your appointments in one place.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                setActiveTab(loggedInPatient ? "doctors" : "register")
              }
            >
              Get Started
            </button>

            <button
              className="primary-btn"
              onClick={() => setActiveTab("doctors")}
            >
              Find a Doctor
            </button>

            <p>Today: {new Date().toLocaleDateString()}</p>
          </section>
        )}

        {/* REGISTER */}
        {activeTab === "register" && (
          <section className="content-card">
            <h2>Create Your Patient Account</h2>

            <form onSubmit={handleRegister}>
              <label>Full Name</label>
              <input
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    name: e.target.value,
                  })
                }
                required
              />

              <label>Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    email: e.target.value,
                  })
                }
                required
              />

              <label>Phone</label>
              <input
                type="tel"
                value={registerForm.phone}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    phone: e.target.value,
                  })
                }
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    password: e.target.value,
                  })
                }
                minLength={6}
                required
              />

              <button className="primary-btn" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            <p>
              Already registered?{" "}
              <button onClick={() => setActiveTab("login")}>
                Login here
              </button>
            </p>
          </section>
        )}

        {/* LOGIN */}
        {activeTab === "login" && (
          <section className="content-card">
            <h2>Patient Login</h2>

            <form onSubmit={handleLogin}>
              <label>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    email: e.target.value,
                  })
                }
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    password: e.target.value,
                  })
                }
                required
              />

              <button className="primary-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p>
              New patient?{" "}
              <button onClick={() => setActiveTab("register")}>
                Create an account
              </button>
            </p>
          </section>
        )}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && loggedInPatient && (
          <section className="content-card">
            <h1>
              Welcome,{" "}
              {loggedInPatient.fullName ||
                loggedInPatient.name ||
                "Patient"}
              !
            </h1>

            <p>Manage your healthcare appointments with MediSlot.</p>

            <button
              className="primary-btn"
              onClick={() => setActiveTab("doctors")}
            >
              Find Doctors
            </button>

            <button
              className="primary-btn"
              onClick={() => setActiveTab("book")}
            >
              Book Appointment
            </button>

            <button
              className="primary-btn"
              onClick={() => {
                setActiveTab("appointments");
                fetchAppointments();
              }}
            >
              My Appointments
            </button>
          </section>
        )}

        {/* FIND DOCTORS */}
        {activeTab === "doctors" && (
          <section className="content-card">
            <h2>Find Doctors</h2>

            <p>Choose a doctor for your healthcare needs.</p>

            {doctorsLoading && <p>Loading doctors...</p>}

            {doctorsError && <p role="alert">{doctorsError}</p>}

            {!doctorsLoading &&
              !doctorsError &&
              doctors.length === 0 && <p>No doctors are available.</p>}

            <div className="doctor-grid">
              {doctors.map((doctor) => (
                <article className="doctor-card" key={doctor.doctorId}>
                  <h3>{doctor.fullName}</h3>

                  <p>{doctor.specialization}</p>

                  <p>
                    Status: {doctor.availabilityStatus || "Available"}
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() => {
                      if (!loggedInPatient) {
                        setMessage("Please log in to book an appointment.");
                        setActiveTab("login");
                        return;
                      }

                      setBookingForm({
                        ...bookingForm,
                        doctorId: String(doctor.doctorId),
                      });

                      setActiveTab("book");
                    }}
                  >
                    Book This Doctor
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* BOOK APPOINTMENT */}
        {activeTab === "book" && (
          <section className="content-card">
            <h2>Book an Appointment</h2>

            <p>Select your doctor and preferred appointment details.</p>

            {!loggedInPatient ? (
              <>
                <p>Please log in to book an appointment.</p>

                <button
                  className="primary-btn"
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </button>
              </>
            ) : (
              <form onSubmit={handleBooking}>
                <label htmlFor="doctorId">Select Doctor</label>

                <select
                  id="doctorId"
                  value={bookingForm.doctorId}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      doctorId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Choose a doctor</option>

                  {doctors.map((doctor) => (
                    <option
                      key={doctor.doctorId}
                      value={doctor.doctorId}
                    >
                      {doctor.fullName} — {doctor.specialization}
                    </option>
                  ))}
                </select>

                <label htmlFor="appointmentDate">Appointment Date</label>

                <input
                  id="appointmentDate"
                  type="date"
                  value={bookingForm.appointmentDate}
                  min={today}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      appointmentDate: e.target.value,
                    })
                  }
                  required
                />

                <label htmlFor="appointmentTime">Appointment Time</label>

                <input
                  id="appointmentTime"
                  type="time"
                  value={bookingForm.appointmentTime}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      appointmentTime: e.target.value,
                    })
                  }
                  required
                />

                <label htmlFor="reason">Reason for Visit</label>

                <textarea
                  id="reason"
                  value={bookingForm.reason}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Briefly describe your reason for visiting"
                  required
                />

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Confirm Appointment"}
                </button>
              </form>
            )}
          </section>
        )}

        {/* MY APPOINTMENTS */}
        {activeTab === "appointments" && (
          <section className="content-card">
            <h2>My Appointments</h2>

            {!loggedInPatient ? (
              <>
                <p>Please log in to view your appointments.</p>

                <button
                  className="primary-btn"
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <button
                  className="primary-btn"
                  onClick={fetchAppointments}
                  disabled={appointmentsLoading}
                >
                  {appointmentsLoading ? "Refreshing..." : "Refresh"}
                </button>

                {appointmentsLoading && <p>Loading appointments...</p>}

                {!appointmentsLoading &&
                  appointments.filter(
                    (appointment) =>
                      Number(
                        appointment.patient?.patientId ??
                          appointment.patientId
                      ) === Number(loggedInPatient.patientId)
                  ).length === 0 && <p>No appointments found.</p>}

                <div className="appointment-list">
                  {appointments
                    .filter(
                      (appointment) =>
                        Number(
                          appointment.patient?.patientId ??
                            appointment.patientId
                        ) === Number(loggedInPatient.patientId)
                    )
                    .map((appointment) => (
                      <article
                        className="appointment-card"
                        key={appointment.appointmentId}
                      >
                        <h3>
                          {appointment.doctor?.fullName ||
                            appointment.doctorName ||
                            "Doctor"}
                        </h3>

                        <p>
                          Date:{" "}
                          {String(appointment.appointmentDate || "").slice(
                            0,
                            10
                          )}
                        </p>

                        <p>
                          Time: {String(appointment.appointmentTime || "")}
                        </p>

                        <p>Reason: {appointment.reason}</p>

                        <p>Status: {appointment.status}</p>
                      </article>
                    ))}
                </div>

                <button
                  className="primary-btn"
                  onClick={() => setActiveTab("book")}
                >
                  Book Another Appointment
                </button>
              </>
            )}
          </section>
        )}

        {/* DOCTOR APPROVAL PASSWORD SCREEN */}
        {activeTab === "doctorLogin" && (
          <section className="content-card doctor-login-card">
            <h2>🔐 Doctor Approval Login</h2>

            <p>
              This area is intended for authorized staff to review
              appointment requests.
            </p>

            <form onSubmit={handleDoctorLogin}>
              <label htmlFor="doctorPassword">Doctor Password</label>

              <input
                id="doctorPassword"
                type="password"
                placeholder="Enter doctor password"
                value={doctorPassword}
                onChange={(e) => {
                  setDoctorPassword(e.target.value);
                  setDoctorPasswordError("");
                }}
                autoComplete="current-password"
                required
              />

              {doctorPasswordError && (
                <p className="error-message" role="alert">
                  {doctorPasswordError}
                </p>
              )}

              <button className="primary-btn" type="submit">
                Unlock Doctor Panel
              </button>

              <button
                type="button"
                onClick={() => {
                  setDoctorPassword("");
                  setDoctorPasswordError("");
                  setActiveTab("home");
                }}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {/* DOCTOR APPROVAL PANEL */}
        {activeTab === "doctorPanel" && doctorUnlocked && (
          <section className="content-card">
            <h2>Doctor Approval Panel</h2>

            <p>Review appointment requests and update their status.</p>

            <button
              className="primary-btn"
              onClick={fetchAppointments}
              disabled={appointmentsLoading}
            >
              {appointmentsLoading
                ? "Refreshing..."
                : "Refresh Appointments"}
            </button>

            <button
              className="primary-btn"
              onClick={handleDoctorLogout}
            >
              Lock Panel 🔒
            </button>

            {appointmentsLoading && <p>Loading appointments...</p>}

            {!appointmentsLoading && appointments.length === 0 && (
              <p>No appointments found in the database.</p>
            )}

            <div className="appointment-list">
              {appointments.map((appointment) => {
                const status = String(
                  appointment.status || "PENDING"
                ).toUpperCase();

                return (
                  <article
                    className="appointment-card"
                    key={appointment.appointmentId}
                  >
                    <h3>Appointment #{appointment.appointmentId}</h3>

                    <p>
                      Patient:{" "}
                      {appointment.patient?.fullName ||
                        appointment.patient?.name ||
                        "Patient"}
                    </p>

                    <p>
                      Doctor:{" "}
                      {appointment.doctor?.fullName ||
                        appointment.doctorName ||
                        "Doctor"}
                    </p>

                    <p>
                      Date:{" "}
                      {String(appointment.appointmentDate || "").slice(
                        0,
                        10
                      )}
                    </p>

                    <p>
                      Time: {String(appointment.appointmentTime || "")}
                    </p>

                    <p>Reason: {appointment.reason}</p>

                    <p>
                      Status: <strong>{status}</strong>
                    </p>

                    {status === "PENDING" && (
                      <div>
                        <button
                          className="primary-btn"
                          onClick={() =>
                            updateAppointmentStatus(
                              appointment.appointmentId,
                              "APPROVED"
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="primary-btn"
                          onClick={() =>
                            updateAppointmentStatus(
                              appointment.appointmentId,
                              "REJECTED"
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} MediSlot | Healthcare made simpler
        </p>
      </footer>
    </div>
  );
}

export default App;