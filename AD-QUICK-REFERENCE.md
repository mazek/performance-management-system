# Active Directory Integration - Quick Reference

## 🚀 Quick Setup

1. **Install LDAP dependency** (already done)
   ```bash
   npm install ldapjs @types/ldapjs
   ```

2. **Configure environment variables**
   ```env
   AD_ENABLED=true
   AD_DOMAIN=company.local
   AD_URL=ldap://dc.company.local:389
   AD_BASE_DN=DC=company,DC=local
   AD_USERNAME=serviceaccount
   AD_PASSWORD=password123
   ```

3. **Access admin panel**
   - Login as admin → `/admin/active-directory`

## 🔧 Common Configurations

### Standard LDAP (Port 389)
```env
AD_URL=ldap://dc.company.local:389
```

### LDAP over SSL (Port 636) 
```env
AD_URL=ldaps://dc.company.local:636
AD_TLS_REJECT_UNAUTHORIZED=true
```

### Global Catalog
```env
AD_URL=ldap://dc.company.local:3268
```

## 📋 Required AD Permissions

Service account needs:
- ✅ **Read** permission on users
- ✅ **Read** permission on groups  
- ✅ **List contents** on Base DN

## 🔍 Testing Connectivity

### Command Line Tests
```bash
# Test port
telnet dc.company.local 389

# Test SSL
openssl s_client -connect dc.company.local:636

# LDAP search (Linux/Mac)
ldapsearch -x -H ldap://dc.company.local:389 \
  -D "user@company.local" -W \
  -b "DC=company,DC=local" "(sAMAccountName=*)"
```

### PowerShell Tests
```powershell
# Test AD connectivity
Get-ADUser -Filter * | Select -First 5

# Check service account
Get-ADUser serviceaccount -Properties *

# Test specific user
Get-ADUser johndoe -Properties mail,department,manager
```

## 📊 LDAP Filters

### All enabled users
```ldap
(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))
```

### Users in specific OU
```ldap
(&(objectClass=user)(distinguishedName=*OU=Sales,DC=company,DC=local))
```

### Users with email
```ldap
(&(objectClass=user)(mail=*))
```

### Recent changes (last 7 days)
```ldap
(&(objectClass=user)(whenChanged>=20240301000000.0Z))
```

## 🏷️ Group to Role Mapping

| AD Group | App Role | Description |
|----------|----------|-------------|
| `Domain Admins` | ADMIN | Full system access |
| `Enterprise Admins` | ADMIN | Full system access |
| `HR Team` | HR | User management |
| `Managers` | SUPERVISOR | Team reviews |
| `All Users` | EMPLOYEE | Basic access |

## 🔐 UserAccountControl Flags

| Flag | Value | Description |
|------|-------|-------------|
| `ACCOUNTDISABLE` | 2 | Account disabled |
| `NORMAL_ACCOUNT` | 512 | Normal user |
| `DONT_EXPIRE_PASSWORD` | 65536 | Password never expires |
| `PASSWORD_EXPIRED` | 8388608 | Password expired |

## 🚨 Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `49` | Invalid credentials | Check username/password |
| `525` | User not found | Verify user exists |
| `530` | Logon time restriction | Check allowed logon hours |
| `532` | Password expired | Reset password |
| `533` | Account disabled | Enable account |
| `701` | Account expired | Extend expiration |
| `773` | Must reset password | User must change password |

## 📈 Sync Process Flow

1. **Connect** → Service account binds to AD
2. **Search** → Query for users with filter
3. **Extract** → Parse user attributes
4. **Transform** → Map to app data structure
5. **Load** → Update local database
6. **Relationships** → Sync manager hierarchy

## 🛠️ Troubleshooting Checklist

### Connection Issues
- [ ] Domain controller reachable
- [ ] Correct port (389/636/3268/3269)
- [ ] Firewall allows connection  
- [ ] DNS resolving correctly
- [ ] SSL certificate valid (LDAPS)

### Authentication Issues  
- [ ] Service account exists
- [ ] Service account not disabled
- [ ] Service account not locked
- [ ] Password correct and not expired
- [ ] Sufficient permissions granted

### Search Issues
- [ ] Base DN correct format
- [ ] Search filter valid LDAP syntax
- [ ] Users exist in specified location
- [ ] Service account can read objects
- [ ] Attributes available and readable

### Data Issues
- [ ] Required attributes present (email, name)
- [ ] No duplicate emails/employee IDs
- [ ] Manager relationships valid
- [ ] Groups exist for role mapping

## ⚡ Performance Tips

1. **Use specific search filters** - Don't query all objects
2. **Limit attributes** - Only request needed fields  
3. **Enable paging** - For large directories
4. **Cache connections** - Reuse LDAP connections
5. **Schedule syncs** - Run during off-peak hours
6. **Monitor performance** - Track sync duration

## 🔒 Security Best Practices

1. **Use LDAPS** - Encrypt all connections
2. **Minimal permissions** - Service account least privilege
3. **Regular rotation** - Change service account password
4. **Monitor access** - Log all AD operations
5. **Validate certificates** - Don't ignore SSL warnings
6. **Network security** - Restrict AD access by IP

## 📞 Support Resources

### Log Files
- Application: Check browser console
- Server: Check `npm run dev` output  
- AD: Windows Event Viewer (Directory Service log)

### Useful Tools
- **ldp.exe** - Windows LDAP client
- **Apache Directory Studio** - Cross-platform LDAP browser
- **Wireshark** - Network packet analysis

### Microsoft Docs
- [AD Schema Reference](https://docs.microsoft.com/en-us/windows/win32/adschema/)
- [LDAP Error Codes](https://ldapwiki.com/wiki/Common%20Active%20Directory%20Bind%20Errors)
- [PowerShell AD Module](https://docs.microsoft.com/en-us/powershell/module/activedirectory/)

## 🔄 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/sync-ad` | GET | Check AD status |
| `/api/admin/sync-ad` | POST | Trigger sync |
| `/admin/active-directory` | GET | Admin UI |

## 📱 Admin Panel Features

- ✅ Connection status dashboard
- ✅ Real-time sync progress  
- ✅ User count statistics
- ✅ Last sync timestamp
- ✅ Error reporting
- ✅ Configuration management
- ✅ Test connection button
- ✅ Manual sync trigger