const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findArtworkByTitles(titles) {
  console.log(`Searching for ${titles.length} artwork titles...\n`);
  
  const foundIds = [];
  const notFound = [];

  for (const title of titles) {
    try {
      const { data: artwork, error } = await supabase
        .from('Artwork')
        .select('id, artwork_title, artist')
        .ilike('artwork_title', title.trim());

      if (error) {
        console.error(`Error searching for "${title}":`, error.message);
        continue;
      }

      if (artwork && artwork.length > 0) {
        artwork.forEach(art => {
          console.log(`✅ Found: ID ${art.id} - "${art.artwork_title}" by ${art.artist}`);
          foundIds.push(art.id);
        });
      } else {
        console.log(`❌ Not found: "${title}"`);
        notFound.push(title);
      }
    } catch (error) {
      console.error(`Error processing "${title}":`, error.message);
    }
  }

  console.log('\n=== SEARCH SUMMARY ===');
  console.log(`Found: ${foundIds.length} artworks`);
  console.log(`Not found: ${notFound.length} titles`);

  if (foundIds.length > 0) {
    console.log(`\nArtwork IDs to delete: ${foundIds.join(', ')}`);
    console.log(`\nTo delete all found artworks, run:`);
    console.log(`node delete-artwork.js ${foundIds.join(' ')}`);
  }

  if (notFound.length > 0) {
    console.log(`\nTitles not found:`);
    notFound.forEach(title => console.log(`- "${title}"`));
  }

  return foundIds;
}

// Titles to search for
const titlesToDelete = [
  "Fidenza #725",
  "The Replicator", 
  "Machine Hallucination",
  "Rowing Through Time",
  "Distributed Consciousness",
  "Blossoming Cadaver",
  "Farmers' Surreal Amusement Mill",
  "Ethereal Falls",
  "Fungible",
  "Mickey123",
  "Land rover",
  "Portrait of picasso",
  "grosse merde de picasso",
  "picasso",
  "Particles",
  "ghost",
  "teterter",
  "teee",
  "ter",
  "vanilla",
  "rrrrr",
  "eeee",
  "ttt",
  "uhutruyrt",
  "terere",
  "death",
  "work",
  "Landscapr",
  "title artwork",
  "grey"
];

findArtworkByTitles(titlesToDelete); 