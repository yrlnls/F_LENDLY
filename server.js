const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory database (replace with real database in production)
let users = [
  {
    id: 'admin-1',
    name: 'System Administrator',
    email: 'admin@flendly.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    registeredAt: new Date().toISOString()
  }
];

let loans = [];

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role = 'applicant' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    if (users.find(u => u.email === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      registeredAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit Loan Application
app.post('/api/loans', authenticateToken, (req, res) => {
  try {
    const { amount, purpose, businessName, businessRegistration } = req.body;

    // Validation
    if (!amount || !purpose) {
      return res.status(400).json({ error: 'Amount and purpose are required' });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Create loan application
    const newLoan = {
      id: uuidv4(),
      userId: req.user.id,
      applicantName: req.user.name || 'Unknown',
      applicantEmail: req.user.email,
      amount: Number(amount),
      purpose: purpose.trim(),
      businessName: businessName?.trim() || null,
      businessRegistration: businessRegistration?.trim() || null,
      status: 'pending',
      paymentStatus: 'not_started',
      submittedAt: new Date().toISOString(),
      repayments: []
    };

    loans.push(newLoan);

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan: newLoan
    });
  } catch (error) {
    console.error('Loan submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User's Loan Applications
app.get('/api/loans/my', authenticateToken, (req, res) => {
  try {
    const userLoans = loans.filter(loan => loan.userId === req.user.id);
    res.json(userLoans);
  } catch (error) {
    console.error('Error fetching user loans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Loan Applications (Admin only)
app.get('/api/loans', authenticateToken, requireAdmin, (req, res) => {
  try {
    res.json(loans);
  } catch (error) {
    console.error('Error fetching all loans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Loan Status (Admin only)
app.patch('/api/loans/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const loanIndex = loans.findIndex(loan => loan.id === id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Update loan status
    loans[loanIndex].status = status;
    loans[loanIndex].updatedAt = new Date().toISOString();

    // Generate repayment schedule if approved
    if (status === 'approved' && loans[loanIndex].repayments.length === 0) {
      const amount = loans[loanIndex].amount;
      const monthlyAmount = Math.round(amount / 3);
      const repayments = [];
      
      for (let i = 1; i <= 3; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        repayments.push({
          id: uuidv4(),
          dueDate: dueDate.toISOString(),
          amount: i === 3 ? amount - (monthlyAmount * 2) : monthlyAmount, // Adjust last payment for rounding
          paid: false,
          paidAt: null
        });
      }
      
      loans[loanIndex].repayments = repayments;
      loans[loanIndex].paymentStatus = 'active';
    }

    res.json({
      message: 'Loan status updated successfully',
      loan: loans[loanIndex]
    });
  } catch (error) {
    console.error('Error updating loan status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Repayment Status
app.patch('/api/loans/:loanId/repayments/:repaymentId', authenticateToken, (req, res) => {
  try {
    const { loanId, repaymentId } = req.params;
    const { paid } = req.body;

    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Check if user owns the loan or is admin
    if (loan.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const repaymentIndex = loan.repayments.findIndex(r => r.id === repaymentId);
    if (repaymentIndex === -1) {
      return res.status(404).json({ error: 'Repayment not found' });
    }

    // Update repayment status
    loan.repayments[repaymentIndex].paid = paid;
    loan.repayments[repaymentIndex].paidAt = paid ? new Date().toISOString() : null;

    // Update overall payment status
    const paidCount = loan.repayments.filter(r => r.paid).length;
    const totalCount = loan.repayments.length;
    
    if (paidCount === 0) {
      loan.paymentStatus = 'active';
    } else if (paidCount === totalCount) {
      loan.paymentStatus = 'completed';
    } else {
      loan.paymentStatus = 'partial';
    }

    res.json({
      message: 'Repayment status updated successfully',
      loan
    });
  } catch (error) {
    console.error('Error updating repayment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Users (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const safeUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      registeredAt: user.registeredAt
    }));
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`F-lendly server running on port ${PORT}`);
  console.log(`Admin login: admin@flendly.com / password`);
});