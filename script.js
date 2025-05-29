// Base URL for JSON Server API
const API_URL = "http://localhost:3000";

// Utility function to simplify fetch with error handling
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// ======= Index Page Logic =======

if (document.getElementById("showApplicantLogin")) {
  // Elements
  const showApplicantLoginBtn = document.getElementById("showApplicantLogin");
  const showAdminLoginBtn = document.getElementById("showAdminLogin");

  const applicantLoginContainer = document.getElementById("applicantLoginContainer");
  const adminLoginContainer = document.getElementById("adminLoginContainer");

  const applicantLoginForm = document.getElementById("applicantLoginForm");
  const adminLoginForm = document.getElementById("adminLoginForm");

  const showRegisterFormBtn = document.getElementById("showRegisterForm");
  const registerFormContainer = document.getElementById("registerFormContainer");
  const registerForm = document.getElementById("registerForm");
  const registerMessage = document.getElementById("registerMessage");
  const adminMessage = document.getElementById("adminMessage");

  // Show/hide login forms
  showApplicantLoginBtn.onclick = () => {
    applicantLoginContainer.style.display = "block";
    adminLoginContainer.style.display = "none";
    registerFormContainer.style.display = "none";
    registerMessage.textContent = "";
  };

  showAdminLoginBtn.onclick = () => {
    adminLoginContainer.style.display = "block";
    applicantLoginContainer.style.display = "none";
    registerFormContainer.style.display = "none";
    registerMessage.textContent = "";
    adminMessage.textContent = "";
  };

  showRegisterFormBtn.onclick = () => {
    registerFormContainer.style.display =
      registerFormContainer.style.display === "block" ? "none" : "block";
    registerMessage.textContent = "";
  };

  // Applicant Login Submit
  applicantLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("applicantUsername").value.trim();
    const password = document.getElementById("applicantPassword").value.trim();

    try {
      const users = await apiFetch(`${API_URL}/users?username=${encodeURIComponent(username)}&role=applicant`);
      if (users.length === 0) {
        alert("Applicant user not found");
        return;
      }
      const user = users[0];
      if (user.password !== password) {
        alert("Incorrect password");
        return;
      }
      // Save session to localStorage
      localStorage.setItem("user", JSON.stringify({ id: user.id, username: user.username, role: user.role }));
      // Redirect to applicant dashboard
      window.location.href = "applicant.html";
    } catch (error) {
      alert("Login failed. Try again later.");
    }
  });

  // Admin Login Submit
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    try {
      const users = await apiFetch(`${API_URL}/users?username=${encodeURIComponent(username)}&role=admin`);
      if (users.length === 0) {
        adminMessage.textContent = "Admin user not found";
        return;
      }
      const user = users[0];
      if (user.password !== password) {
        adminMessage.textContent = "Incorrect password";
        return;
      }
      // Save session
      localStorage.setItem("user", JSON.stringify({ id: user.id, username: user.username, role: user.role }));
      // Redirect to admin dashboard
      window.location.href = "admin.html";
    } catch (error) {
      adminMessage.textContent = "Login failed. Try again later.";
    }
  });

  // Registration Submit
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (username.length < 3 || password.length < 3) {
      registerMessage.textContent = "Username and password must be at least 3 characters.";
      registerMessage.style.color = "red";
      return;
    }

    try {
      // Check if username exists
      const existingUsers = await apiFetch(`${API_URL}/users?username=${encodeURIComponent(username)}`);
      if (existingUsers.length > 0) {
        registerMessage.textContent = "Username already taken.";
        registerMessage.style.color = "red";
        return;
      }

      // Create new applicant user
      const newUser = await apiFetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "applicant" }),
      });

      registerMessage.textContent = "Registration successful! You can now log in.";
      registerMessage.style.color = "green";
      registerForm.reset();
      registerFormContainer.style.display = "none";
    } catch (error) {
      registerMessage.textContent = "Registration failed. Try again later.";
      registerMessage.style.color = "red";
    }
  });
}

// ======= Applicant Page Logic =======

if (document.getElementById("loanForm")) {
  // Check if user logged in and role is applicant
  const sessionUser = JSON.parse(localStorage.getItem("user"));
  if (!sessionUser || sessionUser.role !== "applicant") {
    alert("Please login as applicant.");
    window.location.href = "index.html";
  }

  const loanForm = document.getElementById("loanForm");
  const loanApplicationsDiv = document.getElementById("loanApplications");
  const successMessageDiv = document.getElementById("successMessage");
  const logoutBtn = document.getElementById("logoutBtn");

  // Fetch and display loans for current applicant
  async function loadLoans() {
    loanApplicationsDiv.innerHTML = "<p>Loading your loan applications...</p>";
    try {
      const loans = await apiFetch(`${API_URL}/loans?userId=${sessionUser.id}`);
      if (loans.length === 0) {
        loanApplicationsDiv.innerHTML = "<p>You have no loan applications yet.</p>";
        return;
      }
      // Show each loan with status and payment info
      loanApplicationsDiv.innerHTML = loans
        .map(
          (loan) => `
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Ksh ${loan.amount.toLocaleString()}</h5>
            <p class="card-text"><strong>Purpose:</strong> ${loan.purpose}</p>
            <p class="card-text"><strong>Status:</strong> ${loan.status}</p>
            <p class="card-text"><strong>Applied On:</strong> ${new Date(loan.createdAt).toLocaleDateString()}</p>
            ${
              loan.status === "approved"
                ? `<p class="card-text"><strong>Repayment Schedule:</strong> ${loan.repaymentSchedule || "N/A"}</p>`
                : ""
            }
          </div>
        </div>
      `
        )
        .join("");
    } catch (error) {
      loanApplicationsDiv.innerHTML = "<p>Error loading loans.</p>";
    }
  }

  // Submit loan application
  loanForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("applicantName").value.trim();
    const email = document.getElementById("applicantEmail").value.trim();
    const businessName = document.getElementById("businessName").value.trim();
    const businessReg = document.getElementById("businessRegistration").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const purpose = document.getElementById("purpose").value.trim();

    if (amount <= 0) {
      alert("Loan amount must be greater than zero.");
      return;
    }
    if (!fullName || !email || !purpose) {
      alert("Please fill all required fields.");
      return;
    }

    const newLoan = {
      userId: sessionUser.id,
      fullName,
      email,
      businessName,
      businessRegistration: businessReg,
      amount,
      purpose,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      await apiFetch(`${API_URL}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLoan),
      });
      successMessageDiv.style.display = "block";
      loanForm.reset();
      loadLoans();
      setTimeout(() => {
        successMessageDiv.style.display = "none";
      }, 3000);
    } catch (error) {
      alert("Failed to submit loan application.");
    }
  });

  logoutBtn.onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  };

  loadLoans();
}

// ======= Admin Page Logic =======

if (document.getElementById("loanApplicationsAdmin")) {
  const sessionUser = JSON.parse(localStorage.getItem("user"));
  if (!sessionUser || sessionUser.role !== "admin") {
    alert("Please login as admin.");
    window.location.href = "index.html";
  }

  const loanApplicationsAdminDiv = document.getElementById("loanApplicationsAdmin");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  async function loadAllLoans() {
    loanApplicationsAdminDiv.innerHTML = "<p>Loading loan applications...</p>";
    try {
      const loans = await apiFetch(`${API_URL}/loans?_expand=user`);
      // The above expands user details if using JSON Server's expand functionality
      // fallback: manually fetch user info per loan

      // To get user info for each loan if _expand unsupported:
      // for now we assume no expand; we get user by userId per loan

      // Since _expand might not be set, let's fetch users separately
      const users = await apiFetch(`${API_URL}/users`);

      // Map userId to user
      const userMap = {};
      users.forEach((u) => (userMap[u.id] = u));

      if (loans.length === 0) {
        loanApplicationsAdminDiv.innerHTML = "<p>No loan applications found.</p>";
        return;
      }

      loanApplicationsAdminDiv.innerHTML = loans
        .map((loan) => {
          const user = userMap[loan.userId];
          return `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">Ksh ${loan.amount.toLocaleString()}</h5>
              <p><strong>Applicant:</strong> ${user ? user.username : "Unknown"}</p>
              <p><strong>Full Name:</strong> ${loan.fullName}</p>
              <p><strong>Email:</strong> ${loan.email}</p>
              <p><strong>Business:</strong> ${loan.businessName || "N/A"}</p>
              <p><strong>Purpose:</strong> ${loan.purpose}</p>
              <p><strong>Status:</strong> <span id="status-${loan.id}">${loan.status}</span></p>
              <div class="mb-3">
                <label for="statusSelect-${loan.id}" class="form-label">Update Status</label>
                <select id="statusSelect-${loan.id}" class="form-select">
                  <option value="pending" ${
                    loan.status === "pending" ? "selected" : ""
                  }>Pending</option>
                  <option value="approved" ${
                    loan.status === "approved" ? "selected" : ""
                  }>Approved</option>
                  <option value="rejected" ${
                    loan.status === "rejected" ? "selected" : ""
                  }>Rejected</option>
                </select>
              </div>
              <button data-loanid="${loan.id}" class="btn btn-primary updateStatusBtn">Update</button>
            </div>
          </div>
          `;
        })
        .join("");

      // Attach event listeners to all update buttons
      document.querySelectorAll(".updateStatusBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const loanId = e.target.getAttribute("data-loanid");
          const selectElem = document.getElementById(`statusSelect-${loanId}`);
          const newStatus = selectElem.value;

          try {
            const response = await apiFetch(`${API_URL}/loans/${loanId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });
            document.getElementById(`status-${loanId}`).textContent = newStatus;
            alert("Status updated.");
          } catch (error) {
            alert("Failed to update status.");
          }
        });
      });
    } catch (error) {
      loanApplicationsAdminDiv.innerHTML = "<p>Error loading loan applications.</p>";
    }
  }

  adminLogoutBtn.onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  };

  loadAllLoans();

const API_URL = "http://localhost:3000";

// Helper fetch wrapper
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ======= Landing Page Logic (Login / Register) =======
if (document.getElementById("applicantLoginForm") || document.getElementById("adminLoginForm") || document.getElementById("registerForm")) {
  const applicantLoginForm = document.getElementById("applicantLoginForm");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const registerForm = document.getElementById("registerForm");
  const registerFormContainer = document.getElementById("registerFormContainer");
  const registerMessage = document.getElementById("registerMessage");
  const adminMessage = document.getElementById("adminMessage");

  // Applicant Login
  if (applicantLoginForm) {
    applicantLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("applicantUsername").value.trim();
      const password = document.getElementById("applicantPassword").value.trim();

      try {
        const users = await apiFetch(`${API_URL}/users?username=${encodeURIComponent(username)}&role=applicant`);
        if (users.length === 0) {
          alert("Applicant user not found");
          return;
        }
        const user = users[0];
        if (user.password !== password) {
          alert("Incorrect password");
          return;
        }
        localStorage.setItem("user", JSON.stringify({ id: user.id, username: user.username, role: user.role }));
        window.location.href = "applicant.html";
      } catch {
        alert("Login failed. Try again later.");
      }
    });
  }

  // Admin Login
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("adminUsername").value.trim();
      const password = document.getElementById("adminPassword").value.trim();

      try {
        const users = await apiFetch(`${API_URL}/users?username=${encodeURIComponent(username)}&role=admin`);
        if (users.length === 0) {
          adminMessage.textContent = "Admin user not found";
          return;
        }
        const user = users[0];
        if (user.password !== password) {
          adminMessage.textContent = "Incorrect password";
          return;
        }
        localStorage.setItem("user", JSON.stringify({ id: user.id, username: user.username, role: user.role }));
        window.location.href = "admin.html";
      } catch {
        adminMessage.textContent = "Login failed. Try again later.";
      }
    });
  }

  // Registration
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("registerUsername").value.trim();
      const password = document.getElementById("registerPassword").value.trim();

      if (username.length < 3 || password.length < 3) {
        registerMessage.textContent = "Username and password must be at least 3 characters.";
        registerMessage.style.color = "red";
        return;
      }

      try {
        const existingUsers = await apiFetch(`${API_URL}/users?username=${encodeURIComponent(username)}`);
        if (existingUsers.length > 0) {
          registerMessage.textContent = "Username already taken.";
          registerMessage.style.color = "red";
          return;
        }

        await apiFetch(`${API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, role: "applicant" }),
        });

        registerMessage.textContent = "Registration successful! You can now log in.";
        registerMessage.style.color = "green";
        registerForm.reset();
        registerFormContainer.style.display = "none";
      } catch {
        registerMessage.textContent = "Registration failed. Try again later.";
        registerMessage.style.color = "red";
      }
    });
  }
}

// ======= Applicant Page Logic =======
if (document.getElementById("loanForm")) {
  const sessionUser = JSON.parse(localStorage.getItem("user"));
  if (!sessionUser || sessionUser.role !== "applicant") {
    alert("Please login as applicant.");
    window.location.href = "index.html";
  }

  const loanForm = document.getElementById("loanForm");
  const loanApplicationsDiv = document.getElementById("loanApplications");
  const successMessageDiv = document.getElementById("successMessage");
  const logoutBtn = document.getElementById("logoutBtn");

  async function loadLoans() {
    loanApplicationsDiv.innerHTML = "<p>Loading your loan applications...</p>";
    try {
      const loans = await apiFetch(`${API_URL}/loans?userId=${sessionUser.id}`);
      if (loans.length === 0) {
        loanApplicationsDiv.innerHTML = "<p>You have no loan applications yet.</p>";
        return;
      }
      loanApplicationsDiv.innerHTML = loans
        .map(
          (loan) => `
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Ksh ${loan.amount.toLocaleString()}</h5>
            <p class="card-text"><strong>Purpose:</strong> ${loan.purpose}</p>
            <p class="card-text"><strong>Status:</strong> ${loan.status}</p>
            <p class="card-text"><strong>Applied On:</strong> ${new Date(loan.createdAt).toLocaleDateString()}</p>
            ${
              loan.status === "approved"
                ? `<p class="card-text"><strong>Repayment Schedule:</strong> ${loan.repaymentSchedule || "N/A"}</p>`
                : ""
            }
          </div>
        </div>
      `
        )
        .join("");
    } catch {
      loanApplicationsDiv.innerHTML = "<p>Error loading loans.</p>";
    }
  }

  loanForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("applicantName").value.trim();
    const email = document.getElementById("applicantEmail").value.trim();
    const businessName = document.getElementById("businessName").value.trim();
    const businessReg = document.getElementById("businessRegistration").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const purpose = document.getElementById("purpose").value.trim();

    if (amount <= 0) {
      alert("Loan amount must be greater than zero.");
      return;
    }
    if (!fullName || !email || !purpose) {
      alert("Please fill all required fields.");
      return;
    }

    const newLoan = {
      userId: sessionUser.id,
      fullName,
      email,
      businessName,
      businessRegistration: businessReg,
      amount,
      purpose,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      await apiFetch(`${API_URL}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLoan),
      });
      successMessageDiv.style.display = "block";
      loanForm.reset();
      loadLoans();
      setTimeout(() => {
        successMessageDiv.style.display = "none";
      }, 3000);
    } catch {
      alert("Failed to submit loan application.");
    }
  });

  logoutBtn.onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  };

  loadLoans();
}

// ======= Admin Page Logic =======
if (document.getElementById("loanApplicationsAdmin")) {
  const sessionUser = JSON.parse(localStorage.getItem("user"));
  if (!sessionUser || sessionUser.role !== "admin") {
    alert("Please login as admin.");
    window.location.href = "index.html";
  }

  const loanApplicationsAdminDiv = document.getElementById("loanApplicationsAdmin");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  async function loadAllLoans() {
    loanApplicationsAdminDiv.innerHTML = "<p>Loading loan applications...</p>";
    try {
      const loans = await apiFetch(`${API_URL}/loans`);
      const users = await apiFetch(`${API_URL}/users`);
      const userMap = {};
      users.forEach((u) => (userMap[u.id] = u));

      if (loans.length === 0) {
        loanApplicationsAdminDiv.innerHTML = "<p>No loan applications found.</p>";
        return;
      }

      loanApplicationsAdminDiv.innerHTML = loans
        .map((loan) => {
          const user = userMap[loan.userId];
          return `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">Ksh ${loan.amount.toLocaleString()}</h5>
              <p><strong>Applicant:</strong> ${user ? user.username : "Unknown"}</p>
              <p><strong>Full Name:</strong> ${loan.fullName}</p>
              <p><strong>Email:</strong> ${loan.email}</p>
              <p><strong>Business:</strong> ${loan.businessName || "N/A"}</p>
              <p><strong>Purpose:</strong> ${loan.purpose}</p>
              <p><strong>Status:</strong> <span id="status-${loan.id}">${loan.status}</span></p>
              <div class="mb-3">
                <label for="statusSelect-${loan.id}" class="form-label">Update Status</label>
                <select id="statusSelect-${loan.id}" class="form-select">
                  <option value="pending" ${
                    loan.status === "pending" ? "selected" : ""
                  }>Pending</option>
                  <option value="approved" ${
                    loan.status === "approved" ? "selected" : ""
                  }>Approved</option>
                  <option value="rejected" ${
                    loan.status === "rejected" ? "selected" : ""
                  }>Rejected</option>
                </select>
              </div>
              <button data-loanid="${loan.id}" class="btn btn-primary updateStatusBtn">Update</button>
            </div>
          </div>
          `;
        })
        .join("");

      document.querySelectorAll(".updateStatusBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const loanId = e.target.getAttribute("data-loanid");
          const selectElem = document.getElementById(`statusSelect-${loanId}`);
          const newStatus = selectElem.value;

          try {
            await apiFetch(`${API_URL}/loans/${loanId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });
            document.getElementById(`status-${loanId}`).textContent = newStatus;
            alert("Status updated.");
          } catch {
            alert("Failed to update status.");
          }
        });
      });
    } catch {
      loanApplicationsAdminDiv.innerHTML = "<p>Error loading loan applications.</p>";
    }
  }

  adminLogoutBtn.onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  };

  loadAllLoans();
}}
