const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need this for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const ARTWORK_BUCKET = 'artwork-images';
const BATCH_SIZE = 5; // Process 5 artworks at a time to avoid overwhelming the API

/**
 * Bulk upload artwork from a CSV file and local images
 * 
 * CSV Format expected:
 * filename,artwork_title,artist,description,price,medium,genre,style,subject,colour,dimensions,year,artwork_link
 * 
 * @param {string} csvFilePath - Path to the CSV file containing artwork data
 * @param {string} imagesDir - Directory containing the artwork images
 */
async function bulkUploadArtwork(csvFilePath, imagesDir) {
  try {
    console.log('Starting bulk artwork upload...');
    console.log(`CSV file: ${csvFilePath}`);
    console.log(`Images directory: ${imagesDir}`);

    // Read and parse CSV file
    const artworks = await readCSV(csvFilePath);
    console.log(`Found ${artworks.length} artworks to upload`);

    // Process artworks in batches
    const results = {
      successful: [],
      failed: [],
      total: artworks.length
    };

    for (let i = 0; i < artworks.length; i += BATCH_SIZE) {
      const batch = artworks.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)...`);
      
      const batchPromises = batch.map(artwork => processArtwork(artwork, imagesDir, i + batch.indexOf(artwork) + 1));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.successful.push(result.value);
          console.log(`✅ ${batch[index].artwork_title} uploaded successfully`);
        } else {
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          results.failed.push({ artwork: batch[index], error });
          console.log(`❌ ${batch[index].artwork_title} failed: ${error}`);
        }
      });

      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < artworks.length) {
        console.log('Waiting 2 seconds before next batch...');
        await sleep(2000);
      }
    }

    // Print summary
    console.log('\n=== UPLOAD SUMMARY ===');
    console.log(`Total artworks: ${results.total}`);
    console.log(`Successful: ${results.successful.length}`);
    console.log(`Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\nFailed uploads:');
      results.failed.forEach(({ artwork, error }) => {
        console.log(`- ${artwork.artwork_title}: ${error}`);
      });
    }

    return results;

  } catch (error) {
    console.error('Bulk upload failed:', error);
    throw error;
  }
}

/**
 * Process a single artwork: upload image and create database records
 */
async function processArtwork(artworkData, imagesDir, index) {
  try {
    const { filename, ...metadata } = artworkData;
    
    // Validate required fields
    if (!filename || !metadata.artwork_title || !metadata.artist) {
      throw new Error('Missing required fields: filename, artwork_title, and artist are required');
    }

    // Check if image file exists
    const imagePath = path.join(imagesDir, filename);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${filename}`);
    }

    console.log(`[${index}] Processing: ${metadata.artwork_title} by ${metadata.artist}`);

    // Step 1: Upload image to Supabase Storage
    const imageUrl = await uploadImage(imagePath, filename);
    console.log(`[${index}] Image uploaded: ${imageUrl}`);

    // Step 2: Insert artwork record
    const artworkId = await insertArtworkRecord({
      ...metadata,
      artwork_image: imageUrl
    });
    console.log(`[${index}] Artwork record created with ID: ${artworkId}`);

    // Step 3: Create analytics record
    await createAnalyticsRecord(artworkId);
    console.log(`[${index}] Analytics record created`);

    return {
      success: true,
      artworkId,
      imageUrl,
      title: metadata.artwork_title,
      artist: metadata.artist
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImage(imagePath, filename) {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = path.extname(filename);
    const baseName = path.basename(filename, fileExtension);
    const uniqueFilename = `${baseName}_${timestamp}${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(ARTWORK_BUCKET)
      .upload(uniqueFilename, fileBuffer, {
        contentType: getContentType(fileExtension)
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(ARTWORK_BUCKET)
      .getPublicUrl(uniqueFilename);

    return publicUrl;

  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * Insert artwork record into database
 */
async function insertArtworkRecord(artworkData) {
  try {
    // Prepare the data for insertion
    const insertData = {
      artwork_title: artworkData.artwork_title,
      artist: artworkData.artist,
      description: artworkData.description || '',
      price: artworkData.price || 'Not for sale',
      medium: artworkData.medium || 'Digital',
      genre: artworkData.genre || null,
      style: artworkData.style || null,
      subject: artworkData.subject || null,
      colour: artworkData.colour || null,
      artwork_image: artworkData.artwork_image,
      artwork_link: artworkData.artwork_link || null,
      dimensions: artworkData.dimensions || '',
      year: artworkData.year || new Date().getFullYear().toString(),
      artist_id: null, // Set to null for bulk uploads
      image_url: null, // Legacy field, can be null
      currency: null, // Not used in current schema
      tags: null, // Will be populated by AI if needed
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('Artwork')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return data.id;

  } catch (error) {
    throw new Error(`Artwork record creation failed: ${error.message}`);
  }
}

/**
 * Create analytics record for the artwork
 */
async function createAnalyticsRecord(artworkId) {
  try {
    const analyticsData = {
      artwork_id: artworkId,
      views: 0,
      leads: 0,
      likes: 0,
      dislikes: 0,
      adds_to_collection: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('ArtworkAnalytics')
      .insert(analyticsData);

    if (error) {
      throw new Error(`Analytics record creation failed: ${error.message}`);
    }

  } catch (error) {
    throw new Error(`Analytics setup failed: ${error.message}`);
  }
}

/**
 * Read and parse CSV file
 */
function readCSV(csvFilePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Get content type based on file extension
 */
function getContentType(extension) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif'
  };
  return types[extension.toLowerCase()] || 'image/jpeg';
}

/**
 * Sleep function for delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Example usage
if (require.main === module) {
  const csvPath = process.argv[2];
  const imagesPath = process.argv[3];
  
  if (!csvPath || !imagesPath) {
    console.log('Usage: node bulk-upload-artwork.js <csv-file-path> <images-directory-path>');
    console.log('\nExample CSV format:');
    console.log('filename,artwork_title,artist,description,price,medium,genre,style,subject,colour,dimensions,year,artwork_link');
    console.log('artwork1.jpg,"Abstract Dreams","John Doe","A vibrant exploration...","$5,000","Digital","abstract","Abstract","dreams","blue","1920x1080","2024","https://johndoe.art/dreams"');
    process.exit(1);
  }
  
  bulkUploadArtwork(csvPath, imagesPath)
    .then((results) => {
      console.log('\nBulk upload completed!');
      process.exit(results.failed.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Bulk upload failed:', error);
      process.exit(1);
    });
}

module.exports = { bulkUploadArtwork }; 