import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Add a column for the price they paid
    await sql`ALTER TABLE owned_cards ADD COLUMN IF NOT EXISTS paid_price DECIMAL(10,2);`;
    
    // 2. Add a column to track if it was EUR or DKK
    await sql`ALTER TABLE owned_cards ADD COLUMN IF NOT EXISTS currency VARCHAR(3);`;

    return NextResponse.json({ 
      message: "Database upgrade successful! You can now track prices and currencies." 
    }, { status: 200 });
  } catch (error) {
    console.error("Database update error:", error);
    return NextResponse.json({ error: "Failed to upgrade the database." }, { status: 500 });
  }
}
