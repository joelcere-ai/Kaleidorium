# Kaleidorium Artwork Bulk Upload Script

This script allows you to bulk upload artwork to your Kaleidorium application, ensuring proper database relationships and compatibility with the existing system.

## Prerequisites

### 1. Fix Database Schema
Before running the bulk upload, you MUST create the ArtworkAnalytics table:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents from `../migrations/20240707_create_artwork_analytics.sql`
4. Execute the SQL

### 2. Environment Variables
Create a `.env` file in the scripts directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Important**: You need the SERVICE ROLE KEY (not the anon key) for admin operations.

### 3. Install Dependencies
```bash
cd scripts
npm install
```

### 4. Storage Bucket
Ensure the `artwork-images` bucket exists in your Supabase Storage. If not, create it manually in the Supabase dashboard.

## Usage

### Step 1: Prepare Your Data

1. **Organize your images**: Put all artwork images in a single directory
2. **Create a CSV file** with the following columns:

```csv
filename,artwork_title,artist,description,price,medium,genre,style,subject,colour,dimensions,year,artwork_link
```

### Step 2: CSV Format Details

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| filename | ✅ | Image filename (must exist in images directory) | `artwork1.jpg` |
| artwork_title | ✅ | Title of the artwork | `"Digital Dreams"` |
| artist | ✅ | Artist name | `"Jane Smith"` |
| description | ❌ | Artwork description | `"A vibrant exploration..."` |
| price | ❌ | Price (use "Not for sale" if not for sale) | `"$5,000"` or `"Not for sale"` |
| medium | ❌ | Medium/technique | `"Digital"`, `"Oil on Canvas"` |
| genre | ❌ | Genre category | `"abstract"`, `"realism"` |
| style | ❌ | Style category | `"Abstract"`, `"Photorealistic"` |
| subject | ❌ | Subject matter | `"landscape"`, `"portrait"` |
| colour | ❌ | Dominant color | `"blue"`, `"red"` |
| dimensions | ❌ | Artwork dimensions | `"1920x1080 pixels"` |
| year | ❌ | Year created | `"2024"` |
| artwork_link | ❌ | Artist's website/gallery link | `"https://artist.com/work"` |

### Step 3: Run the Upload

```bash
node bulk-upload-artwork.js /path/to/your/artwork-data.csv /path/to/your/images/directory
```

**Example:**
```bash
node bulk-upload-artwork.js ./my-artwork.csv ./images/
```

## Features

- **Batch Processing**: Uploads 5 artworks at a time to avoid overwhelming the API
- **Error Handling**: Continues processing even if individual uploads fail
- **Progress Tracking**: Shows detailed progress for each artwork
- **Relationship Management**: Automatically creates ArtworkAnalytics records
- **Duplicate Prevention**: Adds timestamps to filenames to prevent conflicts
- **Comprehensive Logging**: Detailed success/failure reporting

## What the Script Does

For each artwork, the script:

1. ✅ Validates required data (filename, title, artist)
2. ✅ Checks that image file exists
3. ✅ Uploads image to Supabase Storage (`artwork-images` bucket)
4. ✅ Creates record in `Artwork` table
5. ✅ Creates corresponding record in `ArtworkAnalytics` table
6. ✅ Reports success/failure with details

## Output

The script provides:
- Real-time progress updates
- Success/failure status for each artwork
- Final summary with counts
- Detailed error messages for failed uploads

## Example Output

```
Starting bulk artwork upload...
CSV file: ./artwork-data.csv
Images directory: ./images/

Found 300 artworks to upload

Processing batch 1 (5 items)...
[1] Processing: Digital Dreams by Jane Smith
[1] Image uploaded: https://...supabase.co/storage/v1/object/public/artwork-images/...
[1] Artwork record created with ID: 123
[1] Analytics record created
✅ Digital Dreams uploaded successfully

=== UPLOAD SUMMARY ===
Total artworks: 300
Successful: 295
Failed: 5
```

## Troubleshooting

### Common Issues

1. **"relation does not exist" error**: Run the database migration first
2. **"Storage bucket not found"**: Create the `artwork-images` bucket
3. **"Image file not found"**: Check your image paths and filenames
4. **"Permission denied"**: Verify your SERVICE ROLE KEY

### Environment Variables
Make sure you're using the correct Supabase keys:
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (NOT anon key)

## Data Validation

The script ensures:
- All uploaded artwork integrates with existing app features (likes, analytics, recommendations)
- Database relationships are properly maintained
- Images are accessible via public URLs
- Analytics tracking works immediately

## Security Notes

- The script uses the service role key for admin operations
- Keep your `.env` file secure and never commit it to version control
- Images are uploaded to public storage for web accessibility 