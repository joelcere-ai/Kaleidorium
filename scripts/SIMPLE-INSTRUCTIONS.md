# 🎨 Simple Artwork Upload Guide
*No coding knowledge required!*

## What You Need Before Starting

✅ **Your artwork files ready**: All images in one folder  
✅ **A CSV file**: Like an Excel file but saved as CSV with your artwork details  
✅ **10 minutes**: For the setup process  

---

## Step 1: Fix Your Database First! ⚠️
**This is CRITICAL - do this before anything else:**

1. Go to [your Supabase dashboard](https://supabase.com/dashboard)
2. Click on your project
3. Click "SQL Editor" on the left sidebar
4. Copy the text from the file `MVP2/blockmeister/migrations/20240707_create_artwork_analytics.sql`
5. Paste it in the SQL Editor and click "Run"
6. You should see "Success" - this creates the missing database table

---

## Step 2: Get Your Supabase Information

You need two pieces of information from Supabase:

1. **Project URL**: 
   - Go to Project Settings → API
   - Copy the "Project URL" (looks like: https://abcdefg.supabase.co)

2. **Service Role Key**:
   - In the same page, find "service_role" 
   - Click the eye icon to reveal it
   - Copy this long key (starts with: eyJ...)

**⚠️ Keep these safe - you'll need them in Step 4!**

---

## Step 3: Prepare Your Files

### Put everything in the scripts folder:
1. Navigate to: `MVP2/blockmeister/scripts/`
2. Copy your CSV file here
3. Copy your images folder here

### Your folder should look like this:
```
scripts/
├── your-artwork-data.csv    ← Your CSV file
├── your-images/             ← Your images folder
│   ├── artwork1.jpg
│   ├── artwork2.png
│   └── ...
├── setup.sh
├── upload.sh
└── (other files...)
```

### CSV File Format:
Your CSV must have these columns (in this order):
```
filename,artwork_title,artist,description,price,medium,genre,style,subject,colour,dimensions,year,artwork_link
```

**Example row:**
```
artwork1.jpg,"Digital Dreams","Jane Smith","A beautiful piece","$5,000","Digital","abstract","Abstract","dreams","blue","1920x1080","2024","https://example.com"
```

---

## Step 4: One-Time Setup

Open Terminal (Mac) or Command Prompt (Windows) and navigate to the scripts folder:

```bash
cd "/Users/user/Dropbox/BLOCK MEISTER/MVP2/blockmeister/scripts"
```

Run the setup:
```bash
./setup.sh
```

**What this does:**
- Installs required software packages
- Creates a configuration file called `.env`

**You'll need to edit the .env file:**
1. Open the `.env` file (it's in the scripts folder)
2. Replace `your_supabase_url_here` with your Project URL from Step 2
3. Replace `your_service_role_key_here` with your Service Role Key from Step 2
4. Save the file

---

## Step 5: Upload Your Artwork

In the same Terminal window, run:

```bash
./upload.sh your-artwork-data.csv your-images
```

**Replace with your actual file names:**
- `your-artwork-data.csv` → your actual CSV filename
- `your-images` → your actual images folder name

**Example:**
```bash
./upload.sh my-collection.csv ./artwork-photos
```

---

## What Happens During Upload

The script will:
1. ✅ Check that your files exist
2. ✅ Count how many artworks you have
3. ✅ Ask for confirmation before starting
4. ✅ Upload images to Supabase Storage
5. ✅ Add artwork information to your database
6. ✅ Set up analytics tracking for each piece
7. ✅ Show progress as it works
8. ✅ Give you a final summary

**This takes about 1-2 minutes per 10 artworks.**

---

## Example Output

```
🎨 Kaleidorium Artwork Upload
============================

✅ CSV file found: my-collection.csv
✅ Images folder found: ./artwork-photos
✅ Environment configured

📸 Found 25 image files in the folder
📝 Found 25 entries in CSV file

🚀 Ready to upload 25 artworks

Do you want to continue? (y/N): y

🎨 Starting upload process...

[1] Processing: Digital Dreams by Jane Smith
✅ Digital Dreams uploaded successfully

[2] Processing: Urban Landscape by Mike Chen
✅ Urban Landscape uploaded successfully

...

=== UPLOAD SUMMARY ===
Total artworks: 25
Successful: 25
Failed: 0

🎉 Upload completed successfully!
```

---

## Troubleshooting

### ❌ "Node.js is not installed"
- Install Node.js from https://nodejs.org/
- Choose the LTS version (left button)
- Run the installer, then try again

### ❌ "CSV file not found"
- Make sure your CSV file is in the scripts folder
- Check the spelling of the filename

### ❌ "Images folder not found"
- Make sure your images folder is in the scripts folder
- Check the spelling of the folder name

### ❌ "Environment file has not been configured"
- Edit the `.env` file
- Make sure you replaced both placeholder values with your real Supabase credentials

### ❌ "relation does not exist"
- You skipped Step 1! Go back and run the database migration in Supabase

---

## After Upload

1. Go to your Kaleidorium app
2. Your artwork should appear in the discovery feed
3. All features (likes, analytics, recommendations) will work automatically
4. Check your Supabase dashboard to see the uploaded data

---

## Need Help?

If something goes wrong:
1. Take a screenshot of the error message
2. Check this troubleshooting section
3. Make sure you did Step 1 (database fix) first
4. Make sure your .env file has the correct Supabase credentials

**The most common issue is forgetting Step 1 - the database migration!** 