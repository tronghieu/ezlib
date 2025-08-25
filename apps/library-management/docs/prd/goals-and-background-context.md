# Goals and Background Context

## Goals
- Enable small/medium libraries (1-3 staff, up to 5K books, 1K members) to replace manual/spreadsheet systems with ultra-simple digital operations
- Deliver immediate operational value through basic book/member tracking before expanding to advanced features
- Demonstrate that simple digital tools can replace paper/spreadsheet tracking systems without overwhelming small library staff
- Provide real-time synchronization with public reader interface (ezlib.com) for seamless book availability updates
- Establish foundation for multi-tenant SaaS platform with passwordless email OTP authentication architecture
- Validate ultra-simple MVP approach (basic checkout/return, no due dates initially) before adding complexity

## Background Context

The EzLib Library Management System addresses a critical gap in the small library market, where 70% of facilities operate without integrated digital management systems. These libraries, typically serving up to 5,000 books and 1,000 active members with just 1-3 staff members, currently rely on manual processes and spreadsheet-based tracking that creates operational inefficiencies and data fragmentation.

This administrative web application (accessible at manage.ezlib.com) serves as the operational backbone for library staff, integrating with the broader EzLib ecosystem including the public reader interface (ezlib.com) and book metadata crawler service. The system follows an "ultra-simple first" philosophy - starting with basic book lists, member tracking, and one-click checkout/return operations before gradually adding complexity like due dates, overdue management, and advanced features.

The authentication strategy requires library staff to first register on the main reader platform (ezlib.com) using passwordless email OTP, then access the management interface through independent login, ensuring clear platform identity while enabling future cross-domain session sharing. By focusing specifically on small library needs rather than enterprise-scale solutions, the system prioritizes immediate operational value and adoption confidence over comprehensive feature sets.

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-08-25 | 2.0 | Major update: Ultra-simple MVP approach, passwordless email OTP authentication, cross-domain access strategy, internationalization support | John (PM) |
| 2024-08-24 | 1.0 | Initial PRD creation from project brief | John (PM) |
