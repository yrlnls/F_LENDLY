// Authentication and API helper functions
class AuthService {
  static TOKEN_KEY = 'flendly_token';
  static USER_KEY = 'flendly_user';

  static setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = 'index.html';
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  }

  static requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  static requireAdmin() {
    if (!this.isAuthenticated() || !this.isAdmin()) {
      alert('Admin access required');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
}

class APIService {
  static BASE_URL = 'http://localhost:3000/api';

  static async request(endpoint, options = {}) {
    const token = AuthService.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async register(userData) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  static async submitLoan(loanData) {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData)
    });
  }

  static async getMyLoans() {
    return this.request('/loans/my');
  }

  static async getAllLoans() {
    return this.request('/loans');
  }

  static async updateLoanStatus(loanId, status) {
    return this.request(`/loans/${loanId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  static async updateRepaymentStatus(loanId, repaymentId, paid) {
    return this.request(`/loans/${loanId}/repayments/${repaymentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ paid })
    });
  }

  static async getAllUsers() {
    return this.request('/users');
  }
}

// Initialize authentication check on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is on a protected page
  const protectedPages = ['applicant.html', 'admin.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage)) {
    if (currentPage === 'admin.html') {
      AuthService.requireAdmin();
    } else {
      AuthService.requireAuth();
    }
  }

  // Add logout functionality to logout buttons
  const logoutBtns = document.querySelectorAll('#logoutBtn, #adminLogoutBtn');
  logoutBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      AuthService.logout();
    });
  });
});