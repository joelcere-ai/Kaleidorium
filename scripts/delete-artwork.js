const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function deleteArtwork(artworkIds) {
  console.log(`Starting deletion of ${artworkIds.length} artwork(s)...`);
  
  let successCount = 0;
  let failCount = 0;
  const failures = [];

  for (const artworkId of artworkIds) {
    try {
      console.log(`\n[${artworkId}] Processing deletion...`);
      
      // Step 1: Get artwork details before deletion
      const { data: artwork, error: fetchError } = await supabase
        .from('Artwork')
        .select('id, artwork_title, artist, artwork_image')
        .eq('id', artworkId)
        .single();

      if (fetchError || !artwork) {
        console.log(`❌ [${artworkId}] Artwork not found in database`);
        failures.push({ id: artworkId, error: 'Artwork not found' });
        failCount++;
        continue;
      }

      console.log(`[${artworkId}] Found: "${artwork.artwork_title}" by ${artwork.artist}`);

      // Step 2: Delete from ArtworkAnalytics table
      const { error: analyticsError } = await supabase
        .from('ArtworkAnalytics')
        .delete()
        .eq('artwork_id', artworkId);

      if (analyticsError) {
        console.log(`⚠️  [${artworkId}] Failed to delete analytics: ${analyticsError.message}`);
      } else {
        console.log(`✅ [${artworkId}] Analytics record deleted`);
      }

      // Step 3: Delete image from Supabase Storage
      if (artwork.artwork_image) {
        // Extract the file path from the full URL
        const imageUrl = artwork.artwork_image;
        const urlParts = imageUrl.split('/storage/v1/object/public/artwork-images/');
        
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          const { error: storageError } = await supabase.storage
            .from('artwork-images')
            .remove([filePath]);

          if (storageError) {
            console.log(`⚠️  [${artworkId}] Failed to delete image: ${storageError.message}`);
          } else {
            console.log(`✅ [${artworkId}] Image deleted from storage`);
          }
        } else {
          console.log(`⚠️  [${artworkId}] Could not parse image URL for deletion`);
        }
      }

      // Step 4: Delete from Artwork table (main record)
      const { error: artworkError } = await supabase
        .from('Artwork')
        .delete()
        .eq('id', artworkId);

      if (artworkError) {
        console.log(`❌ [${artworkId}] Failed to delete artwork record: ${artworkError.message}`);
        failures.push({ id: artworkId, error: artworkError.message });
        failCount++;
      } else {
        console.log(`✅ [${artworkId}] Artwork record deleted`);
        successCount++;
      }

    } catch (error) {
      console.log(`❌ [${artworkId}] Unexpected error: ${error.message}`);
      failures.push({ id: artworkId, error: error.message });
      failCount++;
    }
  }

  // Summary
  console.log('\n=== DELETION SUMMARY ===');
  console.log(`Total processed: ${artworkIds.length}`);
  console.log(`Successful deletions: ${successCount}`);
  console.log(`Failed deletions: ${failCount}`);

  if (failures.length > 0) {
    console.log('\nFailed deletions:');
    failures.forEach(failure => {
      console.log(`- ID ${failure.id}: ${failure.error}`);
    });
  }

  console.log('\nDeletion process completed!');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: node delete-artwork.js [artwork_ids...]

Examples:
  node delete-artwork.js 50 51 52          # Delete specific artwork IDs
  node delete-artwork.js 178-243           # Delete range of IDs
  node delete-artwork.js 50,51,52          # Delete comma-separated IDs

This script will:
1. Delete analytics records
2. Delete images from Supabase Storage
3. Delete artwork records from database

⚠️  WARNING: This action cannot be undone!
`);
  process.exit(1);
}

// Parse artwork IDs from arguments
let artworkIds = [];

for (const arg of args) {
  if (arg.includes('-')) {
    // Handle range (e.g., "178-243")
    const [start, end] = arg.split('-').map(Number);
    if (isNaN(start) || isNaN(end)) {
      console.error(`Invalid range format: ${arg}`);
      process.exit(1);
    }
    for (let i = start; i <= end; i++) {
      artworkIds.push(i);
    }
  } else if (arg.includes(',')) {
    // Handle comma-separated (e.g., "50,51,52")
    const ids = arg.split(',').map(Number);
    artworkIds.push(...ids);
  } else {
    // Handle single ID
    const id = Number(arg);
    if (isNaN(id)) {
      console.error(`Invalid artwork ID: ${arg}`);
      process.exit(1);
    }
    artworkIds.push(id);
  }
}

// Remove duplicates
artworkIds = [...new Set(artworkIds)];

console.log(`Preparing to delete ${artworkIds.length} artwork(s): ${artworkIds.join(', ')}`);
console.log('\n⚠️  WARNING: This will permanently delete artwork and cannot be undone!');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');

setTimeout(() => {
  deleteArtwork(artworkIds);
}, 5000); 