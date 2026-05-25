import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE() {
  // Use the standard server client to get the current user
  const supabase = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  try {
    // Admin client for full deletion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Delete the auth user (this cascades to user_profiles and other tables with ON DELETE CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    // Data in sifted_articles, follows, queued_articles, annotations, collection_stars,
    // user_integrations, public_collections etc. should cascade automatically.
    // If any tables don't have ON DELETE CASCADE, we could manually clean them here,
    // but all our tables are set up with proper foreign keys.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Account deletion error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}