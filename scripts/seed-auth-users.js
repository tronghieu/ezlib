#!/usr/bin/env node

/**
 * Seed Authentication Users Script
 * 
 * This script properly creates users in Supabase Auth using the Admin API
 * instead of direct database inserts, which is the correct approach.
 * 
 * Run with: node scripts/seed-auth-users.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Users to seed
const usersToSeed = [
  // Core users for social features
  {
    id: '400a0780-d043-4b05-8427-9816855365d1',
    email: 'emily.chen@example.com',
    user_metadata: { display_name: 'Emily Chen' },
    email_confirm: true
  },
  {
    id: '400a0780-d043-4b05-8427-9816855365d2', 
    email: 'marcus.rodriguez@example.com',
    user_metadata: { display_name: 'Marcus Rodriguez' },
    email_confirm: true
  },
  {
    id: '400a0780-d043-4b05-8427-9816855365d3',
    email: 'james.wilson@example.com', 
    user_metadata: { display_name: 'James Wilson' },
    email_confirm: true
  },

  // Library staff users  
  {
    id: '500a0780-d043-4b05-8427-9816855365d1',
    email: 'sarah.chen@nycentral.org',
    user_metadata: { display_name: 'Sarah Chen', job_title: 'Head Librarian' },
    email_confirm: true
  },
  {
    id: '500a0780-d043-4b05-8427-9816855365d2',
    email: 'mike.torres@nycentral.org',
    user_metadata: { display_name: 'Miguel Torres', job_title: 'Reference Librarian' },
    email_confirm: true
  },
  {
    id: '500a0780-d043-4b05-8427-9816855365d3',
    email: 'anna.kowalski@nycentral.org',
    user_metadata: { display_name: 'Anna Kowalski', job_title: 'Library Assistant' },
    email_confirm: true
  },
  {
    id: '500a0780-d043-4b05-8427-9816855365d4',
    email: 'david.kim@berkeley.edu',
    user_metadata: { display_name: 'David Kim', job_title: 'Engineering Librarian' },
    email_confirm: true
  },
  {
    id: '500a0780-d043-4b05-8427-9816855365d5',
    email: 'rachel.smith@berkeley.edu',
    user_metadata: { display_name: 'Rachel Smith', job_title: 'Research Librarian' },
    email_confirm: true
  },
  {
    id: '500a0780-d043-4b05-8427-9816855365d6',
    email: 'janet.murphy@greenfieldlibrary.org',
    user_metadata: { display_name: 'Janet Murphy', job_title: 'Library Director' },
    email_confirm: true
  },

  // Library members
  {
    id: '700a0780-d043-4b05-8427-9816855365d1',
    email: 'alice.johnson@example.com',
    user_metadata: { display_name: 'Alice Johnson', preferred_genres: ['mystery', 'biography'] },
    email_confirm: true
  },
  {
    id: '700a0780-d043-4b05-8427-9816855365d2',
    email: 'carlos.rodriguez@example.com',
    user_metadata: { display_name: 'Carlos Rodriguez', preferred_genres: ['science', 'technology'] },
    email_confirm: true
  },
  {
    id: '700a0780-d043-4b05-8427-9816855365d3',
    email: 'priya.patel@example.com',
    user_metadata: { display_name: 'Priya Patel', preferred_genres: ['fiction', 'history'] },
    email_confirm: true
  },
  {
    id: '700a0780-d043-4b05-8427-9816855365d4',
    email: 'james.thompson@example.com',
    user_metadata: { display_name: 'James Thompson', preferred_genres: ['fantasy', 'science fiction'] },
    email_confirm: true
  }
];

async function seedUsers() {
  console.log('🌱 Starting user seeding...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const userData of usersToSeed) {
    try {
      console.log(`\n🔄 Creating user: ${userData.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser(userData);
      
      if (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Successfully created: ${userData.email}`);
        successCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.error(`❌ Unexpected error for ${userData.email}:`, err.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Seeding complete:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${usersToSeed.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some users failed to create. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All users created successfully!');
  }
}

// Run the seeding
seedUsers().catch(console.error);