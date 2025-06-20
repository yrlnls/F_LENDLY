// ======================
// Constants & Config
// ======================
const API_URL = "http://localhost:3000";
const STORAGE_KEYS = {
  LOANS: 'loans',
  USERS: 'users'
};
const SESSION_KEYS = {
  USER_EMAIL: 'userEmail',
  USER_NAME: 'userName'
};

// ======================
// Utility Functions
// ======================
class StorageHelper {
  static get(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (e) {
      console.error(`Error retrieving ${key}:`, e);
      alert(`Failed to load ${key} data.`);
      return fallback;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
      alert(`Failed to save ${key} data. Please try again.`);
    }
  }

  static getLoans() {
    return this.get(STORAGE_KEYS.LOANS);
  }

  static setLoans(loans) {
    this.set(STORAGE_KEYS.LOANS, loans);
  }

  static getUsers() {
    return this.get(STORAGE_KEYS.USERS);
  }

  static setUsers(users) {
    this.set(STORAGE_KEYS.USERS, users);
  }
}

class ValidationHelper {
  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidName(name) {
    return typeof name === 'string' && name.trim().length >= 2;
  }

  static isValidAmount(amount) {
    return !isNaN(amount) && Number(amount) > 0;
  }

  static isValidPurpose(purpose) {
    return typeof purpose === 'string' && purpose.trim().length > 0;
  }

  static validatePassword(password) {
    return password && password.length >= 6;
  }
}

class DateHelper {
  static addMonths(dateStr, months) {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString();
  }

  static currentDateString() {
    return new Date().toLocaleString();
  }
}

class UIHelper {
  static showLoading() {
    if (typeof window.showLoading === 'function') window.showLoading();
  }

  static hideLoading() {
    if (typeof window.hideLoading === 'function') window.hideLoading();
  }

  static async withLoading(fn) {
    this.showLoading();
    try {
      return await fn();
    } finally {
      this.hideLoading();
    }
  }

  static showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }

  static hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'none';
    }
  }

  static showSuccessMessage(elementId, duration = 2000) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'block';
      setTimeout(() => {
        element.style.display = 'none';
      }, duration);
    }
  }
}

// ======================
// Core Business Logic
// ======================
class LoanService {
  static generateRepayments(submittedAt, amount, count = 3) {
    return Array.from({ length: count }, (_, i) => ({
      due: DateHelper.addMonths(submittedAt, i + 1),
      paid: false,
      amount: Math.round(amount / count)
    }));
  }

  static createLoan(loanData) {
    const loans = StorageHelper.getLoans();
    const loan = {
      id: Date.now(),
      ...loanData,
      status: 'pending',
      paymentStatus: '-',
      submittedAt: DateHelper.currentDateString(),
      repayments: null
    };
    loans.push(loan);
    StorageHelper.setLoans(loans);
    return loan;
  }

  static updateLoanStatus(loanId, status) {
    const loans = StorageHelper.getLoans();
    const loanIndex = loans.findIndex(loan => loan.id == loanId);
    
    if (loanIndex === -1) return false;

    const updatedLoan = { 
      ...loans[loanIndex],
      status,
      paymentStatus: status === 'approved' ? 'Not started' : '-',
      repayments: status === 'approved' ? null : []
    };

    loans[loanIndex] = updatedLoan;
    StorageHelper.setLoans(loans);
    return updatedLoan;
  }

  static updateRepaymentStatus(loanId, repaymentIndex, paid) {
    const loans = StorageHelper.getLoans();
    const loanIndex = loans.findIndex(loan => loan.id == loanId);
    
    if (loanIndex === -1) return false;

    const loan = loans[loanIndex];
    if (!loan.repayments || !loan.repayments[repaymentIndex]) return false;

    const updatedRepayments = [...loan.repayments];
    updatedRepayments[repaymentIndex] = { 
      ...updatedRepayments[repaymentIndex],
      paid 
    };

    const paidCount = updatedRepayments.filter(r => r.paid).length;
    const updatedLoan = {
      ...loan,
      repayments: updatedRepayments,
      paymentStatus: `${paidCount} of ${updatedRepayments.length} paid`
    };

    loans[loanIndex] = updatedLoan;
    StorageHelper.setLoans(loans);
    return updatedLoan;
  }

  static getLoansByEmail(email) {
    return StorageHelper.getLoans().filter(loan => loan.email === email);
  }

  static getAllLoans() {
    return StorageHelper.getLoans();
  }
}

class UserService {
  static registerUser(userData) {
    const users = StorageHelper.getUsers();
    
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already registered.');
    }

    const newUser = {
      id: Date.now(),
      ...userData,
      registeredAt: DateHelper.currentDateString()
    };
    
    users.push(newUser);
    StorageHelper.setUsers(users);
    return newUser;
  }

  static authenticate(email, password) {
    const users = StorageHelper.getUsers();
    return users.find(u => u.email === email && u.password === password);
  }

  static getAllUsers() {
    return StorageHelper.getUsers();
  }
}

// ======================
// UI Rendering
// ======================
class LoanRenderer {
  static renderApplicantLoans(loans, containerId = 'applicantLoansTable') {
    const tbody = document.querySelector(`#${containerId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = loans.map(loan => {
      const paymentStatus = this.getPaymentStatus(loan);
      return `
        <tr>
          <td>${loan.id}</td>
          <td>${loan.amount}</td>
          <td>${loan.purpose}</td>
          <td>${loan.status || 'pending'}</td>
          <td>${paymentStatus}</td>
          <td>${loan.submittedAt || ''}</td>
          <td>
            ${loan.status === 'approved' ? 
              `<button class="btn btn-info btn-sm applicant-repayment-btn" data-id="${loan.id}">View</button>` : 
              '-'}
          </td>
        </tr>
      `;
    }).join('');
  }

  static renderAdminLoans(loans, containerId = 'loanApplicationsTable') {
    const tbody = document.querySelector(`#${containerId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = loans.map(loan => `
      <tr>
        <td>${loan.id}</td>
        <td>${loan.email}</td>
        <td>${loan.amount}</td>
        <td>
          <select class="form-select form-select-sm status-select" data-id="${loan.id}">
            <option value="pending" ${loan.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${loan.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${loan.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td>${loan.submittedAt || ''}</td>
        <td>
          <button class="btn btn-success btn-sm approve-btn" data-id="${loan.id}" ${loan.status === 'approved' ? 'disabled' : ''}>Approve</button>
          <button class="btn btn-danger btn-sm reject-btn" data-id="${loan.id}" ${loan.status === 'rejected' ? 'disabled' : ''}>Reject</button>
        </td>
        <td>
          <button class="btn btn-info btn-sm repayment-btn" data-id="${loan.id}">View</button>
        </td>
      </tr>
    `).join('');
  }

  static renderRepaymentModal(loan, isApplicant = false) {
    const modalBody = document.getElementById('repaymentModalBody');
    if (!modalBody) return;

    if (!loan?.repayments?.length) {
      modalBody.innerHTML = '<p>No repayment schedule available.</p>';
      return;
    }

    const rows = loan.repayments.map((repayment, idx) => `
      <tr>
        <td>${repayment.due}</td>
        <td>${repayment.amount}</td>
        <td>${repayment.paid ? 'Paid' : 'Unpaid'}</td>
        ${isApplicant ? `
          <td>
            ${repayment.paid ?
              `<button class="btn btn-secondary btn-sm mark-unpaid-btn" data-loan="${loan.id}" data-idx="${idx}">Mark Unpaid</button>` :
              `<button class="btn btn-success btn-sm mark-paid-btn" data-loan="${loan.id}" data-idx="${idx}">Mark Paid</button>`}
          </td>` : ''}
      </tr>
    `).join('');

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
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  static renderUsers(users, containerId = 'usersTable') {
    const tbody = document.querySelector(`#${containerId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id || ''}</td>
        <td>${user.name || ''}</td>
        <td>${user.email || ''}</td>
        <td>${user.registeredAt || ''}</td>
        <td>
          <button class="btn btn-warning btn-sm" disabled>Edit</button>
          <button class="btn btn-danger btn-sm" disabled>Delete</button>
        </td>
      </tr>
    `).join('');
  }

  static getPaymentStatus(loan) {
    if (loan.status !== 'approved') return '-';
    
    if (!loan.repayments) {
      const repayments = LoanService.generateRepayments(loan.submittedAt, loan.amount);
      LoanService.updateRepaymentStatus(loan.id, 0, false); // This will update the loan with repayments
      return `0 of ${repayments.length} paid`;
    }
    
    const paidCount = loan.repayments.filter(r => r.paid).length;
    return `${paidCount} of ${loan.repayments.length} paid`;
  }
}

// ======================
// Event Handlers
// ======================
class EventHandlers {
  static init() {
    this.initApplicantDashboard();
    this.initAdminDashboard();
    this.initRegistration();
    this.initLogin();
    this.initLoanApplication();
    this.initGlobalEventListeners();
  }

  static initApplicantDashboard() {
    if (!document.getElementById('applicantLoansTable')) return;
    
    const emailInput = document.getElementById('applicantEmail');
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        this.loadApplicantLoans(emailInput.value);
      });
    } else {
      const email = sessionStorage.getItem(SESSION_KEYS.USER_EMAIL);
      if (email) this.loadApplicantLoans(email);
    }
  }

  static initAdminDashboard() {
    if (document.getElementById('loanApplicationsTable')) {
      this.loadAdminLoans();
    }
    if (document.getElementById('usersTable')) {
      this.loadAdminUsers();
    }
  }

  static initRegistration() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      UIHelper.hideError('registerError');

      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim().toLowerCase();
      const password = document.getElementById('registerPassword').value;

      try {
        if (!ValidationHelper.isValidName(name)) {
          throw new Error('Please enter a valid name (at least 2 characters).');
        }
        if (!ValidationHelper.isValidEmail(email)) {
          throw new Error('Please enter a valid email address.');
        }
        if (!ValidationHelper.validatePassword(password)) {
          throw new Error('Password must be at least 6 characters.');
        }

        await UIHelper.withLoading(async () => {
          UserService.registerUser({ name, email, password });
        });

        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
      } catch (error) {
        UIHelper.showError('registerError', error.message);
      }
    });
  }

  static initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      UIHelper.hideError('loginError');

      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;

      try {
        const user = await UIHelper.withLoading(() => 
          UserService.authenticate(email, password)
        );

        if (!user) {
          throw new Error('Invalid email or password.');
        }

        sessionStorage.setItem(SESSION_KEYS.USER_EMAIL, user.email);
        sessionStorage.setItem(SESSION_KEYS.USER_NAME, user.name);
        alert('Login successful!');
        window.location.href = 'applicant.html';
      } catch (error) {
        UIHelper.showError('loginError', error.message);
      }
    });
  }

  static initLoanApplication() {
    const form = document.getElementById('loanForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('applicantName').value.trim(),
        email: document.getElementById('applicantEmail').value.trim().toLowerCase(),
        amount: document.getElementById('amount').value,
        purpose: document.getElementById('purpose').value.trim(),
        businessName: document.getElementById('businessName').value.trim(),
        businessRegistration: document.getElementById('businessRegistration').value.trim()
      };

      try {
        if (!ValidationHelper.isValidName(formData.name)) {
          throw new Error('Please enter your full name (at least 2 characters).');
        }
        if (!ValidationHelper.isValidEmail(formData.email)) {
          throw new Error('Please enter a valid email address.');
        }
        if (!ValidationHelper.isValidAmount(formData.amount)) {
          throw new Error('Please enter a valid loan amount greater than 0.');
        }
        if (!ValidationHelper.isValidPurpose(formData.purpose)) {
          throw new Error('Please enter the purpose of the loan.');
        }

        await UIHelper.withLoading(() => {
          LoanService.createLoan(formData);
        });

        UIHelper.showSuccessMessage('successMessage');
        form.reset();
        this.loadApplicantLoans(formData.email);
      } catch (error) {
        alert(error.message);
      }
    });
  }

  static initGlobalEventListeners() {
    document.addEventListener('click', (e) => {
      // Applicant repayment modal
      if (e.target.classList.contains('applicant-repayment-btn')) {
        const loanId = e.target.getAttribute('data-id');
        this.showApplicantRepaymentModal(loanId);
      }
      
      // Admin repayment modal
      if (e.target.classList.contains('repayment-btn')) {
        const loanId = e.target.getAttribute('data-id');
        this.showAdminRepaymentModal(loanId);
      }
      
      // Mark payment as paid/unpaid
      if (e.target.classList.contains('mark-paid-btn')) {
        const loanId = e.target.getAttribute('data-loan');
        const idx = e.target.getAttribute('data-idx');
        this.markRepaymentPaid(loanId, idx, true);
      }
      if (e.target.classList.contains('mark-unpaid-btn')) {
        const loanId = e.target.getAttribute('data-loan');
        const idx = e.target.getAttribute('data-idx');
        this.markRepaymentPaid(loanId, idx, false);
      }
      
      // Approve/Reject loans
      if (e.target.classList.contains('approve-btn')) {
        const loanId = e.target.getAttribute('data-id');
        this.updateLoanStatus(loanId, 'approved');
      }
      if (e.target.classList.contains('reject-btn')) {
        const loanId = e.target.getAttribute('data-id');
        this.updateLoanStatus(loanId, 'rejected');
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('status-select')) {
        const loanId = e.target.getAttribute('data-id');
        const status = e.target.value;
        this.updateLoanStatus(loanId, status);
      }
    });
  }

  static async loadApplicantLoans(email) {
    try {
      const loans = await UIHelper.withLoading(() => 
        LoanService.getLoansByEmail(email)
      );
      LoanRenderer.renderApplicantLoans(loans);
    } catch (error) {
      console.error('Error loading applicant loans:', error);
      alert('Failed to load your loan applications.');
    }
  }

  static async loadAdminLoans() {
    try {
      const loans = await UIHelper.withLoading(LoanService.getAllLoans);
      LoanRenderer.renderAdminLoans(loans);
    } catch (error) {
      console.error('Error loading admin loans:', error);
      alert('Failed to load loan applications.');
    }
  }

  static async loadAdminUsers() {
    try {
      const users = await UIHelper.withLoading(UserService.getAllUsers);
      LoanRenderer.renderUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users.');
    }
  }

  static showApplicantRepaymentModal(loanId) {
    const loan = StorageHelper.getLoans().find(l => l.id == loanId);
    if (loan) {
      LoanRenderer.renderRepaymentModal(loan, true);
      new bootstrap.Modal(document.getElementById('repaymentModal')).show();
    }
  }

  static showAdminRepaymentModal(loanId) {
    const loan = StorageHelper.getLoans().find(l => l.id == loanId);
    if (loan) {
      LoanRenderer.renderRepaymentModal(loan, false);
      new bootstrap.Modal(document.getElementById('repaymentModal')).show();
    }
  }

  static async markRepaymentPaid(loanId, idx, paid) {
    try {
      await UIHelper.withLoading(() => {
        const updatedLoan = LoanService.updateRepaymentStatus(loanId, idx, paid);
        if (updatedLoan) {
          this.showApplicantRepaymentModal(loanId);
          this.loadApplicantLoans(updatedLoan.email);
        }
      });
    } catch (error) {
      console.error('Error updating repayment status:', error);
      alert('Failed to update repayment status.');
    }
  }

  static async updateLoanStatus(loanId, status) {
    try {
      await UIHelper.withLoading(() => {
        const updatedLoan = LoanService.updateLoanStatus(loanId, status);
        if (updatedLoan) {
          this.loadAdminLoans();
          this.loadApplicantLoans(updatedLoan.email);
        }
      });
    } catch (error) {
      console.error('Error updating loan status:', error);
      alert('Failed to update loan status.');
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  EventHandlers.init();
});