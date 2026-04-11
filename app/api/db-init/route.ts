import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Create the Wishlists table
    await sql`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Create the Wishlist Cards table (to hold the actual cards in each list)
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_cards (
        id SERIAL PRIMARY KEY,
        wishlist_id INTEGER REFERENCES wishlists(id) ON DELETE CASCADE,
        card_id VARCHAR(255) NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Create the Master Sets table
    await sql`
      CREATE TABLE IF NOT EXISTS master_sets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        set_id VARCHAR(255) NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({ message: "Database tables created successfully!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
