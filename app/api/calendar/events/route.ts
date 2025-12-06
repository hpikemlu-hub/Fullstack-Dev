import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

/**
 * Calendar Events API Routes
 * Handles CRUD operations for calendar events
 */

/**
 * GET /api/calendar/events - Fetch calendar events
 * Query params:
 * - user_id: Filter by user (creator or participant)
 * - start_date: Filter events starting from this date
 * - end_date: Filter events ending before this date
 * - event_type: Filter by event type
 * - is_business_trip: Filter business trips (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const eventType = searchParams.get('event_type');
    const isBusinessTrip = searchParams.get('is_business_trip');

    // Build filter conditions
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate) {
      where.startDate = {
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.endDate = {
        lte: new Date(endDate)
      };
    }
    
    if (eventType) {
      where.eventType = eventType;
    }
    
    if (isBusinessTrip !== null) {
      where.isBusinessTrip = isBusinessTrip === 'true';
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: {
        startDate: 'asc'
      },
      include: {
        creator: {
          select: {
            id: true,
            namaLengkap: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: events,
      count: events.length 
    });
    
  } catch (error: any) {
    console.error('Calendar events fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch calendar events' 
    }, { status: 500 });
  }
}

/**
 * POST /api/calendar/events - Create new calendar event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const event = await prisma.calendarEvent.create({
      data: {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate)
      },
      include: {
        creator: {
          select: {
            id: true,
            namaLengkap: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: event 
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Calendar event creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create calendar event' 
    }, { status: 500 });
  }
}