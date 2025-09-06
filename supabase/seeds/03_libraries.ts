/**
 * Library Management Seeding - Creates libraries, staff, and members
 * Includes realistic library data with proper staff assignments
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

export const seedLibraryManagement = async (createdUsers: any[]) => {
  console.log("🏛️ Creating library management data...");
  const seed = await createSeedClient();
  const createdLibraries: any[] = [];
  const createdLibraryStaff: any[] = [];
  const createdLibraryMembers: any[] = [];
  
  const libraries = [
    {
      name: "Central City Library",
      code: "CCL-MAIN",
      city: "New York",
      state: "NY",
      type: "large",
      loan_period: 21,
      max_books: 10,
    },
    {
      name: "Westside Community Library",
      code: "WCL-001",
      city: "Los Angeles",
      state: "CA",
      type: "medium",
      loan_period: 14,
      max_books: 5,
    },
    {
      name: "University District Library",
      code: "UDL-MAIN",
      city: "Boston",
      state: "MA",
      type: "academic",
      loan_period: 30,
      max_books: 15,
    },
    {
      name: "Riverside Public Library",
      code: "RPL-001",
      city: "Chicago",
      state: "IL",
      type: "medium",
      loan_period: 14,
      max_books: 7,
    },
    {
      name: "Historic Downtown Library",
      code: "HDL-MAIN",
      city: "San Francisco",
      state: "CA",
      type: "large",
      loan_period: 21,
      max_books: 10,
    },
  ];

  // Create libraries
  for (const lib of libraries) {
    const result = await seed.libraries([{
      name: lib.name,
      code: lib.code,
      address: {
        street: faker.location.streetAddress(),
        city: lib.city,
        state: lib.state,
        country: "USA",
        postal_code: faker.location.zipCode(),
        coordinates: {
          lat: parseFloat(faker.location.latitude()),
          lng: parseFloat(faker.location.longitude()),
        },
      },
      contact_info: {
        phone: faker.phone.number(),
        email: faker.internet.email({ provider: 'library.org' }),
        website: `https://www.${lib.code.toLowerCase()}.library.org`,
        hours: {
          monday: "9:00 AM - 8:00 PM",
          tuesday: "9:00 AM - 8:00 PM",
          wednesday: "9:00 AM - 8:00 PM",
          thursday: "9:00 AM - 8:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "10:00 AM - 5:00 PM",
          sunday: "12:00 PM - 5:00 PM",
        },
      },
      settings: {
        loan_period_days: lib.loan_period,
        max_renewals: 2,
        max_books_per_member: lib.max_books,
        late_fee_per_day: 0.25,
        membership_fee: lib.type === 'academic' ? 0 : faker.helpers.arrayElement([0, 25, 50]),
        allow_holds: true,
        allow_digital: lib.type === 'large',
      },
      stats: {
        total_books: 0, // Will be updated when we add book copies
        total_members: 0, // Will be updated when we add members
        active_loans: 0,
        books_loaned_this_month: faker.number.int({ min: 100, max: 1000 }),
      },
      status: 'active',
    }]);
    createdLibraries.push(result.libraries[0]);
  }
  
  console.log(`✓ Created ${createdLibraries.length} libraries`);

  // Create library staff with diverse roles
  console.log("👨‍💼 Creating library staff...");
  
  const owners = createdUsers.filter(u => u.role === 'library_owner');
  const managers = createdUsers.filter(u => u.role === 'library_manager');
  const librarians = createdUsers.filter(u => u.role === 'librarian');
  const volunteers = createdUsers.filter(u => u.role === 'volunteer');
  
  // Combine all potential staff users
  const allStaffUsers = [...owners, ...managers, ...librarians, ...volunteers];
  
  // Distribute staff across libraries with proportional role distribution
  for (let i = 0; i < createdLibraries.length; i++) {
    const library = createdLibraries[i];
    
    // Each library gets 4-6 staff members with diverse roles
    const staffCount = faker.number.int({ min: 4, max: 6 });
    
    // Assign owner first
    if (owners.length > 0) {
      const owner = owners[i % owners.length];
      const result = await seed.library_staff([{
        user_id: owner.id,
        library_id: library.id,
        role: 'owner',
        employment_info: {
          employee_id: `EMP${faker.string.numeric(6)}`,
          department: 'Administration',
          hire_date: faker.date.past({ years: 5 }).toISOString(),
          work_schedule: 'Full-time',
        },
        status: 'active',
      }]);
      createdLibraryStaff.push(result.library_staff[0]);
    }

    // Then assign other staff with proportional distribution
    const remainingStaffCount = staffCount - 1;
    for (let j = 0; j < remainingStaffCount; j++) {
      const role = weighted([
        { value: 'volunteer', weight: 8 },
        { value: 'librarian', weight: 4 },
        { value: 'manager', weight: 2 },
      ]);
      
      let user;
      if (role === 'manager' && managers.length > 0) {
        user = managers[j % managers.length];
      } else if (role === 'librarian' && librarians.length > 0) {
        user = librarians[j % librarians.length];
      } else if (volunteers.length > 0) {
        user = volunteers[j % volunteers.length];
      } else {
        continue; // Skip if no users available for this role
      }
      
      // Department based on role
      let department;
      switch (role) {
        case 'manager':
          department = faker.helpers.arrayElement(['Operations', 'Administration', 'Collections']);
          break;
        case 'librarian':
          department = faker.helpers.arrayElement(['Circulation', 'Reference', 'Youth Services', 'Technical Services']);
          break;
        case 'volunteer':
          department = faker.helpers.arrayElement(['Circulation', 'Youth Services', 'Events']);
          break;
      }
      
      // Work schedule based on role
      const workSchedule = role === 'volunteer' 
        ? faker.helpers.arrayElement(['Part-time', 'Volunteer'])
        : faker.helpers.arrayElement(['Full-time', 'Part-time']);
      
      const result = await seed.library_staff([{
        user_id: user.id,
        library_id: library.id,
        role: role,
        employment_info: {
          employee_id: `EMP${faker.string.numeric(6)}`,
          department: department,
          hire_date: faker.date.past({ years: 3 }).toISOString(),
          work_schedule: workSchedule,
        },
        status: weighted([
          { value: 'active', weight: 9 },
          { value: 'inactive', weight: 1 },
        ]),
      }]);
      createdLibraryStaff.push(result.library_staff[0]);
    }
  }
  
  console.log(`✓ Created ${createdLibraryStaff.length} library staff members`);

  // Create library members
  console.log("👥 Creating library members...");
  
  const readers = createdUsers.filter(u => u.role === 'reader');
  
  for (const reader of readers) {
    // Each reader joins 1-2 libraries
    const libraryCount = weighted([
      { value: 1, weight: 7 },
      { value: 2, weight: 3 },
    ]);
    
    const selectedLibraries = faker.helpers.arrayElements(createdLibraries, libraryCount);
    
    for (const library of selectedLibraries) {
      const membershipType = weighted([
        { value: 'regular', weight: 7 },
        { value: 'student', weight: 2 },
        { value: 'senior', weight: 1 },
      ]);
      
      const result = await seed.library_members([{
        user_id: reader.id,
        library_id: library.id,
        member_id: `M${library.code.substring(0, 3)}${faker.string.numeric(6)}`,
        personal_info: {
          first_name: reader.firstName,
          last_name: reader.lastName,
          email: reader.email,
          phone: faker.phone.number(),
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            postal_code: faker.location.zipCode(),
          },
        },
        membership_info: {
          type: membershipType,
          expiry_date: faker.date.future({ years: 1 }).toISOString(),
          fees_owed: weighted([
            { value: 0, weight: 8 },
            { value: faker.number.float({ min: 0.5, max: 25, fractionDigits: 2 }), weight: 2 },
          ]),
          notes: null,
        },
        borrowing_stats: {
          total_books_borrowed: faker.number.int({ min: 0, max: 100 }),
          current_loans: 0, // Will be updated when we add transactions
          overdue_items: 0,
          total_late_fees: faker.number.float({ min: 0, max: 50, fractionDigits: 2 }),
        },
        status: weighted([
          { value: 'active', weight: 9 },
          { value: 'inactive', weight: 1 },
        ]),
      }]);
      createdLibraryMembers.push(result.library_members[0]);
    }
  }
  
  // Also create some guest members (without user accounts)
  for (const library of createdLibraries) {
    const guestCount = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < guestCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      const result = await seed.library_members([{
        user_id: null, // Guest member
        library_id: library.id,
        member_id: `G${library.code.substring(0, 3)}${faker.string.numeric(6)}`,
        personal_info: {
          first_name: firstName,
          last_name: lastName,
          email: faker.internet.email({ firstName, lastName }),
          phone: faker.phone.number(),
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            postal_code: faker.location.zipCode(),
          },
        },
        membership_info: {
          type: 'regular',
          expiry_date: faker.date.future({ years: 1 }).toISOString(),
          fees_owed: 0,
          notes: 'Guest membership - limited privileges',
        },
        borrowing_stats: {
          total_books_borrowed: faker.number.int({ min: 0, max: 10 }),
          current_loans: 0,
          overdue_items: 0,
          total_late_fees: 0,
        },
        status: 'active',
      }]);
      createdLibraryMembers.push(result.library_members[0]);
    }
  }
  
  console.log(`✓ Created ${createdLibraryMembers.length} library members`);

  return { createdLibraries, createdLibraryStaff, createdLibraryMembers };
};