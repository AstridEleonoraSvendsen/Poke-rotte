import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const TEMP_USER_ID = "temp-user-123";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('setId');

  if (!setId) return NextResponse.json({ error: "Set ID is required" }, { status: 400 });

  try {
    const { rows } = await sql`
      SELECT card_id FROM owned_cards WHERE user_id = ${TEMP_USER_ID} AND set_id = ${setId};
    `;
    const cardIds = rows.map(row => row.card_id);
    return NextResponse.json({ cards: cardIds }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch owned cards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { setId, cardId, action } = await request.json();

    if (action === 'add' && cardId) {
      await sql`
        INSERT INTO owned_cards (user_id, set_id, card_id) 
        VALUES (${TEMP_USER_ID}, ${setId}, ${cardId}) 
        ON CONFLICT DO NOTHING;
      `;
    } else if (action === 'remove' && cardId) {
      await sql`
        DELETE FROM owned_cards 
        WHERE user_id = ${TEMP_USER_ID} AND set_id = ${setId} AND card_id = ${cardId};
      `;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update owned cards" }, { status: 500 });
  }
}
