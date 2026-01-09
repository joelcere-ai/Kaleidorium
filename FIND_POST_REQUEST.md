# How to Find the POST Request in Network Tab

## Step-by-Step Instructions:

1. **Open Developer Tools:**
   - Press `F12` OR
   - Right-click on the page → "Inspect" OR
   - Go to Chrome menu → More Tools → Developer Tools

2. **Go to Network Tab:**
   - Click the "Network" tab at the top of the Developer Tools panel

3. **Clear the Network Log:**
   - Click the circle with a line through it (🚫) to clear existing requests
   - This makes it easier to find the new request

4. **Try Creating an Artist:**
   - Fill out the artist form
   - Click "Create Artist" button

5. **Find the POST Request:**
   - In the Network tab, you'll see a list of requests
   - Look for a request that says:
     - **Name:** `Artists` or `Artists?select=*`
     - **Method:** `POST` (should be in red if it failed)
     - **Status:** `403` or `Forbidden`
   - Click on that request

6. **View the Request Details:**
   - After clicking, you'll see tabs: Headers, Payload, Preview, Response
   - Click the **"Payload"** tab (or "Request" tab)
   - You should see JSON data like:
     ```json
     {
       "username": "Circus Artist",
       "managed_by_gallery_id": "028ea12e-f0aa-4a62-8efc-930477043108",
       "is_gallery": false,
       ...
     }
     ```

7. **Take a Screenshot:**
   - Take a screenshot of the Payload tab
   - This will show us exactly what data is being sent

## Alternative: Check Console for the Error

If you can't find it in Network tab, the Console tab should show the error with details. Look for the error message that shows the exact error code and message.


