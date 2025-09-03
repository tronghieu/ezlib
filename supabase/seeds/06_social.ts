/**
 * Social Features Seeding - Creates reviews, follows, and social interactions
 * Includes user-generated content and social relationships
 */
import { createSeedClient } from "@snaplet/seed";
import { faker } from "@snaplet/copycat";

// Helper function to replace faker.helpers.weighted
function weighted<T>(options: Array<{ value: T; weight: number }>): T {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  const random = Math.random() * totalWeight;
  let accumulator = 0;
  
  for (const option of options) {
    accumulator += option.weight;
    if (random < accumulator) {
      return option.value;
    }
  }
  
  return options[options.length - 1].value;
}

export const seedSocialFeatures = async (
  createdUsers: any[],
  createdAuthors: any[],
  createdGeneralBooks: any[],
  createdBookEditions: any[],
  createdLibraryStaff: any[]
) => {
  console.log("⭐🤝 Creating social features...");
  const seed = await createSeedClient();
  const createdReviews: any[] = [];
  
  // Create reviews from readers
  console.log("⭐ Creating reviews...");
  const readers = createdUsers.filter(u => u.role === 'reader');
  
  for (const reader of readers) {
    // Each reader reviews 3-10 books
    const reviewCount = faker.number.int({ min: 3, max: 10 });
    const reviewedEditions = faker.helpers.arrayElements(createdBookEditions, reviewCount);
    
    for (const edition of reviewedEditions) {
      const generalBook = createdGeneralBooks.find(gb => gb.id === edition.general_book_id);
      if (!generalBook) continue;
      
      const rating = weighted([
        { value: 5, weight: 3 },
        { value: 4, weight: 4 },
        { value: 3, weight: 2 },
        { value: 2, weight: 0.5 },
        { value: 1, weight: 0.5 },
      ]);
      
      // Generate more realistic review content based on rating
      let reviewContent;
      if (rating >= 4) {
        reviewContent = faker.helpers.arrayElement([
          "This book exceeded my expectations! The characters were well-developed and the plot kept me engaged throughout.",
          "Absolutely loved this book. The writing style is captivating and the story is both thought-provoking and entertaining.",
          "A fantastic read! I couldn't put it down. Highly recommend to anyone looking for a great book.",
          "Wonderful storytelling and excellent character development. This book really resonated with me.",
        ]);
      } else if (rating === 3) {
        reviewContent = faker.helpers.arrayElement([
          "A decent read, though it had its slow moments. The story was interesting but could have been better paced.",
          "Not bad, but not great either. The concept was good but the execution left something to be desired.",
          "An okay book. Some parts were engaging while others felt a bit tedious. Worth reading if you have time.",
          "Mixed feelings about this one. Good in some ways, but didn't quite live up to the hype.",
        ]);
      } else {
        reviewContent = faker.helpers.arrayElement([
          "Unfortunately, this book wasn't for me. The pacing was slow and I had trouble connecting with the characters.",
          "I wanted to like this book, but it just didn't capture my interest. The plot felt predictable.",
          "Not my favorite. The writing style didn't appeal to me and the story dragged in places.",
          "Had high hopes for this one, but it fell short of expectations. Might work for others though.",
        ]);
      }
      
      const result = await seed.reviews([{
        book_edition_id: edition.id,
        general_book_id: generalBook.id,
        reviewer_id: reader.id,
        content: reviewContent,
        rating: rating,
        language: 'en',
        visibility: weighted([
          { value: 'public', weight: 8 },
          { value: 'followers', weight: 1 },
          { value: 'private', weight: 1 },
        ]),
        social_metrics: {
          like_count: faker.number.int({ min: 0, max: rating * 20 }), // Better books get more likes
          comment_count: faker.number.int({ min: 0, max: 20 }),
          borrow_influence_count: faker.number.int({ min: 0, max: rating * 10 }),
          share_count: faker.number.int({ min: 0, max: 10 }),
        },
      }]);
      createdReviews.push(result.reviews[0]);
    }
  }
  
  console.log(`✓ Created ${createdReviews.length} reviews`);

  // Create author follows
  console.log("✍️ Creating author follows...");
  
  for (const reader of readers) {
    // Each reader follows 2-5 authors
    const followCount = faker.number.int({ min: 2, max: 5 });
    const followedAuthors = faker.helpers.arrayElements(createdAuthors, followCount);
    
    for (const author of followedAuthors) {
      await seed.author_follows([{
        user_id: reader.id,
        author_id: author.id,
        notification_preferences: {
          new_books: faker.datatype.boolean({ probability: 0.8 }),
          news_updates: faker.datatype.boolean({ probability: 0.6 }),
          awards: faker.datatype.boolean({ probability: 0.7 }),
        },
        followed_at: faker.date.past({ years: 1 }).toISOString(),
      }]);
    }
  }
  
  console.log(`✓ Created author follows`);

  // Create social follows (user to user)
  console.log("👥 Creating social follows...");
  
  for (const reader of readers) {
    // Each reader follows 1-5 other readers
    const followCount = faker.number.int({ min: 1, max: 5 });
    const potentialFollows = readers.filter(r => r.id !== reader.id);
    const followedUsers = faker.helpers.arrayElements(potentialFollows, Math.min(followCount, potentialFollows.length));
    
    for (const followedUser of followedUsers) {
      try {
        await seed.social_follows([{
          follower_id: reader.id,
          following_id: followedUser.id,
          followed_at: faker.date.past({ years: 1 }).toISOString(),
        }]);
      } catch (error) {
        // Ignore duplicate follow errors (constraint violations)
        if (!error.message?.includes('duplicate key')) {
          console.warn('Error creating social follow:', error.message);
        }
      }
    }
  }
  
  console.log(`✓ Created social follows`);

  // Create some sample invitations (for testing the invitation system)
  console.log("📧 Creating sample invitations...");
  
  // For seeding, we'll just use the created library staff directly
  // In a real app, we'd query for staff with appropriate permissions
  const staffWithPermissions = createdLibraryStaff.filter(staff => 
    staff.role === 'manager' && staff.status === 'active'
  ).slice(0, 3);

  for (const staff of staffWithPermissions) {
    // Create a few pending invitations for testing
    const invitationTypes = ['library_staff', 'library_member'];
    
    for (const invType of invitationTypes) {
      const fakeEmail = faker.internet.email();
      
      try {
        await seed.invitations([{
          library_id: staff.library_id,
          inviter_id: staff.id,
          email: fakeEmail,
          role: invType === 'library_staff' ? 'librarian' : 'volunteer',
          permissions: invType === 'library_staff' ? {
            manage_inventory: true,
            manage_members: false,
            process_loans: true,
            view_reports: false,
            manage_staff: false,
            admin_settings: false,
          } : {},
          invitation_type: invType,
          status: 'pending',
          expires_at: faker.date.future({ days: 7 }).toISOString(),
          personal_message: `Welcome to our library! We'd love to have you join our ${invType === 'library_staff' ? 'team' : 'community'}.`,
          metadata: {
            invited_by_name: `Library Staff Member`,
            invitation_reason: 'New member recruitment',
          },
        }]);
      } catch (error) {
        // Ignore constraint violations for sample data
        if (!error.message?.includes('duplicate key') && !error.message?.includes('unique constraint')) {
          console.warn('Error creating invitation:', error.message);
        }
      }
    }
  }
  
  console.log(`✓ Created sample invitations for testing`);
  
  console.log(`✅ Social features seeding completed`);

  return { createdReviews };
};