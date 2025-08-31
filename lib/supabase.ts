import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection and log table info
const testConnection = async () => {
  try {
    // Test connection by getting table info
    const { data, error } = await supabase
      .from('Artwork')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error testing Supabase connection:', error);
    } else {
      console.log('Successfully connected to Supabase');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Error in connection test:', err);
  }
};

// Test storage bucket configuration
const testStorageConfig = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    const profileBucket = buckets?.find(b => b.name === 'profile-pictures');
    console.log('Profile pictures bucket:', profileBucket ? 'exists' : 'does not exist');

    if (profileBucket) {
      // Test bucket permissions
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const { data: uploadTest, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload('test.txt', testFile, { upsert: true });

      if (uploadError) {
        console.error('Storage permission test failed:', uploadError);
      } else {
        console.log('Storage permission test passed');
        // Clean up test file
        await supabase.storage
          .from('profile-pictures')
          .remove(['test.txt']);
      }
    }
  } catch (err) {
    console.error('Error testing storage configuration:', err);
  }
};

// Run tests
testConnection();
testStorageConfig();

// Initialize storage for profile pictures
export const initializeProfilePictureStorage = async () => {
  try {
    // Try to list files in the bucket instead of checking if it exists
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .list()
    
    if (error) {
      // Check if the error message indicates the bucket doesn't exist
      if (error.message?.includes('bucket') || error.message?.includes('400')) {
        console.log('Profile pictures bucket: does not exist')
        console.log('Creating profile pictures bucket...')
        
        // Use the server API to create the bucket
        const response = await fetch('/api/storage/create-bucket', {
          method: 'POST',
        })
        
        if (!response.ok) {
          throw new Error('Failed to create bucket')
        }
        
        console.log('Profile pictures bucket created successfully')
      } else {
        throw error
      }
    } else {
      console.log('Profile pictures bucket: exists')
    }
  } catch (error) {
    console.error('Error initializing storage:', error)
  }
}

// Initialize storage on client side
if (typeof window !== 'undefined') {
  initializeProfilePictureStorage()
} 