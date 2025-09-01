import { 
  type User, type InsertUser, type Service, type InsertService, type Booking, type InsertBooking, 
  type Quote, type InsertQuote, type Invoice, type InsertInvoice, type Notification, 
  type InsertNotification, type WorkProgress, type InsertWorkProgress,
  users, services, bookings, quotes, invoices, notifications, workProgress, adminSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Services
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  
  // Bookings
  getUserBookings(userId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking & { userId: string }): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  
  // Quotes
  getUserQuotes(userId: string): Promise<Quote[]>;
  getAllQuotes(): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote & { userId: string }): Promise<Quote>;
  updateQuoteStatus(id: string, status: string, amount?: string): Promise<Quote | undefined>;
  
  // Invoices
  getUserInvoices(userId: string): Promise<Invoice[]>;
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string): Promise<Invoice | undefined>;
  
  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  
  // Work Progress
  getWorkProgressByBooking(bookingId: string): Promise<WorkProgress[]>;
  createWorkProgress(progress: InsertWorkProgress): Promise<WorkProgress>;
  updateWorkProgress(id: string, progress: Partial<InsertWorkProgress>): Promise<WorkProgress | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with real services from myjantes.fr
    this.initializeServices();
  }

  private async initializeServices() {
    // Check if services already exist
    const existingServices = await db.select().from(services);
    
    if (existingServices.length === 0) {
      const servicesData: InsertService[] = [
        {
          name: "Rénovation",
          description: "Rénovation complète de vos jantes en aluminium avec finition professionnelle",
          basePrice: "150.00",
          image: "https://myjantes.fr/wp-content/uploads/2024/01/repar-jantes.jpg",
          active: true,
        },
        {
          name: "Personnalisation",
          description: "Personnalisation de vos jantes selon vos goûts et couleurs préférées",
          basePrice: "200.00",
          image: "https://myjantes.fr/wp-content/uploads/2025/02/jantes-concaver-lexus-1024x675-1.webp",
          active: true,
        },
        {
          name: "Dévoilage",
          description: "Réparation et redressement de jantes voilées",
          basePrice: "80.00",
          image: "https://myjantes.fr/wp-content/uploads/2024/01/dvoilage-3.jpg",
          active: true,
        },
        {
          name: "Décapage",
          description: "Décapage professionnel pour remettre vos jantes à neuf",
          basePrice: "120.00",
          image: "https://myjantes.fr/wp-content/uploads/2025/02/jantes-intro-1024x675.webp",
          active: true,
        },
      ];

      await db.insert(services).values(servicesData);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.active, true));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  // Bookings
  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async createBooking(booking: InsertBooking & { userId: string }): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking || undefined;
  }

  // Quotes
  async getUserQuotes(userId: string): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.userId, userId));
  }

  async getAllQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes);
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async createQuote(quote: InsertQuote & { userId: string }): Promise<Quote> {
    const [newQuote] = await db
      .insert(quotes)
      .values(quote)
      .returning();
    return newQuote;
  }

  async updateQuoteStatus(id: string, status: string, amount?: string): Promise<Quote | undefined> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ status, ...(amount && { amount }) })
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote || undefined;
  }

  // Invoices
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.userId, userId));
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    return invoice;
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(data)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice || undefined;
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ status })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice || undefined;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const result = await db.select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result.length;
  }

  // Work Progress
  async getWorkProgressByBooking(bookingId: string): Promise<WorkProgress[]> {
    return await db.select().from(workProgress)
      .where(eq(workProgress.bookingId, bookingId))
      .orderBy(workProgress.createdAt);
  }

  async createWorkProgress(progress: InsertWorkProgress): Promise<WorkProgress> {
    const [newProgress] = await db
      .insert(workProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateWorkProgress(id: string, progress: Partial<InsertWorkProgress>): Promise<WorkProgress | undefined> {
    const [updatedProgress] = await db
      .update(workProgress)
      .set(progress)
      .where(eq(workProgress.id, id))
      .returning();
    return updatedProgress || undefined;
  }
}

export const storage = new DatabaseStorage();
