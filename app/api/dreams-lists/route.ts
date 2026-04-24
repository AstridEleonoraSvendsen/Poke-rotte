import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const TEMP_USER_ID = "temp-user-123";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt" 
      FROM dreams_lists 
      WHERE user_id = ${TEMP_USER_ID}
      ORDER BY updated_at DESC;
    `;
    return NextResponse.json({ lists: rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, name, description } = await request.json();
    
    // FIXED: Uses ON CONFLICT to safely update lists without crashing
    await sql`
      INSERT INTO dreams_lists (id, user_id, name, description, updated_at) 
      VALUES (${id}, ${TEMP_USER_ID}, ${name}, ${description}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        description = EXCLUDED.description,
        updated_at = EXCLUDED.updated_at;
    `;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await sql`DELETE FROM dreams_lists WHERE id = ${id} AND user_id = ${TEMP_USER_ID};`;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete list" }, { status: 500 });
  }
}
