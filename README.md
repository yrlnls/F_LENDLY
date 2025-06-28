# F-lendly - Professional Loan Application System

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Node.js-18+-brightgreen.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/Bootstrap-5.3-purple.svg" alt="Bootstrap">
</div>

## 🏦 Overview

F-lendly is a modern, professional loan application management system built with cutting-edge web technologies. It provides a seamless experience for both loan applicants and administrators with a focus on security, usability, and professional fintech aesthetics.

### ✨ Key Features

- **🔐 Secure Authentication**: JWT-based authentication with role-based access control
- **📱 Responsive Design**: Mobile-first approach with professional fintech UI
- **⚡ Real-time Updates**: Dynamic loan status tracking and management
- **🎨 Modern UI/UX**: Professional color scheme with blues and purples
- **🔒 Bank-Grade Security**: Encrypted data transmission and secure storage
- **📊 Admin Dashboard**: Comprehensive loan and user management interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd f-lendly-loan-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The application will be running with hot reload enabled

## 📁 Project Structure

```
f-lendly-loan-system/
├── 📄 index.html              # Landing page
├── 📄 login.html              # User login page
├── 📄 register.html           # User registration page
├── 📄 applicant.html          # Applicant dashboard
├── 📄 admin.html              # Admin dashboard
├── 🎨 style.css               # Enhanced fintech styling
├── ⚙️ server.js               # Express.js backend server
├── 🔐 auth.js                 # Authentication utilities
├── 📜 enhanced-script.js      # Enhanced frontend logic
├── 📜 script.js               # Legacy frontend utilities
├── 🧪 test.js                 # Basic unit tests
├── 📦 package.json            # Project dependencies
├── 🗃️ db.json                 # Sample data (development)
└── 📚 README.md               # This file
```

## 👥 User Roles & Features

### 🧑‍💼 Applicant Features

- **Account Management**
  - Secure registration and login
  - Profile management
  - Dashboard with loan statistics

- **Loan Application**
  - Intuitive application form
  - Business and personal loan options
  - Real-time form validation
  - Application status tracking

- **Loan Management**
  - View all submitted applications
  - Track approval status
  - Monitor repayment schedules
  - Mark payments as paid/unpaid

### 👨‍💻 Admin Features

- **Dashboard Overview**
  - System statistics and metrics
  - Quick access to key functions
  - Real-time data updates

- **Application Management**
  - Review all loan applications
  - Approve or reject applications
  - Update application statuses
  - Generate repayment schedules

- **User Management**
  - View all registered users
  - Monitor user activity
  - Manage user roles and permissions

## 🛠️ API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Loan Management
- `POST /api/loans` - Submit loan application
- `GET /api/loans/my` - Get user's loans
- `GET /api/loans` - Get all loans (Admin only)
- `PATCH /api/loans/:id/status` - Update loan status (Admin only)
- `PATCH /api/loans/:loanId/repayments/:repaymentId` - Update repayment status

### User Management
- `GET /api/users` - Get all users (Admin only)

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#4f46e5) to Royal Blue (#2563eb)
- **Secondary**: Complementary blues for accents
- **Accent**: Sophisticated violet (#8b5cf6)
- **Status Colors**: Industry-standard green, amber, red
- **Neutrals**: Professional gray scale

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Scale**: Responsive typography with proper hierarchy

### Components
- **Cards**: Elevated with subtle shadows and rounded corners
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Enhanced inputs with icons and validation
- **Tables**: Responsive with hover states and sorting

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port
JWT_SECRET=your-secret-key   # JWT signing secret
NODE_ENV=development         # Environment mode
```

### Demo Credentials
```
Admin Access:
Email: admin@flendly.com
Password: password

New Users:
Register through the registration form
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for loan workflows
- Manual UI testing guidelines included

### Testing Checklist
- [ ] User registration and login
- [ ] Loan application submission
- [ ] Admin approval/rejection workflow
- [ ] Repayment tracking functionality
- [ ] Responsive design across devices

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Deployment

### Production Build
```bash
npm run start
```

### Deployment Options
- **Heroku**: Ready for Heroku deployment
- **Vercel**: Frontend deployment with serverless functions
- **DigitalOcean**: Full-stack deployment
- **AWS**: EC2 or Elastic Beanstalk deployment

### Production Checklist
- [ ] Set secure JWT_SECRET
- [ ] Configure HTTPS
- [ ] Set up database (replace in-memory storage)
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

## 🔒 Security Features

- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Data Validation**: Server-side input validation
- **Password Security**: Bcrypt hashing
- **CORS Protection**: Configurable cross-origin policies
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: Token-based protection

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **JavaScript**: ES6+ with consistent formatting
- **CSS**: BEM methodology with CSS custom properties
- **HTML**: Semantic markup with accessibility considerations
- **Comments**: JSDoc for functions, inline for complex logic

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## 📋 Roadmap

### Version 1.1
- [ ] Email notifications for loan status updates
- [ ] Advanced search and filtering
- [ ] Loan calculator widget
- [ ] Document upload functionality

### Version 1.2
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Automated loan scoring

### Version 2.0
- [ ] Mobile application
- [ ] Integration with payment gateways
- [ ] Advanced reporting features
- [ ] Machine learning loan approval

## 🐛 Known Issues

- Repayment schedule generation uses fixed 3-month terms
- In-memory database resets on server restart
- Limited file upload validation
- Basic error handling in some edge cases

## 📞 Support

### Documentation
- [API Documentation](./docs/api.md)
- [User Guide](./docs/user-guide.md)
- [Admin Guide](./docs/admin-guide.md)

### Getting Help
- 📧 Email: support@flendly.com
- 💬 Discord: [F-lendly Community](https://discord.gg/flendly)
- 🐛 Issues: [GitHub Issues](https://github.com/flendly/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bootstrap Team** for the excellent CSS framework
- **Font Awesome** for comprehensive icon library
- **Inter Font** by Rasmus Andersson for beautiful typography
- **Express.js Community** for the robust backend framework

---

<div align="center">
  <p>Built with ❤️ by the F-lendly Team</p>
  <p>
    <a href="#top">Back to Top</a> •
    <a href="https://flendly.com">Website</a> •
    <a href="mailto:support@flendly.com">Contact</a>
  </p>
</div>