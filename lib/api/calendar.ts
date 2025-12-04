import type { CalendarEvent } from '@/types';

// API functions for calendar operations
export async function fetchOngoingEvents(userId?: string): Promise<CalendarEvent[]> {
  try {
    const url = userId ? `/api/calendar/events?status=ongoing&userId=${userId}` : '/api/calendar/events?status=ongoing';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch ongoing events');
    }
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching ongoing events:', error);
    return [];
  }
}

export async function fetchUpcomingEvents(userId?: string, limit?: number): Promise<CalendarEvent[]> {
  try {
    const params = new URLSearchParams({ status: 'upcoming' });
    if (userId) params.set('userId', userId);
    if (limit) params.set('limit', limit.toString());
    const response = await fetch(`/api/calendar/events?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch upcoming events');
    }
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

export async function createEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
  try {
    const response = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create event');
    }
    
    const data = await response.json();
    return data.event || null;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

export async function updateEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
  try {
    const response = await fetch(`/api/calendar/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update event');
    }
    
    const data = await response.json();
    return data.event || null;
  } catch (error) {
    console.error('Error updating event:', error);
    return null;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/calendar/events/${id}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}