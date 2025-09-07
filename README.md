# Performance Management System

A comprehensive web-based performance management system for fintech companies, built with Next.js, TypeScript, and Prisma.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- (Optional) Active Directory server for AD integration

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd performance-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your security keys:
```env
JWT_SECRET="your-secure-random-secret-key"
SESSION_SECRET="another-secure-random-secret-key"
```

Generate secure secrets using:
```bash
openssl rand -base64 32
```

4. **Initialize the database**
```bash
npx prisma db push
npx prisma db seed
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open the application**
Navigate to http://localhost:3000

## 🔑 Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@company.com | admin123 | Full system access |
| HR | hr@company.com | hr123 | User & review management |
| Supervisor | jan.nowak@company.com | supervisor123 | Team reviews |
| Employee | piotr.kowalczyk@company.com | employee123 | Self reviews |

## 🎯 Core Features

### Performance Review System

#### 3-Phase Review Process
1. **Phase 1: Self-Evaluation** 
   - Employees create personal goals (max 7)
   - Self-assess on 5 core competencies
   - Add comments and justifications

2. **Phase 2: Supervisor Evaluation**
   - Supervisors review employee submissions
   - Provide scores and feedback
   - Assess goal achievement

3. **Phase 3: Final Meeting**
   - Collaborative review finalization
   - Final grades assignment
   - Development plan creation

#### Core Competencies
- **Delivery** - Achieving goals and tasks
- **Development** - Continuous skill improvement
- **Innovation** - Creativity and new solutions
- **Courage** - Taking on challenges
- **Resilience** - Dealing with difficulties

#### Grading Scale
- **5** - Outstanding
- **4** - Above expectations
- **3** - Solid performer
- **2** - Developing
- **1** - Below expectations

### Multi-Language Support
- English and Polish languages supported
- Toggle via globe icon in navigation
- All UI elements fully translated
- Persistent language preference

### User Management
- Role-based access control (RBAC)
- Bulk user import via CSV
- User activation/deactivation
- Supervisor assignment
- Department organization

## 🔐 Security Features

### Authentication & Authorization
- JWT tokens in httpOnly cookies
- Session-based authentication
- Role-based access control
- Password policy enforcement

### Security Measures Implemented
- **CSRF Protection** - Token validation for state-changing operations
- **Rate Limiting** - 5 login attempts per 15 minutes
- **Account Lockout** - 30-minute lockout after failed attempts
- **Security Headers** - CSP, X-Frame-Options, HSTS
- **Input Validation** - Zod schema validation
- **SQL Injection Prevention** - Parameterized queries via Prisma
- **XSS Protection** - Content sanitization
- **Password Security** - Bcrypt with cost factor 12

## 🏢 Active Directory Integration

### Overview
Enterprise-grade Active Directory integration for user synchronization and authentication.

📖 **[Complete AD Integration Guide](./AD-INTEGRATION.md)** - Detailed technical documentation

### Quick Start

1. **Add AD settings to `.env`**
```env
AD_ENABLED=true
AD_DOMAIN=company.local
AD_URL=ldap://dc.company.local:389
AD_BASE_DN=DC=company,DC=local
AD_USERNAME=serviceaccount
AD_PASSWORD=servicepassword
```

2. **Access AD Admin Panel**
- Log in as admin → Navigate to `/admin/active-directory`
- Configure connection settings → Test connection → Sync users

### Key Features
✅ **User Synchronization** - Names, emails, departments, manager relationships  
✅ **Group-Based Roles** - Automatic role assignment from AD groups  
✅ **LDAP/LDAPS Support** - Secure connections with SSL/TLS  
✅ **Incremental Sync** - Only processes changes, not full directory  
✅ **Account Lifecycle** - Auto-activation/deactivation based on AD status  
✅ **Organizational Hierarchy** - Preserves manager-subordinate structure  

### Technical Capabilities
- **Authentication Methods**: AD-only or hybrid (AD + local)
- **Connection Types**: LDAP (389), LDAPS (636), Global Catalog (3268/3269)
- **Search Filters**: Customizable LDAP queries with advanced filtering
- **User Account Control**: Handles all AD account states and restrictions
- **Group Mapping**: Flexible AD group to application role mapping
- **Error Handling**: Comprehensive error codes and retry logic

### Security Features
- **Service Account**: Minimal privilege principle
- **Certificate Validation**: Full SSL/TLS certificate chain validation
- **Rate Limiting**: Protection against sync abuse
- **Audit Logging**: Complete audit trail of all AD operations
- **Data Encryption**: All credentials encrypted in transit

## 📊 Admin Functions

### Review Period Management
1. **Create Period** - Define review cycles (Mid-Year/End-Year)
2. **Open Period** - Automatically creates reviews for all employees
3. **Monitor Progress** - Track completion rates
4. **Close Period** - Finalize and archive reviews

### User Administration
- **Add Users** - Individual or bulk creation
- **Import CSV** - Bulk import with validation
- **Manage Roles** - Assign system roles
- **Set Supervisors** - Define reporting structure
- **Export Data** - Download user lists

### System Configuration
- Password policies
- Email notifications
- Review templates
- Competency weights
- Grading scales

## 🛠 Development

### Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT with httpOnly cookies
- **Validation**: Zod schemas
- **UI Components**: Radix UI primitives

### Project Structure
```
performance-system/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard
│   └── review/            # Review interface
├── components/            # React components
├── contexts/              # React contexts
├── lib/                   # Utilities & configs
│   ├── auth.ts           # Authentication
│   ├── active-directory.ts # AD integration
│   └── translations.ts   # i18n strings
├── prisma/               
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Test data
└── public/               # Static assets
```

### Database Schema
- **User** - System users with roles
- **Review** - Performance reviews
- **Goal** - Employee-defined goals
- **Competency** - Competency evaluations
- **ReviewPeriod** - Review cycles
- **AuditLog** - System audit trail
- **LoginAttempt** - Security tracking

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks

# Database commands
npx prisma studio    # Open database GUI
npx prisma db push   # Apply schema changes
npx prisma generate  # Generate Prisma client
npx prisma db seed   # Seed test data
```

## 🚀 Deployment

### Production Checklist
1. **Environment Variables**
   - Set strong JWT_SECRET and SESSION_SECRET
   - Configure production database URL
   - Set NODE_ENV=production
   - Configure email service

2. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Security Configuration**
   - Enable HTTPS
   - Configure firewall rules
   - Set up backup strategy
   - Enable audit logging

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Settings
- **Development**: SQLite, debug logging, test accounts visible
- **Production**: PostgreSQL, error sanitization, test accounts hidden

## 🐛 Troubleshooting

### Common Issues

**Prisma Client Errors**
```bash
npx prisma generate
npm run dev
```

**Database Connection Issues**
- Check DATABASE_URL in .env
- Ensure database server is running
- Verify network connectivity

**Authentication Problems**
- Clear browser cookies
- Check JWT_SECRET is set
- Verify token expiration

**AD Sync Failures**
- Verify LDAP URL and credentials
- Check network access to AD server (ports 389/636/3268/3269)
- Review AD permissions for service account
- Check Base DN format (DC=company,DC=local)
- Test with: `telnet dc.company.local 389`
- Verify with: `Get-ADUser -Filter * | Select -First 5` (PowerShell)

**AD Authentication Issues**
- Check user account status in AD
- Verify domain controller connectivity
- Test credentials manually with ldapsearch
- Check for account lockouts or password expiration
- Verify UPN format (user@domain.com)

**Language Not Switching**
- Clear browser local storage
- Check translation keys in lib/translations.ts

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Review Management
- `GET /api/reviews` - List user's reviews
- `GET /api/reviews/[id]` - Get specific review
- `PATCH /api/reviews/[id]` - Update review
- `POST /api/reviews/[id]/phase` - Change review phase

### User Management (Admin/HR)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/[id]` - Update user
- `POST /api/admin/users/import` - CSV import

### Active Directory
- `GET /api/admin/sync-ad` - Check AD status
- `POST /api/admin/sync-ad` - Trigger AD sync

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is created for demonstration purposes.

## 💡 Support

For issues and questions:
- Check the troubleshooting section
- Review existing issues
- Create a new issue with detailed information

## 🙏 Acknowledgments

- Built with Next.js and Prisma
- UI components from Radix UI
- Icons from Lucide React
- Styling with Tailwind CSS