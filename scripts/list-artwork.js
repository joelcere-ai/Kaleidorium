const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listArtwork(options = {}) {
  const { artist, limit, offset } = options;
  
  console.log('Fetching artwork from database...\n');
  
  let query = supabase
    .from('Artwork')
    .select('id, artwork_title, artist, created_at')
    .order('id', { ascending: true });
    
  if (artist) {
    query = query.ilike('artist', `%${artist}%`);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  if (offset) {
    query = query.range(offset, offset + (limit || 50) - 1);
  }

  const { data: artwork, error } = await query;

  if (error) {
    console.error('Error fetching artwork:', error.message);
    process.exit(1);
  }

  if (!artwork || artwork.length === 0) {
    console.log('No artwork found matching criteria.');
    return;
  }

  console.log(`Found ${artwork.length} artwork(s):\n`);
  console.log('ID'.padEnd(6) + 'Title'.padEnd(40) + 'Artist'.padEnd(25) + 'Created');
  console.log('─'.repeat(100));

  artwork.forEach(art => {
    const id = art.id.toString().padEnd(6);
    const title = (art.artwork_title || 'Untitled').length > 38 
      ? (art.artwork_title || 'Untitled').substring(0, 35) + '...' 
      : (art.artwork_title || 'Untitled').padEnd(40);
    const artist = (art.artist || 'Unknown').length > 23 
      ? (art.artist || 'Unknown').substring(0, 20) + '...' 
      : (art.artist || 'Unknown').padEnd(25);
    const created = new Date(art.created_at).toISOString().split('T')[0];
    
    console.log(`${id}${title}${artist}${created}`);
  });

  console.log('\n' + '─'.repeat(100));
  console.log(`Total: ${artwork.length} artwork(s)`);
  
  if (artwork.length > 0) {
    const ids = artwork.map(art => art.id);
    console.log(`\nID Range: ${Math.min(...ids)} - ${Math.max(...ids)}`);
    console.log(`\nTo delete all these artworks, run:`);
    console.log(`node delete-artwork.js ${Math.min(...ids)}-${Math.max(...ids)}`);
    console.log(`\nTo delete specific ones, run:`);
    console.log(`node delete-artwork.js ${ids.slice(0, 5).join(' ')}${ids.length > 5 ? ' ...' : ''}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

let i = 0;
while (i < args.length) {
  switch (args[i]) {
    case '--artist':
    case '-a':
      options.artist = args[i + 1];
      i += 2;
      break;
    case '--limit':
    case '-l':
      options.limit = parseInt(args[i + 1]);
      i += 2;
      break;
    case '--offset':
    case '-o':
      options.offset = parseInt(args[i + 1]);
      i += 2;
      break;
    case '--help':
    case '-h':
      console.log(`
Usage: node list-artwork.js [options]

Options:
  -a, --artist <name>    Filter by artist name (partial match)
  -l, --limit <number>   Limit number of results (default: all)
  -o, --offset <number>  Skip first N results
  -h, --help            Show this help

Examples:
  node list-artwork.js                     # List all artwork
  node list-artwork.js -a "Training Data"  # List AI-generated artwork
  node list-artwork.js -a "XCOPY"          # List XCOPY artwork
  node list-artwork.js -l 20               # List first 20 artworks
  node list-artwork.js -l 20 -o 50         # List 20 artworks starting from #50
`);
      process.exit(0);
    default:
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
  }
}

listArtwork(options); 