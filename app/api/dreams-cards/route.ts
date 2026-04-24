import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const TEMP_USER_ID = "temp-user-123";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get('listId');

  if (!listId) return NextResponse.json({ error: "List ID required" }, { status: 400 });

  try {
    const { rows } = await sql`
      SELECT card_id as id, list_id as "listId", name, number, rarity, supertype, set_name as "setName", set_id as "setId", image_small as "imageSmall", image_large as "imageLarge", quantity, market_price as "marketPrice", added_at as "addedAt"
      FROM dreams_cards 
      WHERE user_id = ${TEMP_USER_ID} AND list_id = ${listId}
      ORDER BY added_at DESC;
    `;
    return NextResponse.json({ cards: rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const card = await request.json();
    const qty = card.quantity || 1; // Default to 1 if not provided
    
    const check = await sql`SELECT quantity FROM dreams_cards WHERE user_id = ${TEMP_USER_ID} AND list_id = ${card.listId} AND card_id = ${card.id}`;
    
    if (check.rows.length > 0) {
       // FIXED: Now sets it to the EXACT quantity the frontend asked for
       await sql`UPDATE dreams_cards SET quantity = ${qty} WHERE user_id = ${TEMP_USER_ID} AND list_id = ${card.listId} AND card_id = ${card.id}`;
    } else {
       await sql`
        INSERT INTO dreams_cards (user_id, list_id, card_id, name, number, rarity, supertype, set_name, set_id, image_small, image_large, market_price, quantity)
        VALUES (${TEMP_USER_ID}, ${card.listId}, ${card.id}, ${card.name}, ${card.number}, ${card.rarity}, ${card.supertype}, ${card.setName}, ${card.setId}, ${card.imageSmall}, ${card.imageLarge}, ${card.marketPrice}, ${qty})
      `;
    }
    
    await sql`UPDATE dreams_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ${card.listId} AND user_id = ${TEMP_USER_ID}`;
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add card" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { listId, cardId } = await request.json();
    await sql`DELETE FROM dreams_cards WHERE user_id = ${TEMP_USER_ID} AND list_id = ${listId} AND card_id = ${cardId};`;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
