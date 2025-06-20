// Basic unit tests for script.js utility functions

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`❌ ${message} | Expected: ${expected}, Got: ${actual}`);
  } else {
    console.log(`✅ ${message}`);
  }
}

// --- Unit tests for validation functions ---
assertEqual(isValidEmail('test@example.com'), true, 'Valid email passes');
assertEqual(isValidEmail('bademail'), false, 'Invalid email fails');
assertEqual(isValidName('John'), true, 'Valid name passes');
assertEqual(isValidName(''), false, 'Empty name fails');
assertEqual(isValidAmount(100), true, 'Valid amount passes');
assertEqual(isValidAmount(-5), false, 'Negative amount fails');
assertEqual(isValidPurpose('Business'), true, 'Valid purpose passes');
assertEqual(isValidPurpose(''), false, 'Empty purpose fails');

// --- Integration test for loan creation and retrieval ---
(function testLoanStorage() {
  const testLoan = {
    id: 9999,
    name: 'Test User',
    email: 'testuser@example.com',
    amount: 1000,
    purpose: 'Test',
    status: 'pending',
    paymentStatus: '-',
    submittedAt: '2024-06-01 12:00:00',
    repayments: null
  };
  let loans = getLoans();
  loans.push(testLoan);
  setLoans(loans);

  const loadedLoans = getLoans();
  const found = loadedLoans.some(l => l.id === 9999 && l.email === 'testuser@example.com');
  assertEqual(found, true, 'Loan is stored and retrievable');

  // Cleanup
  setLoans(loans.filter(l => l.id !== 9999));
})();

// --- UI test (manual) ---
// To test UI, open the application and:
// 1. Submit a loan application with valid and invalid data.
// 2. Approve/reject loans as admin.
// 3. Mark repayments as paid/unpaid.
// 4. Check that errors are handled gracefully.

// Note: For full UI/integration testing, consider using a framework like Jest with jsdom, or Cypress for end-to-end tests.
