// Show the login options for Applicants and Admins
document.getElementById('showApplicantLogin').addEventListener('click', function () {
  document.getElementById('applicantLoginContainer').style.display = 'block';
  document.getElementById('adminLoginContainer').style.display = 'none';
});

document.getElementById('showAdminLogin').addEventListener('click', function () {
  document.getElementById('adminLoginContainer').style.display = 'block';
  document.getElementById('applicantLoginContainer').style.display = 'none';
});

// Show the registration form for Applicants
document.getElementById('showRegisterForm').addEventListener('click', function () {
  document.getElementById('registerFormContainer').style.display = 'block';
});

// Handle registration form submission
document.getElementById('registerForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  // Register the new user
  fetch('http://localhost:3000/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      password: password,
      role: 'applicant' // Default role for registration
    })
  })
    .then(response => response.json())
    .then(data => {
      alert('Registration successful! You can now log in.');
      document.getElementById('registerFormContainer').style.display = 'none';
    })
    .catch(error => console.error('Error:', error));
});

// Authenticate user (both Applicants and Admins)
function login(username, password) {
  fetch('http://localhost:3000/users')
    .then(response => response.json())
    .then(users => {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role === 'admin') {
          alert('Success! Welcome, admin!');
          window.location.href = 'admin.html'; // Redirect to admin page
        } else {
          window.location.href = 'applicant.html'; // Redirect to applicant page
        }
      } else {
        alert('Invalid username or password!');
      }
    });
}

// Handle login form submission for applicants
document.getElementById('applicantLoginForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const username = document.getElementById('applicantUsername').value;
  const password = document.getElementById('applicantPassword').value;
  login(username, password);
});

// Handle Admin Login
document.getElementById('adminLoginForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  const adminUsername = document.getElementById('adminUsername').value;
  const adminPassword = document.getElementById('adminPassword').value;

  // Sample credentials for admin (You can replace this with a real backend check)
  const adminCredentials = {
    username: 'admin',
    password: 'admin123' // Replace with a secure method for production
  };

  if (adminUsername === adminCredentials.username && adminPassword === adminCredentials.password) {
    // Store the admin info in localStorage or sessionStorage for session management
    localStorage.setItem('currentUser', JSON.stringify({
      username: adminUsername,
      role: 'admin'
    }));

    // Redirect to admin dashboard
    window.location.href = 'admin-dashboard.html';  // Ensure this page exists
  } else {
    alert('Invalid admin username or password!');
  }
});

// Handle loan application submission
document.getElementById('loanForm').addEventListener('submit', function (event) {
  event.preventDefault();

  // Collect form values
  const applicantName = document.getElementById('applicantName').value;
  const applicantEmail = document.getElementById('applicantEmail').value;
  const amount = document.getElementById('amount').value;
  const purpose = document.getElementById('purpose').value;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));  // Get logged-in user

  // Check for empty fields
  if (!amount || !purpose) {
    alert('Please fill out all fields.');
    return;
  }
  // Calculate loan interest (2.5% per annum)
  const interestRate = 2.5 / 100; // 2.5% interest rate
  const loanInterest = amount * interestRate;
  const totalLoan = amount + loanInterest;

  // Submit loan application to the server
  fetch('http://localhost:3000/loans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: currentUser.id,
      amount: amount,
      purpose: purpose,
      interestRate: interestRate,
      loanInterest: loanInterest,
      totalLoan: totalLoan,
      status: 'pending',
      repaymentSchedule: [],
      applicantName: applicantName,
      applicantEmail: applicantEmail
    })
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById('successMessage').style.display = 'block';
      document.getElementById('loanDetails').style.display = 'block';
      document.getElementById('loanAmount').innerText = amount;
      document.getElementById('loanInterest').innerText = loanInterest.toFixed(2);
      document.getElementById('totalLoan').innerText = totalLoan.toFixed(2);
    })
    .catch(error => console.error('Error:', error));
});

// Track loan status for current user
function loadLoanStatus() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  fetch(`http://localhost:3000/loans?userId=${currentUser.id}`)
    .then(response => response.json())
    .then(loans => {
      const loanStatusDiv = document.getElementById('loanStatus');
      loanStatusDiv.innerHTML = '';
      loans.forEach(loan => {
        const loanDiv = document.createElement('div');
        loanDiv.innerHTML = `
          <p>Amount: $${loan.amount}</p>
          <p>Purpose: ${loan.purpose}</p>
          <p>Status: ${loan.status}</p>
        `;
        loanStatusDiv.appendChild(loanDiv);
      });
    });
}

// Track repayment schedule for current user
function loadRepaymentSchedule() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  fetch(`http://localhost:3000/loans?userId=${currentUser.id}`)
    .then(response => response.json())
    .then(loans => {
      const repaymentScheduleDiv = document.getElementById('repaymentSchedule');
      repaymentScheduleDiv.innerHTML = '';
      loans.forEach(loan => {
        loan.repaymentSchedule.forEach(payment => {
          const paymentDiv = document.createElement('div');
          paymentDiv.innerHTML = `
            <p>Date: ${payment.date}</p>
            <p>Amount: $${payment.amount}</p>
            <p>Paid: ${payment.paid ? 'Yes' : 'No'}</p>
          `;
          repaymentScheduleDiv.appendChild(paymentDiv);
        });
      });
    });
}

// Handle payment submission
document.getElementById('paymentForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (!paymentAmount) {
    alert('Please enter a payment amount.');
    return;
  }

  // Update loan repayment schedule
  fetch('http://localhost:3000/loans')
    .then(response => response.json())
    .then(loans => {
      const loan = loans.find(l => l.userId === currentUser.id && l.status === 'approved');
      if (loan) {
        // Add the payment to the repayment schedule
        const repaymentDate = new Date().toLocaleDateString();
        loan.repaymentSchedule.push({ date: repaymentDate, amount: paymentAmount, paid: true });

        // Update the loan record with the new repayment schedule
        fetch(`http://localhost:3000/loans/${loan.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            repaymentSchedule: loan.repaymentSchedule
          })
        })
          .then(response => response.json())
          .then(updatedLoan => {
            document.getElementById('paymentMessage').style.display = 'block';
            document.getElementById('paymentMessage').innerText = 'Payment made successfully!';
            loadRepaymentSchedule(); // Refresh repayment schedule
          })
          .catch(error => console.error('Error:', error));
      } else {
        alert('No approved loan found for you.');
      }
    });
});

// Event listener for tracking loan status
document.getElementById('trackLoanStatus').addEventListener('click', function () {
  loadLoanStatus();
});

// Event listener for tracking repayment schedule
document.getElementById('trackRepaymentSchedule').addEventListener('click', function () {
  loadRepaymentSchedule();
});
// Load loan for editing
function loadLoanForEdit() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));  // Get logged-in user
  fetch(`http://localhost:3000/loans?userId=${currentUser.id}`)
    .then(response => response.json())
    .then(loans => {
      if (loans.length > 0) {
        const loan = loans[0]; // Assuming the user has only one loan application
        document.getElementById('editAmount').value = loan.amount;
        document.getElementById('editPurpose').value = loan.purpose;
      }
    });
}

// Edit loan application
document.getElementById('editLoanForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const amount = document.getElementById('editAmount').value;
  const purpose = document.getElementById('editPurpose').value;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));  // Get logged-in user

  // Fetch the loan details to edit
  fetch(`http://localhost:3000/loans?userId=${currentUser.id}`)
    .then(response => response.json())
    .then(loans => {
      if (loans.length > 0) {
        const loan = loans[0]; // Assuming the user has only one loan application

        // Update loan application
        fetch(`http://localhost:3000/loans/${loan.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amount,
            purpose: purpose
          })
        })
          .then(response => response.json())
          .then(data => {
            // Display success message for edit
            document.getElementById('editMessage').style.display = 'block';
            setTimeout(() => {
              document.getElementById('editMessage').style.display = 'none';
            }, 3000);
          });
      }
    });
});

// Ensure the loan information is pre-loaded on page load
window.onload = loadLoanForEdit;

// Track repayment schedule
document.getElementById('trackRepaymentSchedule').addEventListener('click', function () {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));  // Get logged-in user
  fetch(`http://localhost:3000/loans?userId=${currentUser.id}`)
    .then(response => response.json())
    .then(loans => {
      const repaymentScheduleDiv = document.getElementById('repaymentSchedule');
      repaymentScheduleDiv.innerHTML = '';  // Clear previous content

      // Loop through loans and repayment schedule
      loans.forEach(loan => {
        loan.repaymentSchedule.forEach(payment => {
          repaymentScheduleDiv.innerHTML += `
            <p><strong>Date:</strong> ${payment.date}</p>
            <p><strong>Amount:</strong> ${payment.amount}</p>
            <p><strong>Paid:</strong> ${payment.paid ? 'Yes' : 'No'}</p>
          `;
        });
      });
    });
});


// Event listeners for tracking loan status and repayment schedule
document.getElementById('trackLoanStatus').addEventListener('click', loadLoanStatus);
document.getElementById('trackRepaymentSchedule').addEventListener('click', loadRepaymentSchedule);

// Fetch all loan applications
function loadApplications() {
  fetch('http://localhost:3000/loans')
    .then(response => response.json())
    .then(applications => {
      const loanApplicationsDiv = document.getElementById('loanApplications');
      loanApplicationsDiv.innerHTML = ''; // Clear previous content
      applications.forEach(application => {
        const applicationDiv = document.createElement('div');
        applicationDiv.classList.add('loan-application');
        applicationDiv.innerHTML = `
          <p><strong>Applicant ID:</strong> ${application.userId}</p>
          <p><strong>Amount:</strong> ${application.amount}</p>
          <p><strong>Purpose:</strong> ${application.purpose}</p>
          <p><strong>Status:</strong> ${application.status}</p>
          <button onclick="approveApplication(${application.id})">Approve</button>
          <button onclick="rejectApplication(${application.id})">Reject</button>
        `;
        loanApplicationsDiv.appendChild(applicationDiv);
      });
    });
}

// Approve a loan application
function approveApplication(id) {
  updateApplicationStatus(id, 'approved');
}

// Reject a loan application
function rejectApplication(id) {
  updateApplicationStatus(id, 'rejected');
}

// Update loan application status (approve or reject)
function updateApplicationStatus(id, status) {
  fetch(`http://localhost:3000/loans/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: status })
  })
    .then(response => response.json())
    .then(data => {
      alert(`Loan application ${status} successfully!`);
      loadApplications(); // Refresh loan applications list
    });
}

// Generate loan reports (approved, rejected, etc.)
function generateReports() {
  fetch('http://localhost:3000/loans')
    .then(response => response.json())
    .then(loans => {
      const reportsDiv = document.getElementById('reports');
      const approvedLoans = loans.filter(loan => loan.status === 'approved').length;
      const rejectedLoans = loans.filter(loan => loan.status === 'rejected').length;
      reportsDiv.innerHTML = `
        <p><strong>Total Loan Applications:</strong> ${loans.length}</p>
        <p><strong>Approved Loans:</strong> ${approvedLoans}</p>
        <p><strong>Rejected Loans:</strong> ${rejectedLoans}</p>
      `;
    });
}

// Load all applications when the page loads
document.addEventListener('DOMContentLoaded', function() {
  loadApplications();
});

// Load user management data for admin
function loadUserManagement() {
  fetch('http://localhost:3000/users')
    .then(response => response.json())
    .then(users => {
      const userManagementDiv = document.getElementById('userManagement');
      userManagementDiv.innerHTML = ''; // Clear previous list
      if (users.length === 0) {
        userManagementDiv.innerHTML = '<p>No users found.</p>';
      } else {
        users.forEach(user => {
          const userDiv = document.createElement('div');
          userDiv.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <button onclick="deleteUser(${user.id})">Delete User</button>
            <button onclick="lockUser(${user.id})">Lock User</button>
          `;
          userManagementDiv.appendChild(userDiv);
        });
      }
    })
    .catch(error => {
      console.error('Error loading users:', error);
      document.getElementById('userManagement').innerHTML = 'Error loading users.';
    });
}

// Delete user
function deleteUser(id) {
  fetch(`http://localhost:3000/users/${id}`, {
    method: 'DELETE'
  })
    .then(response => response.json())
    .then(data => {
      alert('User deleted!');
      loadUserManagement(); // Refresh the user management view
    })
    .catch(error => {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    });
}

// Lock user account
function lockUser(id) {
  fetch(`http://localhost:3000/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ locked: true })
  })
    .then(response => response.json())
    .then(data => {
      alert('User account locked!');
      loadUserManagement(); // Refresh the user management view
    })
    .catch(error => {
      console.error('Error locking user:', error);
      alert('Failed to lock user.');
    });
}

// Call the functions to load initial data
loadApplications();        // Load the loan applications
loadUserManagement();      // Load the users for management
