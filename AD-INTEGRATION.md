# Active Directory Integration - Technical Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Authentication Methods](#authentication-methods)
- [User Synchronization](#user-synchronization)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Overview

The Performance Management System provides enterprise-grade Active Directory (AD) integration, enabling organizations to:
- Synchronize users and organizational structure from AD
- Authenticate users against AD credentials
- Map AD groups to application roles
- Maintain manager-subordinate relationships
- Automatically manage user lifecycle (activation/deactivation)

## Architecture

### System Components

```
┌─────────────────┐     LDAPS/LDAP      ┌──────────────────┐
│                 │◄────────────────────►│                  │
│  Active         │                      │  Performance     │
│  Directory      │                      │  Management      │
│  Domain         │                      │  System          │
│  Controller     │                      │                  │
└─────────────────┘                      └──────────────────┘
        │                                         │
        │                                         ▼
        │                                ┌──────────────────┐
        │                                │   PostgreSQL/    │
        └───────── User Data ──────────► │   SQLite DB      │
                   Sync                  └──────────────────┘
```

### Data Flow

1. **Initial Connection**: System connects to AD using LDAP/LDAPS
2. **Authentication**: Bind using service account credentials
3. **User Search**: Query AD for users matching filter criteria
4. **Data Extraction**: Retrieve user attributes and group memberships
5. **Synchronization**: Update local database with AD data
6. **Relationship Mapping**: Establish manager-subordinate relationships

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Active Directory Configuration
AD_ENABLED=true                    # Enable/disable AD integration
AD_DOMAIN=company.local            # Your AD domain
AD_URL=ldap://dc.company.local:389 # LDAP server URL (use ldaps:// for SSL)
AD_BASE_DN=DC=company,DC=local     # Base Distinguished Name for searches
AD_USERNAME=svc_performance        # Service account username
AD_PASSWORD=ServiceAccount123!     # Service account password

# Optional Advanced Configuration
AD_SEARCH_FILTER=(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))
AD_SEARCH_ATTRIBUTES=sAMAccountName,mail,givenName,sn,displayName,employeeID,department,title,manager,memberOf,userAccountControl
AD_TLS_REJECT_UNAUTHORIZED=false   # Set to true for production with valid certificates
```

### LDAP URL Formats

```bash
# Standard LDAP (Port 389)
AD_URL=ldap://dc.company.local:389

# LDAP over SSL/TLS (Port 636)
AD_URL=ldaps://dc.company.local:636

# Global Catalog (Port 3268)
AD_URL=ldap://dc.company.local:3268

# Global Catalog over SSL (Port 3269)
AD_URL=ldaps://dc.company.local:3269
```

### Service Account Requirements

The AD service account needs the following permissions:
- **Read** permission on user objects
- **Read** permission on group objects
- **Read** permission on organizational units
- **List contents** permission on the Base DN

PowerShell script to create service account:
```powershell
# Create service account
New-ADUser -Name "svc_performance" `
  -UserPrincipalName "svc_performance@company.local" `
  -Path "OU=Service Accounts,DC=company,DC=local" `
  -AccountPassword (ConvertTo-SecureString "ServiceAccount123!" -AsPlainText -Force) `
  -Enabled $true `
  -PasswordNeverExpires $true `
  -CannotChangePassword $true

# Grant read permissions
$acl = Get-Acl "AD:DC=company,DC=local"
$user = Get-ADUser "svc_performance"
$sid = New-Object System.Security.Principal.SecurityIdentifier $user.SID
$ace = New-Object System.DirectoryServices.ActiveDirectoryAccessRule(
  $sid,
  "ReadProperty",
  "Allow",
  "Descendents",
  "bf967aba-0de6-11d0-a285-00aa003049e2"  # User object GUID
)
$acl.AddAccessRule($ace)
Set-Acl -Path "AD:DC=company,DC=local" -AclObject $acl
```

## Authentication Methods

### 1. AD-Only Authentication

Users authenticate directly against AD:

```typescript
// lib/active-directory.ts - authenticateUser method
async authenticateUser(username: string, password: string): Promise<ADUser | null> {
  const client = ldap.createClient({
    url: this.config.url,
    tlsOptions: { rejectUnauthorized: false }
  });
  
  // Bind with user credentials
  const userDN = `${username}@${this.config.domain}`;
  client.bind(userDN, password, (err) => {
    if (!err) {
      // Authentication successful
      // Fetch user details and create/update local user
    }
  });
}
```

### 2. Hybrid Authentication

Support both AD and local authentication:

```typescript
// app/api/auth/login/route.ts
const user = await prisma.user.findUnique({ where: { email } });

if (user.authProvider === 'ACTIVE_DIRECTORY') {
  // Authenticate against AD
  const adService = new ActiveDirectoryService(config);
  const adUser = await adService.authenticateUser(username, password);
  if (!adUser) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
} else {
  // Local authentication
  if (!await verifyPassword(password, user.password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
```

## User Synchronization

### Sync Process Details

1. **Connect to AD**
```typescript
const client = ldap.createClient({
  url: 'ldap://dc.company.local:389',
  timeout: 5000,
  connectTimeout: 10000
});
```

2. **Search for Users**
```typescript
const searchOptions = {
  scope: 'sub',
  filter: '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
  attributes: ['sAMAccountName', 'mail', 'givenName', 'sn', 'department', 'manager', 'memberOf']
};

client.search('DC=company,DC=local', searchOptions, callback);
```

3. **Process User Data**
```typescript
// Extract user information
const userData = {
  email: adUser.mail,
  firstName: adUser.givenName,
  lastName: adUser.sn,
  employeeId: adUser.employeeID || adUser.sAMAccountName,
  department: adUser.department,
  position: adUser.title,
  externalId: adUser.sAMAccountName,
  authProvider: 'ACTIVE_DIRECTORY'
};

// Determine role from group membership
const role = determineRoleFromGroups(adUser.memberOf);
```

### LDAP Search Filters

Common filters for different scenarios:

```ldap
# All enabled users
(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))

# Users in specific OU
(&(objectClass=user)(objectCategory=person)(distinguishedName=*OU=Sales,DC=company,DC=local))

# Users in specific group
(&(objectClass=user)(memberOf=CN=Managers,OU=Groups,DC=company,DC=local))

# Users with email addresses
(&(objectClass=user)(mail=*))

# Users modified in last 7 days
(&(objectClass=user)(whenChanged>=20240301000000.0Z))
```

### User Account Control Flags

Understanding `userAccountControl` attribute:

```typescript
const UAC_FLAGS = {
  SCRIPT: 0x0001,                    // 1
  ACCOUNTDISABLE: 0x0002,            // 2 - Account is disabled
  HOMEDIR_REQUIRED: 0x0008,          // 8
  LOCKOUT: 0x0010,                   // 16 - Account is locked
  PASSWD_NOTREQD: 0x0020,            // 32
  PASSWD_CANT_CHANGE: 0x0040,        // 64
  ENCRYPTED_TEXT_PWD: 0x0080,        // 128
  NORMAL_ACCOUNT: 0x0200,            // 512 - Normal user account
  DONT_EXPIRE_PASSWORD: 0x10000,     // 65536
  PASSWORD_EXPIRED: 0x800000         // 8388608
};

// Check if account is disabled
function isAccountDisabled(uac: number): boolean {
  return (uac & UAC_FLAGS.ACCOUNTDISABLE) !== 0;
}
```

### Group to Role Mapping

```typescript
function determineRole(memberOf: string[]): string {
  const groups = memberOf.join(',').toLowerCase();
  
  // Priority order (highest to lowest)
  if (groups.includes('cn=domain admins') || 
      groups.includes('cn=enterprise admins')) {
    return 'ADMIN';
  }
  
  if (groups.includes('cn=hr') || 
      groups.includes('cn=human resources') ||
      groups.includes('cn=hr-team')) {
    return 'HR';
  }
  
  if (groups.includes('cn=managers') || 
      groups.includes('cn=supervisors') ||
      groups.includes('cn=team leads')) {
    return 'SUPERVISOR';
  }
  
  return 'EMPLOYEE';
}
```

### Manager Relationship Extraction

```typescript
// Extract manager from DN
function extractManagerFromDN(managerDN: string): string | null {
  // managerDN example: "CN=John Smith,OU=Management,DC=company,DC=local"
  const match = managerDN.match(/CN=([^,]+)/i);
  return match ? match[1] : null;
}

// Build organizational hierarchy
async function syncManagerRelationships(users: ADUser[]) {
  for (const user of users) {
    if (user.manager) {
      const managerCN = extractManagerFromDN(user.manager);
      const manager = users.find(u => 
        u.displayName === managerCN || 
        u.sAMAccountName === managerCN
      );
      
      if (manager) {
        await updateSupervisorRelationship(user, manager);
      }
    }
  }
}
```

## Security Considerations

### 1. Connection Security

**Use LDAPS (LDAP over SSL/TLS)**:
```env
# Secure connection
AD_URL=ldaps://dc.company.local:636
AD_TLS_REJECT_UNAUTHORIZED=true  # Verify certificates
```

**Certificate Installation**:
```bash
# Export AD certificate
openssl s_client -connect dc.company.local:636 -showcerts </dev/null 2>/dev/null | \
  openssl x509 -outform PEM > ad-cert.pem

# Add to Node.js
export NODE_EXTRA_CA_CERTS=/path/to/ad-cert.pem
```

### 2. Service Account Security

- Use a dedicated service account with minimal permissions
- Enable "Password never expires" to prevent sync failures
- Use strong, complex passwords
- Store credentials in environment variables, never in code
- Consider using managed identities in cloud environments

### 3. Rate Limiting

Implement rate limiting for AD operations:
```typescript
class ADRateLimiter {
  private lastSync: Date | null = null;
  private syncCount = 0;
  private readonly maxSyncsPerHour = 10;
  
  canSync(): boolean {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    
    if (this.lastSync && this.lastSync > hourAgo) {
      return this.syncCount < this.maxSyncsPerHour;
    }
    
    this.syncCount = 0;
    return true;
  }
}
```

### 4. Audit Logging

Log all AD operations:
```typescript
await prisma.auditLog.create({
  data: {
    userId: performingUserId,
    action: 'AD_SYNC',
    entityType: 'SYSTEM',
    details: JSON.stringify({
      usersCreated: created,
      usersUpdated: updated,
      usersDeactivated: deactivated,
      duration: syncDuration,
      errors: errors
    }),
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  }
});
```

### 5. Data Protection

- Encrypt sensitive data in transit (use LDAPS)
- Don't store AD passwords locally
- Sanitize user input before LDAP queries
- Implement query timeouts to prevent DoS

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Failures

**Error**: `ECONNREFUSED` or `ETIMEDOUT`

**Solutions**:
```bash
# Test connectivity
telnet dc.company.local 389

# Test LDAPS
openssl s_client -connect dc.company.local:636

# Check DNS resolution
nslookup dc.company.local

# Verify firewall rules
# Ports needed: 389 (LDAP), 636 (LDAPS), 3268 (GC), 3269 (GC SSL)
```

#### 2. Authentication Failures

**Error**: `Invalid Credentials (49)`

**LDAP Error Codes**:
- `49` - Invalid credentials
- `525` - User not found
- `52e` - Invalid credentials
- `530` - Not permitted to logon at this time
- `531` - Not permitted to logon at this workstation
- `532` - Password expired
- `533` - Account disabled
- `701` - Account expired
- `773` - User must reset password
- `775` - User account locked

**Solutions**:
```powershell
# Check account status
Get-ADUser svc_performance -Properties LockedOut,Enabled,PasswordExpired

# Unlock account
Unlock-ADAccount -Identity svc_performance

# Reset password
Set-ADAccountPassword -Identity svc_performance -Reset
```

#### 3. Search Issues

**Error**: No users returned from search

**Debug Steps**:
```typescript
// Enable detailed logging
const client = ldap.createClient({
  url: config.url,
  log: {
    name: 'ldapjs',
    stream: process.stdout,
    level: 'trace'
  }
});

// Test with simple filter
const testFilter = '(objectClass=user)';

// Verify Base DN
const testBaseDN = 'DC=company,DC=local';
```

**PowerShell verification**:
```powershell
# Test LDAP query
Get-ADUser -Filter * -SearchBase "DC=company,DC=local" | Select -First 5

# Check service account permissions
Get-ACL "AD:DC=company,DC=local" | FL
```

#### 4. SSL/TLS Certificate Issues

**Error**: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**Solutions**:

1. **Import CA Certificate**:
```bash
# Get certificate chain
echo | openssl s_client -connect dc.company.local:636 -showcerts

# Install in system trust store (Ubuntu/Debian)
sudo cp ad-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

# Install in system trust store (RHEL/CentOS)
sudo cp ad-ca.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust
```

2. **Node.js specific**:
```javascript
// Option 1: Environment variable
process.env.NODE_EXTRA_CA_CERTS = '/path/to/ca-cert.pem';

// Option 2: In code (development only)
const tlsOptions = {
  ca: fs.readFileSync('/path/to/ca-cert.pem'),
  rejectUnauthorized: true
};
```

#### 5. Performance Issues

**Problem**: Sync takes too long

**Optimizations**:

1. **Paginated Search**:
```typescript
const searchOptions = {
  scope: 'sub',
  filter: filter,
  paged: {
    pageSize: 100,
    pagePause: true
  }
};
```

2. **Selective Attribute Retrieval**:
```typescript
// Only request needed attributes
attributes: ['sAMAccountName', 'mail', 'givenName', 'sn']
```

3. **Parallel Processing**:
```typescript
// Process users in batches
const batchSize = 50;
const promises = [];

for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);
  promises.push(processBatch(batch));
}

await Promise.all(promises);
```

### Diagnostic Tools

#### LDAP Browser Tools
- **Apache Directory Studio** (Cross-platform)
- **LDAP Admin** (Windows)
- **JXplorer** (Cross-platform)

#### Command Line Tools

```bash
# ldapsearch (Linux/Mac)
ldapsearch -x -H ldap://dc.company.local:389 \
  -D "svc_performance@company.local" \
  -W -b "DC=company,DC=local" \
  "(sAMAccountName=johndoe)"

# ldp.exe (Windows)
# GUI tool for LDAP operations

# PowerShell AD Module
Get-ADUser -Filter * -Properties * | Export-CSV users.csv
```

#### Network Diagnostics

```bash
# Test port connectivity
nc -zv dc.company.local 389
nc -zv dc.company.local 636

# Trace route
traceroute dc.company.local

# DNS lookup
dig dc.company.local
dig _ldap._tcp.company.local SRV
```

## API Reference

### Endpoints

#### GET /api/admin/sync-ad
Check AD configuration and sync status.

**Response**:
```json
{
  "configured": true,
  "enabled": true,
  "domain": "company.local",
  "url": "ldap://dc.company.local:389",
  "baseDN": "DC=company,DC=local",
  "totalUsers": 250,
  "activeUsers": 245,
  "lastSync": "2024-03-15T10:30:00Z"
}
```

#### POST /api/admin/sync-ad
Trigger AD user synchronization.

**Response**:
```json
{
  "success": true,
  "message": "Active Directory sync completed",
  "created": 5,
  "updated": 120,
  "deactivated": 3,
  "errors": []
}
```

### TypeScript Interfaces

```typescript
interface ADConfig {
  enabled: boolean;
  domain: string;
  url: string;
  baseDN: string;
  username?: string;
  password?: string;
  tlsOptions?: {
    rejectUnauthorized: boolean;
    ca?: string;
  };
  searchFilter?: string;
  searchAttributes?: string[];
}

interface ADUser {
  dn: string;
  sAMAccountName: string;
  mail: string;
  givenName: string;
  sn: string;
  displayName: string;
  employeeID?: string;
  department?: string;
  title?: string;
  manager?: string;
  memberOf?: string[];
  userAccountControl: number;
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deactivated: number;
  errors: string[];
  duration: number;
}
```

## Best Practices

### 1. Sync Scheduling
- Schedule syncs during off-peak hours
- Implement incremental syncs for large directories
- Use webhook/event-based syncs when possible

### 2. Error Handling
- Implement retry logic with exponential backoff
- Log all errors with context
- Alert administrators on sync failures
- Maintain sync history for audit purposes

### 3. Data Validation
- Validate email formats before storing
- Check for duplicate entries
- Sanitize all input data
- Handle special characters in DNs properly

### 4. Performance
- Cache LDAP connections
- Use connection pooling
- Implement query result caching
- Monitor sync duration and optimize queries

### 5. Security
- Regular security audits
- Rotate service account passwords
- Monitor for unusual sync patterns
- Implement IP whitelisting for AD servers

## Migration Guide

### From Local Users to AD

1. **Backup existing data**:
```bash
npx prisma db execute --file backup.sql
```

2. **Map existing users to AD accounts**:
```sql
UPDATE User 
SET externalId = 'ad_username', 
    authProvider = 'ACTIVE_DIRECTORY'
WHERE email = 'user@company.com';
```

3. **Run initial sync**:
```bash
curl -X POST http://localhost:3000/api/admin/sync-ad \
  -H "Authorization: Bearer $TOKEN"
```

4. **Verify mappings**:
```sql
SELECT email, externalId, authProvider 
FROM User 
WHERE authProvider = 'ACTIVE_DIRECTORY';
```

## Support and Resources

### Microsoft Documentation
- [Active Directory Schema](https://docs.microsoft.com/en-us/windows/win32/adschema/active-directory-schema)
- [LDAP Error Codes](https://docs.microsoft.com/en-us/windows/win32/debug/system-error-codes)
- [UserAccountControl Flags](https://docs.microsoft.com/en-us/troubleshoot/windows-server/identity/useraccountcontrol-manipulate-account-properties)

### LDAP Resources
- [LDAP RFC 4511](https://tools.ietf.org/html/rfc4511)
- [Understanding LDAP](https://ldap.com/)
- [LDAP Query Basics](https://theitbros.com/ldap-query-examples-active-directory/)

### Troubleshooting Tools
- [Wireshark](https://www.wireshark.org/) - Network protocol analyzer
- [Apache Directory Studio](https://directory.apache.org/studio/) - LDAP browser
- [ldp.exe](https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/cc771022(v=ws.11)) - Windows LDAP client