const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findArtwork(searchTerm) {
  console.log(`\n🔍 Searching for: "${searchTerm}"\n`);
  
  // Search by title (case-insensitive, partial match)
  const { data: byTitle, error: titleError } = await supabase
    .from('Artwork')
    .select('id, artwork_title, artist, created_at, artwork_image')
    .ilike('artwork_title', `%${searchTerm}%`)
    .limit(10);

  if (titleError) {
    console.error('Error searching by title:', titleError.message);
  }

  // Search by artist (case-insensitive, partial match)
  const { data: byArtist, error: artistError } = await supabase
    .from('Artwork')
    .select('id, artwork_title, artist, created_at, artwork_image')
    .ilike('artist', `%${searchTerm}%`)
    .limit(10);

  if (artistError) {
    console.error('Error searching by artist:', artistError.message);
  }

  // Combine and deduplicate results
  const allResults = [];
  const seenIds = new Set();

  if (byTitle) {
    byTitle.forEach(art => {
      if (!seenIds.has(art.id)) {
        seenIds.add(art.id);
        allResults.push({ ...art, matchType: 'title' });
      }
    });
  }

  if (byArtist) {
    byArtist.forEach(art => {
      if (!seenIds.has(art.id)) {
        seenIds.add(art.id);
        allResults.push({ ...art, matchType: 'artist' });
      }
    });
  }

  if (allResults.length === 0) {
    console.log('❌ No artworks found matching your search.');
    console.log('\n💡 Try searching with:');
    console.log('   - Partial title (e.g., "cool" instead of "Cool it down")');
    console.log('   - Partial artist name (e.g., "lisa" instead of "Lisawong")');
    return;
  }

  console.log(`✅ Found ${allResults.length} artwork(s):\n`);
  console.log('─'.repeat(100));
  console.log('ID'.padEnd(8) + 'Title'.padEnd(40) + 'Artist'.padEnd(25) + 'Match');
  console.log('─'.repeat(100));

  allResults.forEach(art => {
    const id = art.id.toString().padEnd(8);
    const title = (art.artwork_title || 'Untitled').length > 38 
      ? (art.artwork_title || 'Untitled').substring(0, 35) + '...' 
      : (art.artwork_title || 'Untitled').padEnd(40);
    const artist = (art.artist || 'Unknown').length > 23 
      ? (art.artist || 'Unknown').substring(0, 20) + '...' 
      : (art.artist || 'Unknown').padEnd(25);
    const match = art.matchType.padEnd(10);
    
    console.log(`${id}${title}${artist}${match}`);
  });

  console.log('─'.repeat(100));
  
  // Show URL for direct access
  if (allResults.length === 1) {
    const artwork = allResults[0];
    console.log(`\n🔗 Direct URL to view this artwork:`);
    console.log(`   https://kaleidorium.com/?artworkId=${artwork.id}`);
  } else {
    console.log(`\n🔗 Direct URLs to view artworks:`);
    allResults.forEach(art => {
      console.log(`   ${art.artwork_title} (ID: ${art.id}): https://kaleidorium.com/?artworkId=${art.id}`);
    });
  }
}

// Get search term from command line arguments
const searchTerm = process.argv[2];

if (!searchTerm) {
  console.log('Usage: node find-artwork.js <search-term>');
  console.log('\nExample:');
  console.log('  node find-artwork.js "Cool it down"');
  console.log('  node find-artwork.js "Lisawong"');
  console.log('  node find-artwork.js "cool"');
  process.exit(1);
}

findArtwork(searchTerm);


