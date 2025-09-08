import { NextResponse } from 'next/server'

// Simple handler to prevent 404s from browser extensions
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET() {
  return NextResponse.json({ message: 'No logs endpoint configured' }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ message: 'No logs endpoint configured' }, { status: 404 })
}