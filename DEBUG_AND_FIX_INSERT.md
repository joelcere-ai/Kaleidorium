# How to Debug and Fix Gallery Artist Insert Issue

## Step 1: Check What's Being Sent in the Browser

1. Open your browser's Developer Tools (F12 or right-click → Inspect)
2. Go to the **Network** tab
3. Try to create an artist (click "Create Artist")
4. Find the POST request to `/rest/v1/Artists` (it will show 403 Forbidden)
5. Click on that request
6. Go to the **Payload** or **Request** tab
7. Look for the JSON body - it should show something like:
   ```json
   {
     "username": "Circus Artist",
     "firstname": "Circus",
     "surname": "Artist",
     "biog": "test",
     "website": "https://www.cnn.com",
     "managed_by_gallery_id": "028ea12e-f0aa-4a62-8efc-930477043108",
     "is_gallery": false
   }
   ```
8. **Check**: Does `managed_by_gallery_id` match your user ID? (Your user ID is `028ea12e-f0aa-4a62-8efc-930477043108` based on the console)
9. **Check**: Is `is_gallery` set to `false`?

## Step 2: Run the Fix SQL

Run the `FIX_INSERT_FINAL_WORKING.sql` script in Supabase SQL Editor.

## Step 3: If Still Not Working

The policy might need to be even simpler. Try this alternative:

```sql
DROP POLICY IF EXISTS "artists_insert_allow_galleries" ON "public"."Artists";

CREATE POLICY "artists_insert_allow_galleries"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if managed_by_gallery_id is set and matches auth.uid()
  -- This is the primary condition for gallery-created artists
  managed_by_gallery_id = auth.uid()
  OR
  -- Allow if user is inserting their own record
  id = auth.uid()
);
```

This simpler policy prioritizes the `managed_by_gallery_id` check first.

