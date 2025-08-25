# Library Management App - User Workflows

<!-- Powered by BMAD™ Core -->

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-24 | 1.0 | Initial user workflows documentation according to BMad Method | BMad Orchestrator |

## Introduction

This document outlines the key user workflows and use cases for library staff using the Library Management App. Each workflow is designed to be intuitive and efficient, supporting the daily operations of small to medium-sized libraries.

### Workflow Design Principles

- **Efficiency**: Minimize clicks and reduce cognitive load for staff
- **Consistency**: Standardized patterns across all administrative functions  
- **Accessibility**: Mobile-responsive design for tablet-based operations
- **Real-time**: Live updates for collaborative staff environments
- **Error Prevention**: Validation and confirmation for critical operations

## Primary User Roles

### Library Owner
- **Responsibilities**: Full administrative access, staff management, library settings
- **Permissions**: All permissions enabled
- **Typical Tasks**: Setting up library, managing staff, configuring policies

### Library Manager  
- **Responsibilities**: Operational management, member oversight, inventory control
- **Permissions**: Manage books, manage members, view analytics
- **Typical Tasks**: Processing transactions, managing collections, member support

### Librarian
- **Responsibilities**: Day-to-day operations, book handling, member assistance
- **Permissions**: Manage books, basic member operations
- **Typical Tasks**: Check-in/check-out, shelf management, helping patrons

## Core Workflows

### 1. Daily Operations Dashboard

**Goal**: Provide library staff with an at-a-glance view of current operations and pending tasks.

#### Workflow Steps:
1. **Login & Library Selection**
   - Staff member signs in with their EzLib account
   - If managing multiple libraries, select the active library
   - Dashboard loads with real-time operational data

2. **Review Daily Metrics**
   - View pending borrowing requests (requires immediate attention)
   - Check overdue books and members to contact
   - See new member registrations awaiting approval
   - Review books due back today

3. **Priority Task Management**
   - Process urgent borrowing requests (< 24 hours old)
   - Contact members with overdue items
   - Handle any system alerts or notifications

#### Interface Elements:
```
Dashboard Layout:
┌─────────────────────────────────────────────────┐
│ 📊 Today's Overview                             │
│ • 3 Pending Requests | 2 Overdue | 5 Due Today │
│                                                 │
│ 🔔 Priority Tasks                               │
│ • [URGENT] 2 requests > 24hrs                  │  
│ • [ACTION] Contact 2 overdue members           │
│ • [INFO] 3 new member applications             │
│                                                 │
│ 📈 Quick Stats                                  │
│ • 45 Active Loans | 234 Available Books       │
│ • 89% Collection Availability                  │
└─────────────────────────────────────────────────┘
```

### 2. Book Inventory Management

**Goal**: Efficiently add, organize, and maintain the library's book collection.

#### 2A. Adding New Books (ISBN-based)

1. **Start Add Book Process**
   - Navigate to Inventory → Add Books
   - Choose "Add by ISBN" option
   - Scan or type ISBN-13

2. **Automatic Enrichment**
   - System validates ISBN and fetches metadata
   - Preview shows book details (title, author, cover, publication info)
   - Staff can edit any automatically populated fields

3. **Set Physical Details**
   - Specify number of copies
   - Set shelf location (if using location system)
   - Note condition and acquisition cost
   - Generate/assign barcodes if needed

4. **Assign to Collections**
   - Select relevant collections (Fiction, Mystery, New Arrivals, etc.)
   - Set public visibility settings
   - Add staff notes if needed

5. **Confirm Addition**
   - Review all details
   - Confirm addition to inventory
   - System triggers background metadata enrichment

#### 2B. Manual Book Entry (No ISBN)

1. **Choose Manual Entry**
   - Navigate to Inventory → Add Books → Manual Entry
   - Form opens with required fields

2. **Enter Basic Information**
   - Title and subtitle
   - Author name(s) and roles (author, translator, etc.)
   - Publisher and publication year
   - Language and format

3. **Physical and Collection Details**
   - Same process as ISBN-based entry
   - Additional emphasis on complete metadata entry

4. **Create Book Record**
   - System creates new book edition and general book records
   - Links to author records (creates if new)
   - Adds to inventory with specified details

#### Interface Flow:
```
Add Book Workflow:
ISBN Entry → Validation → Metadata Preview → Physical Details → Collections → Confirm
     │              │                                    
     └── Manual Entry → Basic Info → Physical Details → Collections → Confirm
```

### 3. Member Management

**Goal**: Efficiently manage library memberships, registrations, and member support.

#### 3A. New Member Registration

1. **Receive Registration Request**
   - New user registers through reader app
   - Request appears in Members → Pending Registrations
   - System shows user profile and contact information

2. **Review Application**
   - Verify user information and contact details
   - Check for duplicate memberships
   - Review any special requests or notes

3. **Approve Membership**
   - Set membership start date and duration
   - Configure borrowing limits (if different from defaults)
   - Send welcome notification with library card details

4. **Handle Rejection (if needed)**
   - Select rejection reason
   - Add explanation message
   - System notifies user of rejection with next steps

#### 3B. Member Support and Management

1. **Search and Access Member Records**
   - Use search bar (name, email, member ID)
   - Access member profile with full borrowing history
   - View current loans and holds

2. **Common Support Tasks**
   - Extend loan periods or approve renewals
   - Handle lost book reports and fees
   - Update contact information
   - Manage account holds or restrictions

3. **Membership Renewals**
   - View expiring memberships (dashboard alerts)
   - Contact members approaching expiration
   - Process renewal payments and extend memberships

### 4. Borrowing Transaction Workflow

**Goal**: Efficiently process book loans from request through return.

#### 4A. Processing Borrowing Requests

1. **Review Incoming Requests**
   - Requests appear in real-time on dashboard
   - Navigate to Transactions → Pending Requests
   - View request details (book, member, request date)

2. **Validate Request**
   - Confirm book availability
   - Check member status (active, no restrictions)
   - Verify member hasn't exceeded borrowing limits

3. **Approve or Deny Request**
   - **If Approving**:
     - Set due date (default or custom)
     - Add any special instructions for pickup
     - Send approval notification to member
   - **If Denying**:
     - Select reason (book unavailable, member issues, etc.)
     - Add explanation message
     - Send denial notification with alternatives

4. **Prepare for Pickup**
   - Mark book as "reserved" in inventory
   - Print pickup slip with member and book details
   - Place book in designated pickup area

#### 4B. Physical Check-Out Process

1. **Member Arrives for Pickup**
   - Locate approved transaction in system
   - Verify member identity
   - Confirm book condition

2. **Complete Check-Out**
   - Scan book barcode or select from pending list
   - Confirm due date with member
   - Update transaction status to "checked_out"
   - Print receipt if requested

#### 4C. Book Return Process

1. **Member Returns Book**
   - Scan returned book or search by title/member
   - Check book condition and note any damage
   - Process return in system

2. **Handle Return Issues**
   - **Late Returns**: Calculate late fees, add to member account
   - **Damaged Books**: Assess damage, determine replacement cost
   - **Lost Books**: Process lost book fee, remove from inventory

3. **Complete Return**
   - Update transaction status to "returned"
   - Make book available in inventory
   - Process any fees or holds

### 5. Collection Management

**Goal**: Organize books into meaningful collections for better member discovery and library organization.

#### 5A. Creating New Collections

1. **Define Collection**
   - Navigate to Collections → Create New
   - Choose collection type (Genre, Age Group, Special, Featured)
   - Set name, description, and visibility settings

2. **Add Books to Collection**
   - Search existing inventory
   - Select books to include
   - Set display order if needed

3. **Configure Collection Settings**
   - Set public visibility (member-facing catalog)
   - Configure automatic rules if supported
   - Set featured status for homepage display

#### 5B. Managing Existing Collections

1. **Review Collection Performance**
   - View borrowing statistics for collection books
   - Identify popular and underperforming titles
   - Check collection freshness and relevance

2. **Update Collection Contents**
   - Add new acquisitions to relevant collections
   - Remove outdated or withdrawn books
   - Reorder books based on popularity or themes

3. **Seasonal Collection Management**
   - Create temporary collections (Summer Reading, Holiday Books)
   - Schedule collection activation/deactivation
   - Promote collections through reader app integration

### 6. Analytics and Reporting

**Goal**: Provide insights for data-driven library management decisions.

#### 6A. Daily and Weekly Reports

1. **Access Analytics Dashboard**
   - Navigate to Analytics → Overview
   - Select date range and metrics
   - Choose report type (circulation, collection, members)

2. **Review Key Metrics**
   - Book circulation rates and trends
   - Member activity and engagement
   - Collection performance analysis
   - Peak usage times and patterns

3. **Export and Share Reports**
   - Generate PDF or Excel reports
   - Schedule automatic report delivery
   - Share insights with library board or stakeholders

#### 6B. Collection Development Insights

1. **Analyze Collection Gaps**
   - Identify subjects with low book counts
   - Review member request patterns
   - Compare with similar library collections

2. **Purchase Recommendations**
   - View most requested unavailable books
   - See trending titles in network libraries
   - Analyze budget allocation suggestions

### 7. System Configuration and Settings

**Goal**: Configure library-specific settings and policies for optimal operations.

#### 7A. Library Policy Configuration

1. **Basic Settings**
   - Set default loan periods and renewal limits
   - Configure maximum books per member
   - Set late fee structures and grace periods

2. **Advanced Policies**
   - Configure hold and reservation policies
   - Set up automated overdue notifications
   - Define member tier privileges

#### 7B. Staff Management (Owners Only)

1. **Add New Staff Members**
   - Invite staff via email
   - Assign roles and permissions
   - Set up access to specific library functions

2. **Manage Existing Staff**
   - Review and update permissions
   - Handle staff account issues
   - Monitor staff activity and usage

## Workflow Optimization Features

### Real-Time Updates
- Dashboard refreshes automatically with new requests
- Live inventory updates across all staff terminals
- Instant notifications for urgent situations

### Mobile Responsiveness
- All workflows optimized for tablet use
- Quick actions accessible on mobile devices
- Barcode scanning support on mobile cameras

### Keyboard Shortcuts
- Common actions accessible via hotkeys
- Quick book lookup and member search
- Rapid transaction processing shortcuts

### Batch Operations
- Bulk book processing for new acquisitions
- Mass member communication tools
- Batch collection updates and reorganization

These workflows ensure that library staff can efficiently manage their daily operations while providing excellent service to their members. Each workflow is designed to minimize clicks, reduce errors, and maximize productivity in the library environment.