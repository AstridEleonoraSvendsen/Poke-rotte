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
      SELECT card_id as "cardId", paid_price as "paidPrice", currency
      FROM owned_cards 
      WHERE user_id = ${TEMP_USER_ID} AND set_id = ${setId};
    `;
    
    // We send an array of just IDs (to keep your current frontend from crashing)
    // AND we send the full pricing data for our new feature!
    const cardIds = rows.map(r => r.cardId);
    
    return NextResponse.json({ cards: cardIds, cardData: rows }, { status: 200 });
  } catch (error) {
    console.error("Error fetching owned cards:", error);
    return NextResponse.json({ error: "Failed to fetch owned cards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { setId, cardId, action, paidPrice, currency } = await request.json();

    if (!setId || !cardId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === 'add') {
      await sql`
        INSERT INTO owned_cards (user_id, set_id, card_id) 
        VALUES (${TEMP_USER_ID}, ${setId}, ${cardId})
        ON CONFLICT (user_id, set_id, card_id) DO NOTHING;
      `;
    } else if (action === 'remove') {
      await sql`
        DELETE FROM owned_cards 
        WHERE user_id = ${TEMP_USER_ID} AND set_id = ${setId} AND card_id = ${cardId};
      `;
    } else if (action === 'update_price') {
      // This is the new action! It updates the price and currency, or creates the row if it's missing.
      await sql`
        INSERT INTO owned_cards (user_id, set_id, card_id, paid_price, currency) 
        VALUES (${TEMP_USER_ID}, ${setId}, ${cardId}, ${paidPrice}, ${currency})
        ON CONFLICT (user_id, set_id, card_id) DO UPDATE SET 
          paid_price = EXCLUDED.paid_price,
          currency = EXCLUDED.currency;
      `;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error modifying owned cards:", error);
    return NextResponse.json({ error: "Failed to modify owned cards" }, { status: 500 });
  }
}
