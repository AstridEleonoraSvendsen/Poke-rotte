import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const TEMP_USER_ID = "temp-user-123";

// GET all lists
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt" 
      FROM dreams_lists 
      WHERE user_id = ${TEMP_USER_ID}
      ORDER BY created_at DESC;
    `;
    return NextResponse.json({ lists: rows }, { status: 200 });
  } catch (error) {
    console.error("Error fetching dreams lists:", error);
    return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 });
  }
}

// POST a new list
export async function POST(request: Request) {
  try {
    const { id, name, description } = await request.json();
    
    await sql`
      INSERT INTO dreams_lists (id, user_id, name, description) 
      VALUES (${id}, ${TEMP_USER_ID}, ${name}, ${description});
    `;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}

// DELETE a list
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await sql`DELETE FROM dreams_lists WHERE id = ${id} AND user_id = ${TEMP_USER_ID};`;
    // Note: Because we used ON DELETE CASCADE in the table setup, this automatically deletes the cards inside it too!
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting list:", error);
    return NextResponse.json({ error: "Failed to delete list" }, { status: 500 });
  }
}
