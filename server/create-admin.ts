import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      email: 'admin@myjantes.fr',
      password: hashedPassword,
      name: 'Administrateur',
      phone: '+33123456789',
      role: 'admin'
    };
    
    console.log('Creating admin user...');
    const result = await db.insert(users).values(adminUser).onConflictDoNothing().returning();
    
    if (result.length > 0) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@myjantes.fr');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: admin');
    } else {
      console.log('ℹ️  Admin user already exists.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();