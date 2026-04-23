import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS owned_cards (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        set_id VARCHAR(255) NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, set_id, card_id)
      );
    `;
    return NextResponse.json({ message: "Owned Cards table created successfully!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}
