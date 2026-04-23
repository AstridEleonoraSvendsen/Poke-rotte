import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Existing table
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

    // 2. NEW: Table for the Wishlist Folders
    await sql`
      CREATE TABLE IF NOT EXISTS dreams_lists (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. NEW: Table for the Cards inside the Wishlists
    await sql`
      CREATE TABLE IF NOT EXISTS dreams_cards (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        list_id VARCHAR(255) NOT NULL REFERENCES dreams_lists(id) ON DELETE CASCADE,
        card_id VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        number VARCHAR(255),
        rarity VARCHAR(255),
        supertype VARCHAR(255),
        set_name VARCHAR(255),
        set_id VARCHAR(255),
        image_small TEXT,
        image_large TEXT,
        quantity INTEGER DEFAULT 1,
        market_price DECIMAL(10,2),
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, list_id, card_id)
      );
    `;

    return NextResponse.json({ message: "All tables created successfully!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create tables" }, { status: 500 });
  }
}
