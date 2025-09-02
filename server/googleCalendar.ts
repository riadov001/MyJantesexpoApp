import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import type { Booking } from '@shared/schema';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:5000/api/google/callback'
    );
  }

  // Generate OAuth URL for user consent
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  // Set credentials from stored tokens
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Create calendar event from booking
  async createBookingEvent(booking: Booking, userEmail: string, userName: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Parse date and time
    const [year, month, day] = booking.date.split('-');
    const [hours, minutes] = booking.timeSlot.split(':');
    
    const startDateTime = new Date(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    
    // Assume 1 hour duration by default
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `Réservation MyJantes - ${booking.vehicleBrand}`,
      description: `
Réservation MyJantes
Client: ${userName}
Véhicule: ${booking.vehicleBrand} (${booking.vehiclePlate})
Notes: ${booking.notes || 'Aucune note'}
Statut: ${booking.status}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      attendees: [
        { email: userEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send email invitations
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  // Update calendar event
  async updateBookingEvent(eventId: string, booking: Booking, userEmail: string, userName: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const [year, month, day] = booking.date.split('-');
    const [hours, minutes] = booking.timeSlot.split(':');
    
    const startDateTime = new Date(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `Réservation MyJantes - ${booking.vehicleBrand}`,
      description: `
Réservation MyJantes
Client: ${userName}
Véhicule: ${booking.vehicleBrand} (${booking.vehiclePlate})
Notes: ${booking.notes || 'Aucune note'}
Statut: ${booking.status}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
    };

    try {
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
        sendUpdates: 'all',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  // Delete calendar event
  async deleteBookingEvent(eventId: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  // List events for a date range
  async listEvents(startDate: string, endDate: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw error;
    }
  }
}