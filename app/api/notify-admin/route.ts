import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      artist,
      artwork,
      artworkId,
      rowNumber,
    } = body;

    // Prepare variables for EmailJS template
    const templateParams = {
      to_email: 'kurator@kaleidorium.com',
      artist_name: artist?.username || '',
      artist_email: artist?.email || '',
      artwork_title: artwork?.title || '',
      artwork_year: artwork?.year || '',
      artwork_image: artwork?.artwork_image || artwork?.imageUrl || '',
      artwork_description: artwork?.description || '',
      artwork_price: artwork?.price || '',
      artwork_currency: artwork?.currency || '',
      artwork_link: artwork?.url || '',
      artwork_medium: artwork?.medium || '',
      artwork_dimensions: artwork?.dimensions || '',
      artwork_genre: artwork?.genre || '',
      artwork_style: artwork?.style || '',
      artwork_subject: artwork?.subject || '',
      artwork_colour: artwork?.colour || '',
      artwork_tags: (artwork?.tags || []).join(', '),
      artwork_id: artworkId || '',
      row_number: rowNumber || '',
    };

    // Call EmailJS REST API
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_za8v4ih',
        template_id: 'template_kziu70q',
        user_id: 'CRMHpV3s39teTwijy',
        template_params: templateParams,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[EMAILJS ERROR]', errorText);
      return new Response('Failed to send email', { status: 500 });
    }

    return new Response('Email sent', { status: 200 });
  } catch (error) {
    console.error('[EMAILJS ERROR]', error);
    return new Response('Internal server error', { status: 500 });
  }
} 