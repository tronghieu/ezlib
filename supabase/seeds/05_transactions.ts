/**
 * Transaction Seeding - Creates borrowing transactions and events
 * Includes current checkouts and historical transaction data
 */
import { createSeedClient } from "@snaplet/seed";
import { faker } from "@snaplet/copycat";

export const seedTransactions = async (
  createdLibraries: any[],
  createdBookCopies: any[],
  createdLibraryMembers: any[],
  createdLibraryStaff: any[]
) => {
  console.log("📋 Creating borrowing transactions...");
  const seed = await createSeedClient();
  
  // Create transaction history for checked out books
  const checkedOutCopies = createdBookCopies.filter(c => c.availability.status === 'borrowed');
  
  for (const copy of checkedOutCopies) {
    const member = createdLibraryMembers.find(m => m.id === copy.availability.current_borrower_id);
    if (!member) continue;
    
    const staff = createdLibraryStaff.find(s => s.library_id === copy.library_id);
    const checkoutDate = faker.date.recent({ days: 20 });
    const dueDate = new Date(checkoutDate);
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Current checkout transaction
    const transactionResult = await seed.borrowing_transactions([{
      library_id: copy.library_id,
      book_copy_id: copy.id,
      member_id: member.id,
      staff_id: staff?.id || null,
      transaction_type: 'checkout',
      status: 'active',
      transaction_date: checkoutDate.toISOString(),
      due_date: dueDate.toISOString(),
      return_date: null,
      fees: {
        late_fee: 0,
        damage_fee: 0,
        processing_fee: 0,
        total: 0,
      },
      notes: null,
    }]);

    // Create checkout event
    await seed.transaction_events([{
      transaction_id: transactionResult.borrowing_transactions[0].id,
      event_type: 'checkout',
      staff_id: staff?.id || null,
      member_id: member.id,
      event_data: {
        due_date: dueDate.toISOString(),
        checkout_method: faker.helpers.arrayElement(['counter', 'self_service', 'mobile_app']),
      },
      timestamp: checkoutDate.toISOString(),
      notes: 'Book checked out successfully',
    }]);
  }
  
  // Create historical transactions (returned books)
  for (const library of createdLibraries) {
    const libraryMembers = createdLibraryMembers.filter(m => m.library_id === library.id);
    const libraryCopies = createdBookCopies.filter(c => c.library_id === library.id);
    const libraryStaff = createdLibraryStaff.filter(s => s.library_id === library.id);
    
    // Generate 20-50 historical transactions per library
    const transactionCount = faker.number.int({ min: 20, max: 50 });
    
    for (let i = 0; i < transactionCount; i++) {
      if (libraryMembers.length === 0 || libraryCopies.length === 0 || libraryStaff.length === 0) {
        console.warn(`Skipping transactions for ${library.name} - insufficient data (members: ${libraryMembers.length}, copies: ${libraryCopies.length}, staff: ${libraryStaff.length})`);
        break;
      }
      
      const member = faker.helpers.arrayElement(libraryMembers);
      const copy = faker.helpers.arrayElement(libraryCopies);
      const staff = faker.helpers.arrayElement(libraryStaff);
      
      const checkoutDate = faker.date.past({ years: 1 });
      const dueDate = new Date(checkoutDate);
      dueDate.setDate(dueDate.getDate() + 14);
      
      const returnDate = faker.date.between({ from: checkoutDate, to: new Date() });
      const isLate = returnDate > dueDate;
      const daysLate = isLate ? Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const lateFee = daysLate * 0.25;
      
      // Checkout transaction
      const checkoutResult = await seed.borrowing_transactions([{
        library_id: library.id,
        book_copy_id: copy.id,
        member_id: member.id,
        staff_id: staff?.id || null,
        transaction_type: 'checkout',
        status: 'returned',
        transaction_date: checkoutDate.toISOString(),
        due_date: dueDate.toISOString(),
        return_date: returnDate.toISOString(),
        fees: {
          late_fee: lateFee,
          damage_fee: 0,
          processing_fee: 0,
          total: lateFee,
        },
        notes: isLate ? `Returned ${daysLate} days late` : null,
      }]);

      // Create checkout event
      await seed.transaction_events([{
        transaction_id: checkoutResult.borrowing_transactions[0].id,
        event_type: 'checkout',
        staff_id: staff?.id || null,
        member_id: member.id,
        event_data: {
          due_date: dueDate.toISOString(),
          checkout_method: faker.helpers.arrayElement(['counter', 'self_service']),
        },
        timestamp: checkoutDate.toISOString(),
        notes: 'Book checked out successfully',
      }]);

      // Create return event
      await seed.transaction_events([{
        transaction_id: checkoutResult.borrowing_transactions[0].id,
        event_type: 'return',
        staff_id: staff?.id || null,
        member_id: member.id,
        event_data: {
          return_date: returnDate.toISOString(),
          condition_on_return: faker.helpers.arrayElement(['good', 'good', 'fair']),
          late_fee_assessed: lateFee,
        },
        timestamp: returnDate.toISOString(),
        notes: isLate ? `Late return - ${daysLate} days overdue` : 'On-time return',
      }]);

      // Sometimes add fee payment events
      if (lateFee > 0 && faker.datatype.boolean({ probability: 0.8 })) {
        const paymentDate = faker.date.between({ from: returnDate, to: new Date() });
        
        await seed.transaction_events([{
          transaction_id: checkoutResult.borrowing_transactions[0].id,
          event_type: 'fee_paid',
          staff_id: staff?.id || null,
          member_id: member.id,
          event_data: {
            payment_amount: lateFee,
            payment_method: faker.helpers.arrayElement(['cash', 'card', 'online']),
          },
          timestamp: paymentDate.toISOString(),
          notes: `Late fee payment: $${lateFee.toFixed(2)}`,
        }]);
      }
      
      // Sometimes add renewal transactions
      if (faker.datatype.boolean({ probability: 0.3 })) {
        const renewalDate = faker.date.between({ from: checkoutDate, to: dueDate });
        const newDueDate = new Date(renewalDate);
        newDueDate.setDate(newDueDate.getDate() + 14);
        
        const renewalResult = await seed.borrowing_transactions([{
          library_id: library.id,
          book_copy_id: copy.id,
          member_id: member.id,
          staff_id: staff?.id || null,
          transaction_type: 'renewal',
          status: 'active',
          transaction_date: renewalDate.toISOString(),
          due_date: newDueDate.toISOString(),
          return_date: null,
          fees: {
            late_fee: 0,
            damage_fee: 0,
            processing_fee: 0,
            total: 0,
          },
          notes: 'First renewal',
        }]);

        // Create renewal event
        await seed.transaction_events([{
          transaction_id: renewalResult.borrowing_transactions[0].id,
          event_type: 'renewal',
          staff_id: staff?.id || null,
          member_id: member.id,
          event_data: {
            new_due_date: newDueDate.toISOString(),
            renewal_count: 1,
          },
          timestamp: renewalDate.toISOString(),
          notes: 'Book renewed successfully',
        }]);
      }
    }
  }
  
  console.log(`✓ Created borrowing transactions and events`);
};