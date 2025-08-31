# Supabase Seeds

This project now uses **Snaplet Seed** for database seeding instead of SQL files.

## Usage

```bash
# Sync database schema with Snaplet
pnpm run seed:sync

# Run the seed script
pnpm run seed
```

## Test Credentials

All users have the password: `password123`

- **Demo User**: `demo@ezlib.com`
- **Library Staff**: `sarah.chen@nycentral.org`
- **Library Staff**: `mike.torres@nycentral.org`  
- **Library Staff**: `anna.kowalski@nycentral.org`

## Legacy SQL Seeds

Old SQL seed files have been moved to `seeds/archive/` for reference but are no longer used.