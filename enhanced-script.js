// Enhanced F-lendly Application Script
class EnhancedLoanApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPageContent();
  }

  setupEventListeners() {
    // Registration form
    const registerForm = document.getElementById('registrationForm');
    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegistration.bind(this));
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Loan application form
    const loanForm = document.getElementById('loanForm');
    if (loanForm) {
      loanForm.addEventListener('submit', this.handleLoanSubmission.bind(this));
    }

    // Admin actions
    document.addEventListener('click', this.handleAdminActions.bind(this));
    document.addEventListener('change', this.handleStatusChange.bind(this));
  }

  async loadPageContent() {
    const currentPage = window.location.pathname.split('/').pop();
    
    try {
      switch (currentPage) {
        case 'applicant.html':
          await this.loadApplicantDashboard();
          break;
        case 'admin.html':
          await this.loadAdminDashboard();
          break;
      }
    } catch (error) {
      console.error('Error loading page content:', error);
      this.showError('Failed to load page content');
    }
  }

  async handleRegistration(e) {
    e.preventDefault();
    this.showLoading();

    try {
      const formData = new FormData(e.target);
      const userData = {
        name: formData.get('name') || document.getElementById('registerName').value,
        email: formData.get('email') || document.getElementById('registerEmail').value,
        password: formData.get('password') || document.getElementById('registerPassword').value
      };

      const response = await APIService.register(userData);
      
      AuthService.setToken(response.token);
      AuthService.setUser(response.user);
      
      this.showSuccess('Registration successful!');
      setTimeout(() => {
        window.location.href = response.user.role === 'admin' ? 'admin.html' : 'applicant.html';
      }, 1000);
    } catch (error) {
      this.showError(error.message, 'registerError');
    } finally {
      this.hideLoading();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    this.showLoading();

    try {
      const formData = new FormData(e.target);
      const credentials = {
        email: formData.get('email') || document.getElementById('loginEmail').value,
        password: formData.get('password') || document.getElementById('loginPassword').value
      };

      const response = await APIService.login(credentials);
      
      AuthService.setToken(response.token);
      AuthService.setUser(response.user);
      
      this.showSuccess('Login successful!');
      setTimeout(() => {
        window.location.href = response.user.role === 'admin' ? 'admin.html' : 'applicant.html';
      }, 1000);
    } catch (error) {
      this.showError(error.message, 'loginError');
    } finally {
      this.hideLoading();
    }
  }

  async handleLoanSubmission(e) {
    e.preventDefault();
    this.showLoading();

    try {
      const formData = new FormData(e.target);
      const loanData = {
        amount: formData.get('amount') || document.getElementById('amount').value,
        purpose: formData.get('purpose') || document.getElementById('purpose').value,
        businessName: formData.get('businessName') || document.getElementById('businessName')?.value,
        businessRegistration: formData.get('businessRegistration') || document.getElementById('businessRegistration')?.value
      };

      await APIService.submitLoan(loanData);
      
      this.showSuccess('Loan application submitted successfully!', 'successMessage');
      e.target.reset();
      await this.loadApplicantLoans();
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  async loadApplicantDashboard() {
    const user = AuthService.getUser();
    if (!user) return;

    // Pre-fill user information
    const nameField = document.getElementById('applicantName');
    const emailField = document.getElementById('applicantEmail');
    
    if (nameField) nameField.value = user.name;
    if (emailField) emailField.value = user.email;

    await this.loadApplicantLoans();
  }

  async loadApplicantLoans() {
    try {
      const loans = await APIService.getMyLoans();
      this.renderApplicantLoans(loans);
    } catch (error) {
      console.error('Error loading loans:', error);
      this.showError('Failed to load your loan applications');
    }
  }

  async loadAdminDashboard() {
    try {
      const [loans, users] = await Promise.all([
        APIService.getAllLoans(),
        APIService.getAllUsers()
      ]);
      
      this.renderAdminLoans(loans);
      this.renderUsers(users);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      this.showError('Failed to load admin dashboard');
    }
  }

  renderApplicantLoans(loans) {
    const tbody = document.querySelector('#applicantLoansTable tbody');
    if (!tbody) return;

    tbody.innerHTML = loans.map(loan => `
      <tr>
        <td>${loan.id.substring(0, 8)}...</td>
        <td>$${loan.amount.toLocaleString()}</td>
        <td>${loan.purpose}</td>
        <td>
          <span class="badge bg-${this.getStatusColor(loan.status)}">
            ${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
          </span>
        </td>
        <td>
          <span class="badge bg-${this.getPaymentStatusColor(loan.paymentStatus)}">
            ${this.formatPaymentStatus(loan.paymentStatus)}
          </span>
        </td>
        <td>${new Date(loan.submittedAt).toLocaleDateString()}</td>
        <td>
          ${loan.status === 'approved' && loan.repayments.length > 0 ? 
            `<button class="btn btn-info btn-sm" onclick="app.showRepaymentModal('${loan.id}')">View</button>` : 
            '-'}
        </td>
      </tr>
    `).join('');
  }

  renderAdminLoans(loans) {
    const tbody = document.querySelector('#loanApplicationsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = loans.map(loan => `
      <tr>
        <td>${loan.id.substring(0, 8)}...</td>
        <td>${loan.applicantEmail}</td>
        <td>$${loan.amount.toLocaleString()}</td>
        <td>
          <select class="form-select form-select-sm status-select" data-id="${loan.id}">
            <option value="pending" ${loan.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${loan.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${loan.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td>${new Date(loan.submittedAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-success btn-sm approve-btn" data-id="${loan.id}" 
                  ${loan.status === 'approved' ? 'disabled' : ''}>Approve</button>
          <button class="btn btn-danger btn-sm reject-btn" data-id="${loan.id}" 
                  ${loan.status === 'rejected' ? 'disabled' : ''}>Reject</button>
        </td>
        <td>
          ${loan.repayments.length > 0 ? 
            `<button class="btn btn-info btn-sm" onclick="app.showRepaymentModal('${loan.id}')">View</button>` : 
            '-'}
        </td>
      </tr>
    `).join('');
  }

  renderUsers(users) {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id.substring(0, 8)}...</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${new Date(user.registeredAt).toLocaleDateString()}</td>
        <td>
          <span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">
            ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </td>
      </tr>
    `).join('');
  }

  async showRepaymentModal(loanId) {
    try {
      const loans = await (AuthService.isAdmin() ? APIService.getAllLoans() : APIService.getMyLoans());
      const loan = loans.find(l => l.id === loanId);
      
      if (!loan || !loan.repayments.length) {
        this.showError('No repayment schedule available');
        return;
      }

      const modalBody = document.getElementById('repaymentModalBody');
      const isApplicant = !AuthService.isAdmin();
      
      modalBody.innerHTML = `
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              ${isApplicant ? '<th>Action</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${loan.repayments.map((repayment, index) => `
              <tr>
                <td>${new Date(repayment.dueDate).toLocaleDateString()}</td>
                <td>$${repayment.amount.toLocaleString()}</td>
                <td>
                  <span class="badge bg-${repayment.paid ? 'success' : 'warning'}">
                    ${repayment.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </td>
                ${isApplicant ? `
                  <td>
                    <button class="btn btn-sm ${repayment.paid ? 'btn-secondary' : 'btn-success'}" 
                            onclick="app.toggleRepayment('${loan.id}', '${repayment.id}', ${!repayment.paid})">
                      ${repayment.paid ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const modal = new bootstrap.Modal(document.getElementById('repaymentModal'));
      modal.show();
    } catch (error) {
      console.error('Error showing repayment modal:', error);
      this.showError('Failed to load repayment schedule');
    }
  }

  async toggleRepayment(loanId, repaymentId, paid) {
    try {
      this.showLoading();
      await APIService.updateRepaymentStatus(loanId, repaymentId, paid);
      await this.loadApplicantLoans();
      await this.showRepaymentModal(loanId);
      this.showSuccess(`Repayment marked as ${paid ? 'paid' : 'unpaid'}`);
    } catch (error) {
      console.error('Error updating repayment:', error);
      this.showError('Failed to update repayment status');
    } finally {
      this.hideLoading();
    }
  }

  async handleAdminActions(e) {
    if (e.target.classList.contains('approve-btn')) {
      const loanId = e.target.getAttribute('data-id');
      await this.updateLoanStatus(loanId, 'approved');
    } else if (e.target.classList.contains('reject-btn')) {
      const loanId = e.target.getAttribute('data-id');
      await this.updateLoanStatus(loanId, 'rejected');
    }
  }

  async handleStatusChange(e) {
    if (e.target.classList.contains('status-select')) {
      const loanId = e.target.getAttribute('data-id');
      const status = e.target.value;
      await this.updateLoanStatus(loanId, status);
    }
  }

  async updateLoanStatus(loanId, status) {
    try {
      this.showLoading();
      await APIService.updateLoanStatus(loanId, status);
      await this.loadAdminDashboard();
      this.showSuccess(`Loan ${status} successfully`);
    } catch (error) {
      console.error('Error updating loan status:', error);
      this.showError('Failed to update loan status');
    } finally {
      this.hideLoading();
    }
  }

  getStatusColor(status) {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'secondary';
  }

  getPaymentStatusColor(status) {
    const colors = {
      not_started: 'secondary',
      active: 'warning',
      partial: 'info',
      completed: 'success'
    };
    return colors[status] || 'secondary';
  }

  formatPaymentStatus(status) {
    const formats = {
      not_started: 'Not Started',
      active: 'Active',
      partial: 'Partial',
      completed: 'Completed'
    };
    return formats[status] || status;
  }

  showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'flex';
  }

  hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
  }

  showError(message, elementId = null) {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = message;
        element.style.display = 'block';
        return;
      }
    }
    alert(`Error: ${message}`);
  }

  showSuccess(message, elementId = null) {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.display = 'block';
        setTimeout(() => {
          element.style.display = 'none';
        }, 3000);
        return;
      }
    }
    alert(message);
  }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new EnhancedLoanApp();
});