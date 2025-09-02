import ldap from 'ldapjs';
import { prisma } from './prisma';
import { AuthProvider } from '@prisma/client';
import { ADConfig } from './auth-providers';

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

export class ActiveDirectoryService {
  private client: ldap.Client | null = null;
  private config: ADConfig;

  constructor(config: ADConfig) {
    this.config = config;
  }

  // Connect to AD
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = ldap.createClient({
        url: this.config.url,
        tlsOptions: this.config.tlsOptions || { rejectUnauthorized: false },
        timeout: 5000,
        connectTimeout: 10000
      });

      if (this.config.username && this.config.password) {
        const bindDN = `${this.config.username}@${this.config.domain}`;
        
        this.client.bind(bindDN, this.config.password, (err) => {
          if (err) {
            console.error('AD Bind Error:', err);
            reject(err);
          } else {
            console.log('Successfully connected to Active Directory');
            resolve();
          }
        });
      } else {
        resolve(); // Anonymous bind
      }
    });
  }

  // Disconnect from AD
  private disconnect(): void {
    if (this.client) {
      this.client.unbind();
      this.client = null;
    }
  }

  // Search for users in AD
  private async searchUsers(): Promise<ADUser[]> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('Not connected to AD'));
        return;
      }

      const users: ADUser[] = [];
      const searchOptions: ldap.SearchOptions = {
        scope: 'sub',
        filter: this.config.searchFilter || '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
        attributes: this.config.searchAttributes || [
          'dn',
          'sAMAccountName',
          'mail',
          'givenName',
          'sn',
          'displayName',
          'employeeID',
          'department',
          'title',
          'manager',
          'memberOf',
          'userAccountControl'
        ]
      };

      this.client.search(this.config.baseDN, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          const user: any = {};
          entry.attributes.forEach(attr => {
            if (attr.type === 'memberOf') {
              user[attr.type] = attr.values;
            } else {
              user[attr.type] = attr.values[0];
            }
          });
          users.push(user as ADUser);
        });

        res.on('error', (err) => {
          console.error('Search error:', err);
          reject(err);
        });

        res.on('end', () => {
          console.log(`Found ${users.length} users in Active Directory`);
          resolve(users);
        });
      });
    });
  }

  // Check if user account is enabled
  private isAccountEnabled(userAccountControl: number): boolean {
    // Check if ACCOUNTDISABLE flag (0x2) is not set
    return (userAccountControl & 0x2) === 0;
  }

  // Extract manager ID from DN
  private extractManagerId(managerDN?: string): string | null {
    if (!managerDN) return null;
    
    // Extract CN from manager DN
    const match = managerDN.match(/CN=([^,]+)/i);
    return match ? match[1] : null;
  }

  // Determine role based on AD groups
  private determineRole(memberOf?: string[]): string {
    if (!memberOf) return 'EMPLOYEE';
    
    const groups = memberOf.join(',').toLowerCase();
    
    if (groups.includes('cn=hr') || groups.includes('human resources')) {
      return 'HR';
    }
    if (groups.includes('cn=managers') || groups.includes('cn=supervisors')) {
      return 'SUPERVISOR';
    }
    if (groups.includes('cn=admins') || groups.includes('cn=administrators')) {
      return 'ADMIN';
    }
    
    return 'EMPLOYEE';
  }

  // Sync all users from AD to database
  async syncUsers(): Promise<{
    created: number;
    updated: number;
    deactivated: number;
    errors: string[];
  }> {
    const result = {
      created: 0,
      updated: 0,
      deactivated: 0,
      errors: [] as string[]
    };

    try {
      await this.connect();
      const adUsers = await this.searchUsers();
      
      // Get all existing AD users from database
      const existingUsers = await prisma.user.findMany({
        where: { authProvider: AuthProvider.ACTIVE_DIRECTORY }
      });
      
      const existingUserMap = new Map(
        existingUsers.map(u => [u.externalId, u])
      );
      const processedUserIds = new Set<string>();

      // Process each AD user
      for (const adUser of adUsers) {
        try {
          const email = adUser.mail?.toLowerCase();
          const sAMAccountName = adUser.sAMAccountName;
          
          if (!email || !sAMAccountName) {
            result.errors.push(`Skipping user ${adUser.displayName}: Missing email or username`);
            continue;
          }

          const isEnabled = this.isAccountEnabled(adUser.userAccountControl);
          const role = this.determineRole(adUser.memberOf);
          
          const userData = {
            email,
            firstName: adUser.givenName || adUser.displayName?.split(' ')[0] || 'Unknown',
            lastName: adUser.sn || adUser.displayName?.split(' ').slice(1).join(' ') || 'User',
            employeeId: adUser.employeeID || sAMAccountName,
            department: adUser.department,
            position: adUser.title,
            role,
            authProvider: AuthProvider.ACTIVE_DIRECTORY,
            externalId: sAMAccountName,
            isActive: isEnabled
          };

          const existingUser = existingUserMap.get(sAMAccountName);
          
          if (existingUser) {
            // Update existing user
            await prisma.user.update({
              where: { id: existingUser.id },
              data: userData
            });
            result.updated++;
            processedUserIds.add(existingUser.id);
          } else {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                ...userData,
                password: null // No password for AD users
              }
            });
            result.created++;
            processedUserIds.add(newUser.id);
          }
        } catch (error) {
          result.errors.push(`Error processing user ${adUser.displayName}: ${error}`);
        }
      }

      // Deactivate users that exist in DB but not in AD
      for (const existingUser of existingUsers) {
        if (!processedUserIds.has(existingUser.id)) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { isActive: false }
          });
          result.deactivated++;
        }
      }

      // Now handle manager relationships in a second pass
      await this.syncManagerRelationships(adUsers);

    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.disconnect();
    }

    return result;
  }

  // Sync manager relationships
  private async syncManagerRelationships(adUsers: ADUser[]): Promise<void> {
    for (const adUser of adUsers) {
      if (adUser.manager) {
        try {
          const managerCN = this.extractManagerId(adUser.manager);
          if (managerCN) {
            // Find manager in AD users
            const managerADUser = adUsers.find(u => 
              u.displayName === managerCN || 
              u.sAMAccountName === managerCN
            );
            
            if (managerADUser) {
              // Update supervisor relationship
              await prisma.user.updateMany({
                where: { 
                  externalId: adUser.sAMAccountName,
                  authProvider: AuthProvider.ACTIVE_DIRECTORY
                },
                data: {
                  supervisorId: await this.getUserIdByExternalId(managerADUser.sAMAccountName)
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error setting manager for ${adUser.displayName}:`, error);
        }
      }
    }
  }

  // Get user ID by external ID
  private async getUserIdByExternalId(externalId: string): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: {
        externalId,
        authProvider: AuthProvider.ACTIVE_DIRECTORY
      },
      select: { id: true }
    });
    return user?.id || null;
  }

  // Authenticate a user against AD
  async authenticateUser(username: string, password: string): Promise<ADUser | null> {
    return new Promise((resolve) => {
      const client = ldap.createClient({
        url: this.config.url,
        tlsOptions: this.config.tlsOptions || { rejectUnauthorized: false }
      });

      const userDN = `${username}@${this.config.domain}`;
      
      client.bind(userDN, password, (err) => {
        if (err) {
          client.unbind();
          resolve(null);
          return;
        }

        // Search for user details
        const searchOptions: ldap.SearchOptions = {
          scope: 'sub',
          filter: `(sAMAccountName=${username})`,
          attributes: this.config.searchAttributes || [
            'sAMAccountName',
            'mail',
            'givenName',
            'sn',
            'displayName',
            'employeeID',
            'department',
            'title',
            'memberOf'
          ]
        };

        client.search(this.config.baseDN, searchOptions, (err, res) => {
          if (err) {
            client.unbind();
            resolve(null);
            return;
          }

          let userData: ADUser | null = null;

          res.on('searchEntry', (entry) => {
            const user: any = {};
            entry.attributes.forEach(attr => {
              if (attr.type === 'memberOf') {
                user[attr.type] = attr.values;
              } else {
                user[attr.type] = attr.values[0];
              }
            });
            userData = user as ADUser;
          });

          res.on('end', () => {
            client.unbind();
            resolve(userData);
          });

          res.on('error', () => {
            client.unbind();
            resolve(null);
          });
        });
      });
    });
  }
}

// Get AD configuration from environment or database
export async function getADConfig(): Promise<ADConfig | null> {
  // Check environment variables first
  if (process.env.AD_URL && process.env.AD_DOMAIN && process.env.AD_BASE_DN) {
    return {
      enabled: true,
      domain: process.env.AD_DOMAIN,
      url: process.env.AD_URL,
      baseDN: process.env.AD_BASE_DN,
      username: process.env.AD_USERNAME,
      password: process.env.AD_PASSWORD,
      searchFilter: process.env.AD_SEARCH_FILTER,
      searchAttributes: process.env.AD_SEARCH_ATTRIBUTES?.split(',')
    };
  }

  // Otherwise, load from database
  const config = await prisma.systemConfiguration.findFirst({
    where: { key: 'AD_CONFIG' }
  });

  if (config) {
    return JSON.parse(config.value) as ADConfig;
  }

  return null;
}