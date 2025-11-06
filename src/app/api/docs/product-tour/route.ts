import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API handler that streams the product tour markdown so the UI can render
 * it without duplicating content.
 */
export async function GET() {
  try {
    const docPath = path.resolve(process.cwd(), '../docs/tutorials/product-tour.md');
    const content = await fs.readFile(docPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('[api/docs/product-tour] Failed to read markdown file', error);
    return NextResponse.json(
      { error: 'Product tour guide is unavailable.' },
      { status: 500 },
    );
  }
}
