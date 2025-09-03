/**
 * User Seeding - Creates authenticated users using Supabase Auth API
 * This creates real auth.users that can login, and triggers automatically
 * create user_profiles and user_preferences through database triggers.
 */
import * as dotenv from 'dotenv';
import { join } from 'path';
import { createClient } from "@supabase/supabase-js";
import { copycat, faker } from "@snaplet/copycat";
import type { Database } from "../types/database";

// Load environment variables from the supabase directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Available environment variables:", Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required for user seeding");
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const seedUsers = async () => {
  console.log("👤 Creating authenticated users with Supabase Auth API...");
  
  const password = "Test123!@#"; // Consistent password for all test users
  const createdUsers: any[] = [];
  
  // Define user types and distribution
  const userTypes = [
    { role: 'system_admin', count: 2 },
    { role: 'library_admin', count: 4 },
    { role: 'librarian', count: 6 },
    { role: 'reader', count: 8 }
  ];

  let userCounter = 0;
  
  for (const userType of userTypes) {
    console.log(`Creating ${userType.count} ${userType.role}s...`);
    
    for (let i = 0; i < userType.count; i++) {
      const seed = `${userType.role}-${i}`;
      const email = copycat.email(seed).toLowerCase();
      const firstName = copycat.firstName(seed);
      const lastName = copycat.lastName(seed);
      const fullName = `${firstName} ${lastName}`;
      const displayName = copycat.bool(seed) ? fullName : copycat.username(seed);
      const avatar = faker.image.avatarGitHub();

      try {
        // Create user with Supabase Auth Admin API
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            avatar_url: avatar,
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            display_name: displayName,
            role: userType.role,
            // Additional metadata for richer profiles
            bio: copycat.sentence(seed, { min: 10, max: 100 }),
            location: {
              city: copycat.city(seed),
              country: copycat.country(seed),
              timezone: copycat.timezone(seed)
            },
            social_links: {
              website: copycat.bool(seed) ? copycat.url(seed) : null,
              twitter: copycat.bool(seed) ? `@${copycat.username(seed)}` : null,
              goodreads: null,
              instagram: null
            },
            reading_stats: {
              books_read: copycat.int(seed, { min: 0, max: 500 }),
              reviews_written: copycat.int(seed, { min: 0, max: 50 }),
              favorite_genres: Array.from({ length: copycat.int(seed, { min: 1, max: 4 }) }, (_, genreIndex) => 
                copycat.oneOf(seed + genreIndex, ['fiction', 'non-fiction', 'mystery', 'romance', 'sci-fi', 'fantasy', 'biography', 'history', 'science', 'philosophy'])
              ).filter((genre, index, arr) => arr.indexOf(genre) === index),
              reading_goal_yearly: copycat.bool(seed) ? copycat.int(seed, { min: 12, max: 100 }) : null
            },
            preferences: {
              notifications: {
                email_enabled: copycat.bool(seed, 0.8),
                push_enabled: copycat.bool(seed, 0.6),
                sms_enabled: copycat.bool(seed, 0.3),
                due_date_reminders: copycat.bool(seed, 0.9),
                new_book_alerts: copycat.bool(seed, 0.7),
                social_activity: copycat.bool(seed, 0.5)
              },
              privacy: {
                profile_visibility: copycat.oneOf(seed, ['public', 'friends', 'private'], [0.7, 0.2, 0.1]),
                reading_activity: copycat.oneOf(seed, ['public', 'friends', 'private'], [0.6, 0.3, 0.1]),
                review_visibility: copycat.oneOf(seed, ['public', 'friends', 'private'], [0.8, 0.15, 0.05]),
                location_sharing: copycat.bool(seed, 0.4)
              },
              interface: {
                theme: copycat.oneOf(seed, ['light', 'dark', 'system'], [0.4, 0.3, 0.3]),
                preferred_language: copycat.oneOf(seed, ['en', 'vi', 'zh'], [0.6, 0.25, 0.15]),
                preferred_country: copycat.oneOf(seed, ['US', 'VN', 'CN'], [0.6, 0.25, 0.15]),
                default_view: copycat.oneOf(seed, ['grid', 'list', 'card'], [0.5, 0.3, 0.2]),
                books_per_page: copycat.oneOf(seed, [10, 20, 50, 100], [0.2, 0.5, 0.2, 0.1])
              }
            }
          }
        });

        if (error) {
          console.error(`Failed to create user ${email}:`, error.message);
          continue;
        }

        if (data.user) {
          createdUsers.push({
            id: data.user.id,
            email,
            role: userType.role,
            firstName,
            lastName,
            displayName,
            password // Include password for testing purposes
          });

          userCounter++;
          console.log(`  ✓ Created ${userType.role}: ${email}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Unexpected error creating user ${email}:`, error);
      }
    }
  }
  
  console.log(`✓ Successfully created ${createdUsers.length} authenticated users`);
  console.log(`💡 All users have password: "${password}" for testing`);
  console.log(`🔄 Database triggers automatically created user_profiles and user_preferences`);
  
  return createdUsers;
};