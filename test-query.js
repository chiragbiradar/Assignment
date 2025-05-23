// Test script to verify Supabase query
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabase = createClient(
  'https://tjrvzczdpejczcwiwjyj.supabase.co',
  process.env.SUPABASE_KEY // You'll need to provide this when running the script
);

async function testQuery() {
  try {
    // Test the fixed query
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        name,
        is_group,
        created_at,
        updated_at,
        chat_participants (
          user_id,
          users (
            id,
            full_name,
            avatar_url,
            email
          )
        ),
        messages (
          id,
          content,
          created_at,
          sender_id,
          is_read
        )
      `)
      .in('id', ['38acf92c-e9ad-4e27-83a1-4547b5788f27', 'fdf3311d-1a84-402f-9976-e3b8cf0469ef'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error with query:', error);
    } else {
      console.log('Query successful!');
      console.log('Number of chats returned:', data.length);
      console.log('First chat data:', JSON.stringify(data[0], null, 2).substring(0, 500) + '...');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testQuery();
