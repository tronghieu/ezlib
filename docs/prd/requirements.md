# Requirements

## Functional

1. **FR1:** The system shall allow library staff to add books to their collection with title, author, and availability status (available/checked out)
2. **FR2:** The system shall allow library staff to create and manage member profiles with name and contact information
3. **FR3:** The system shall enable library staff to check out books to members with a single click action
4. **FR4:** The system shall enable library staff to check in returned books and update availability status
5. **FR5:** The system shall provide readers with a browsable list of available books at participating libraries
6. **FR6:** The system shall allow readers to request to borrow available books through the digital interface
7. **FR7:** The system shall notify library staff of reader borrowing requests for approval/decline
8. **FR8:** The system shall maintain real-time availability status for all books in the collection
9. **FR9:** The system shall provide basic member lookup functionality for library staff during checkout
10. **FR10:** The system shall allow library staff to view simple reports of checked out books and member activity
11. **FR11:** The system shall provide passwordless email authentication using 6-digit OTP codes
12. **FR12:** The system shall restrict new user registration to the Reader app only (`ezlib.com`)
13. **FR13:** The system shall require independent login sessions on Reader and Library Management apps
14. **FR14:** The system shall automatically grant reader access to all authenticated users
15. **FR15:** The system shall grant library management access only to users with LibAdmin records
16. **FR16:** The system shall collect user preferences (display name, gender, language, region) during registration
17. **FR17:** The system shall display interface content in the user's preferred language based on their country selection
18. **FR18:** The system shall automatically detect and default to the user's geographic location during registration
19. **FR19:** The system shall allow users to manually change their country/language preferences at any time
20. **FR20:** The system shall localize date formats, number formats, and cultural conventions based on user's country selection
21. **FR21:** The system shall allow library staff with appropriate permissions to invite new staff members via email
22. **FR22:** The system shall support role-based invitations (owner, manager, librarian, volunteer) with configurable permissions
23. **FR23:** The system shall generate secure, unique invitation tokens that expire after 7 days
24. **FR24:** The system shall allow library staff to invite new library members via email invitation
25. **FR25:** The system shall validate that invitation recipients' email matches their registered account during acceptance
26. **FR26:** The system shall automatically create appropriate staff or member records upon invitation acceptance
27. **FR27:** The system shall allow invitations to be cancelled by the inviter or library managers before acceptance
28. **FR28:** The system shall maintain an audit trail of all invitation responses (accepted, declined, expired)
29. **FR29:** The system shall prevent duplicate pending invitations for the same email and library
30. **FR30:** The system shall automatically expire invitations that have passed their expiry date
31. **FR31:** The system shall track and display the number of available copies for each book (e.g., "4 of 6 copies available")
32. **FR32:** The system shall automatically update available copy counts when books are checked out or returned
33. **FR33:** The system shall allow library staff to manage multiple copies of the same book edition with individual tracking
34. **FR34:** The system shall prevent checkout when no copies are available and display appropriate messaging

## Non Functional

1. **NFR1:** The system shall load pages in under 3 seconds on standard broadband connections
2. **NFR2:** The system shall be accessible via modern web browsers (Chrome 90+, Firefox 85+, Safari 14+, Edge 90+)
3. **NFR3:** The system shall maintain 99.5% uptime during business hours (9 AM - 9 PM local time)
4. **NFR4:** The system shall protect library patron data according to library confidentiality standards
5. **NFR5:** The user interface shall be intuitive enough for volunteers with basic computer literacy to use without extensive training
6. **NFR6:** The system shall handle up to 5,000 books and 1,000 active members per library without performance degradation
7. **NFR7:** The system shall work on both desktop and mobile devices with responsive design
8. **NFR8:** The system shall provide data backup and recovery capabilities to prevent loss of library records
9. **NFR9:** The system shall support at least English and Spanish languages initially, with architecture for additional languages
10. **NFR10:** The system shall maintain consistent user experience across all supported languages without compromising functionality
