# Settings Page Fix - Database Migration Required

## Issue
The Settings page is showing a 400 Bad Request error when trying to fetch user profile data with notification preferences.

**Error:**
```
GET https://llwtmvpcrnjxmruxzzgb.supabase.co/rest/v1/profiles?select=full_name%2Cbirth_date%2Cemail_notifications%2Cwhatsapp_notifications&id=eq.20fc1325-0a90-42b4-bbba-2f25b623aec7 400 (Bad Request)
```

## Root Cause
The `email_notifications` and `whatsapp_notifications` columns may not exist in the `profiles` table in your Supabase database, even though the migration file exists.

## Solution

### Step 1: Apply the Migration in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Create a new query
5. Copy the contents of `supabase/migrations/20241209_ensure_notification_columns.sql`
6. Paste it into the SQL Editor
7. Click **Run**

### Step 2: Verify the Columns Exist

After running the migration, verify the columns were created:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email_notifications', 'whatsapp_notifications');
```

You should see two rows with:
- `email_notifications` - BOOLEAN - true
- `whatsapp_notifications` - BOOLEAN - true

### Step 3: Test the Settings Page

1. Refresh your browser
2. Navigate to the Settings page
3. The profile data should now load without errors
4. You should be able to toggle notification preferences

## Code Changes Made

The Settings page (`src/pages/Settings.tsx`) has been updated with:

1. **Error handling** - If the notification columns don't exist, it falls back to fetching just the basic profile data
2. **Better error logging** - Console errors are logged for debugging
3. **Graceful degradation** - The page will still work even if the notification columns are missing

## If You Still See Errors

If you continue to see errors after applying the migration:

1. Check the browser console for detailed error messages
2. Verify that the RLS policies allow your user to read the profiles table
3. Ensure your user is authenticated
4. Check that the columns were actually created by running the verification query above

## Migration File Location

- **File:** `supabase/migrations/20241209_ensure_notification_columns.sql`
- **Purpose:** Ensures notification preference columns exist and RLS policies are correct
- **Status:** Ready to apply

## Next Steps

After applying this migration:
1. Test the Settings page functionality
2. Commit and push the changes
3. The notification preferences should now persist correctly
