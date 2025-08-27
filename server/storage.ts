import { type User, type InsertUser, type Service, type InsertService, type Booking, type InsertBooking, type Quote, type InsertQuote, type Invoice, type InsertInvoice } from "@shared/schema";
import { randomUUID } from "crypto";

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
  createBooking(booking: InsertBooking & { userId: string }): Promise<Booking>;
  
  // Quotes
  getUserQuotes(userId: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote & { userId: string }): Promise<Quote>;
  updateQuoteStatus(id: string, status: string, amount?: string): Promise<Quote | undefined>;
  
  // Invoices
  getUserInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string): Promise<Invoice | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private services: Map<string, Service>;
  private bookings: Map<string, Booking>;
  private quotes: Map<string, Quote>;
  private invoices: Map<string, Invoice>;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.bookings = new Map();
    this.quotes = new Map();
    this.invoices = new Map();
    
    // Initialize with demo services
    this.initializeServices();
  }

  private initializeServices() {
    const services: Service[] = [
      {
        id: "service-1",
        name: "Jantes Aluminium",
        description: "Large sélection de jantes aluminium de toutes tailles et styles",
        basePrice: "150.00",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        active: true,
      },
      {
        id: "service-2",
        name: "Changement de Pneus",
        description: "Montage, équilibrage et service professionnel",
        basePrice: "80.00",
        image: "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        active: true,
      },
      {
        id: "service-3",
        name: "Équilibrage & Géométrie",
        description: "Optimisez la tenue de route et la durée de vie",
        basePrice: "60.00",
        image: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        active: true,
      },
    ];

    services.forEach(service => {
      this.services.set(service.id, service);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date().toISOString() 
    };
    this.users.set(id, user);
    return user;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.active);
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }

  // Bookings
  async getUserBookings(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async createBooking(booking: InsertBooking & { userId: string }): Promise<Booking> {
    const id = randomUUID();
    const newBooking: Booking = { 
      ...booking, 
      id, 
      createdAt: new Date().toISOString() 
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  // Quotes
  async getUserQuotes(userId: string): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(quote => quote.userId === userId);
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async createQuote(quote: InsertQuote & { userId: string }): Promise<Quote> {
    const id = randomUUID();
    const newQuote: Quote = { 
      ...quote, 
      id, 
      createdAt: new Date().toISOString() 
    };
    this.quotes.set(id, newQuote);
    return newQuote;
  }

  async updateQuoteStatus(id: string, status: string, amount?: string): Promise<Quote | undefined> {
    const quote = this.quotes.get(id);
    if (quote) {
      const updatedQuote = { ...quote, status, ...(amount && { amount }) };
      this.quotes.set(id, updatedQuote);
      return updatedQuote;
    }
    return undefined;
  }

  // Invoices
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const newInvoice: Invoice = { 
      ...invoice, 
      id, 
      createdAt: new Date().toISOString() 
    };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (invoice) {
      const updatedInvoice = { ...invoice, status };
      this.invoices.set(id, updatedInvoice);
      return updatedInvoice;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
