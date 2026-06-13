import { readDB, writeDB, UserMeta } from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function runMigrations() {
  const db = await readDB();
  
  let dirty = false;

  // Initialize admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existingAdmin = db.users.find(u => u.email === adminEmail);
    if (!existingAdmin) {
      console.log('Migration: Creating admin user...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      
      const admin: UserMeta = {
        id: uuidv4(),
        email: adminEmail,
        passwordHash,
        createdAt: new Date().toISOString()
      };
      
      db.users.push(admin);
      
      // Update orphan files to admin
      for (const file of db.files) {
        if (file.ownerId === 'default-user') {
          file.ownerId = admin.id;
        }
      }

      for (const folder of db.folders) {
        if (folder.ownerId === 'default-user') {
          folder.ownerId = admin.id;
        }
      }
      dirty = true;
    }
  }

  // Handle plain text passwords if they exist (hypothetical, just an example of protecting existing ones)
  for (const user of db.users) {
    if (!user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
       console.log(`Migration: Hashing password for ${user.email}`);
       const salt = await bcrypt.genSalt(10);
       user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
       dirty = true;
    }
  }

  if (dirty) {
    await writeDB(db);
    console.log('Migration completed successfully.');
  }
}
