import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "@/lib/auth-middleware";
import { Database } from "@/lib/supabase-types";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Enhanced authentication with role verification
    const authResult = await verifyAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult.user;
    
    // Use service role key to bypass RLS policies (avoids infinite recursion)
    const adminSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user has a Galleries record (new separate table)
    const { data: galleryData, error: galleryError } = await adminSupabase
      .from('Galleries')
      .select('*')
      .eq('id', user.id)
      .single();

    let finalGalleryData = galleryData;

    // If no Galleries record exists, create it
    if (galleryError || !galleryData) {
      // Get collector info to use for Galleries record
      const { data: collectorInfo } = await adminSupabase
        .from('Collectors')
        .select('*')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle();

      // Also check old Artists table for migration
      const { data: oldArtistData } = await adminSupabase
        .from('Artists')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Create new Galleries record
      const { data: insertedData, error: insertError } = await adminSupabase
        .from('Galleries')
        .insert({
          id: user.id,
          username: oldArtistData?.username || collectorInfo?.username || user.email?.split('@')[0] || 'gallery',
          firstname: oldArtistData?.firstname || collectorInfo?.first_name || '',
          surname: oldArtistData?.surname || collectorInfo?.surname || '',
          email: user.email || '',
          country: oldArtistData?.country || collectorInfo?.country || '',
          biog: oldArtistData?.biog || '',
          website: oldArtistData?.website || '',
          profilepix: oldArtistData?.profilepix || collectorInfo?.profilepix || null,
          notification_consent: oldArtistData?.notification_consent || collectorInfo?.notification_consent || false,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to create Galleries record", details: insertError.message },
          { status: 500 }
        );
      }
      finalGalleryData = insertedData;
    }

    // Now ensure Collectors record is correct
    let collectorData = null;
    const { data: collectorByUserId } = await adminSupabase
      .from('Collectors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (collectorByUserId) {
      collectorData = collectorByUserId;
    } else {
      // Try by id (old format)
      const { data: collectorById } = await adminSupabase
        .from('Collectors')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (collectorById) {
        collectorData = collectorById;
        // Migrate to new format
        await adminSupabase
          .from('Collectors')
          .update({
            user_id: user.id,
            role: 'gallery'
          })
          .eq('id', user.id);
      }
    }

    if (collectorData) {
      // Update role if needed
      if (collectorData.role !== 'gallery') {
        const { error: updateError } = await adminSupabase
          .from('Collectors')
          .update({ role: 'gallery' })
          .eq(collectorData.user_id ? 'user_id' : 'id', user.id);

        if (updateError) {
          return NextResponse.json(
            { error: "Failed to update role", details: updateError.message },
            { status: 500 }
          );
        }
      }
    } else {
      // Create new Collectors record
      const { error: insertError } = await adminSupabase
        .from('Collectors')
        .insert({
          user_id: user.id,
          email: user.email || '',
          role: 'gallery',
          username: finalGalleryData?.username || '',
          first_name: finalGalleryData?.firstname || '',
          surname: finalGalleryData?.surname || '',
          country: finalGalleryData?.country || '',
          profilepix: finalGalleryData?.profilepix || null,
          notification_consent: finalGalleryData?.notification_consent || false,
          preferences: {
            artists: {}, genres: {}, styles: {}, subjects: {},
            colors: {}, priceRanges: {}, interactionCount: 0, viewed_artworks: [], disliked_artworks: [],
          },
          is_temporary: false,
        });

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to create collector record", details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gallery role has been fixed successfully"
    });

  } catch (error: any) {
    console.error('Error fixing gallery role:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

