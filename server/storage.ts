import { 
  type User, type InsertUser, type Service, type InsertService, type Booking, type InsertBooking, 
  type Quote, type InsertQuote, type Invoice, type InsertInvoice, type Notification, 
  type InsertNotification, type WorkProgress, type InsertWorkProgress, type AuditLog, type InsertAuditLog,
  type BookingAssignment, type InsertBookingAssignment, type TimeSlotConfig, type InsertTimeSlotConfig,
  type UserGroup, type InsertUserGroup, type UserGroupMember, type InsertUserGroupMember,
  type LeaveRequest, type InsertLeaveRequest, type UpdateClientProfileData,
  users, services, bookings, quotes, invoices, notifications, workProgress, adminSettings, auditLogs, 
  bookingAssignments, timeSlotConfigs, userGroups, userGroupMembers, leaveRequests
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./db";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  updateUserProfile(id: string, profileData: UpdateClientProfileData): Promise<User | undefined>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
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
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]>;
  
  // Booking Assignments
  assignEmployeeToBooking(assignment: InsertBookingAssignment): Promise<BookingAssignment>;
  getEmployeeAssignments(employeeId: string): Promise<BookingAssignment[]>;
  getBookingAssignments(bookingId: string): Promise<BookingAssignment[]>;
  
  // Additional methods for enhanced tracking
  updateBookingWithTracking(id: string, status: string, userId: string): Promise<Booking | undefined>;
  updateQuoteWithTracking(id: string, data: Partial<Quote>, userId: string): Promise<Quote | undefined>;
  updateInvoiceWithTracking(id: string, data: Partial<Invoice>, userId: string): Promise<Invoice | undefined>;
  
  // Employee management
  getEmployees(): Promise<User[]>;
  
  // Time Slot Configurations
  getTimeSlotConfigs(): Promise<TimeSlotConfig[]>;
  createTimeSlotConfig(config: InsertTimeSlotConfig): Promise<TimeSlotConfig>;
  updateTimeSlotConfig(date: string, timeSlot: string, data: Partial<InsertTimeSlotConfig>): Promise<TimeSlotConfig | undefined>;
  getTimeSlotConfig(date: string, timeSlot: string): Promise<TimeSlotConfig | undefined>;
  
  // Admin Settings
  getAdminSettings(): Promise<any>;
  updateAdminSettings(settings: any): Promise<any>;
  
  // Additional booking methods
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  
  // User Groups
  getUserGroups(): Promise<UserGroup[]>;
  getUserGroup(id: string): Promise<UserGroup | undefined>;
  createUserGroup(group: InsertUserGroup): Promise<UserGroup>;
  updateUserGroup(id: string, updates: Partial<InsertUserGroup>): Promise<UserGroup | undefined>;
  deleteUserGroup(id: string): Promise<void>;
  getUsersByGroup(groupId: string): Promise<User[]>;
  getUserGroupMemberships(userId: string): Promise<UserGroup[]>;
  addUserToGroup(userId: string, groupId: string, addedBy: string): Promise<UserGroupMember>;
  removeUserFromGroup(userId: string, groupId: string): Promise<void>;
  
  // Leave Requests
  getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]>;
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequestStatus(id: string, status: string, approvedBy: string, notes?: string): Promise<LeaveRequest | undefined>;
  getUserLeaveStatus(userId: string): Promise<{isOnLeave: boolean, leaveEnd?: Date}>;
  updateUserLeaveStatus(userId: string, isOnLeave: boolean, startDate?: Date, endDate?: Date, reason?: string): Promise<void>;
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

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  async updateUserProfile(id: string, profileData: UpdateClientProfileData): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        clientType: profileData.clientType,
        companyName: profileData.companyName,
        companyAddress: profileData.companyAddress,
        companySiret: profileData.companySiret,
        companyVat: profileData.companyVat,
        companyApe: profileData.companyApe,
        companyContact: profileData.companyContact,
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
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

  async updateQuote(id: string, data: Partial<Quote>): Promise<Quote | undefined> {
    const [updatedQuote] = await db
      .update(quotes)
      .set(data)
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

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
  async getAllWorkProgress(): Promise<WorkProgress[]> {
    return await db.select().from(workProgress).orderBy(workProgress.createdAt);
  }

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

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    if (entityType && entityId) {
      query = query.where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)));
    } else if (entityType) {
      query = query.where(eq(auditLogs.entityType, entityType));
    }
    
    return await query.orderBy(desc(auditLogs.createdAt));
  }

  // Booking Assignments
  async assignEmployeeToBooking(assignment: InsertBookingAssignment): Promise<BookingAssignment> {
    const [newAssignment] = await db
      .insert(bookingAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async getEmployeeAssignments(employeeId: string): Promise<BookingAssignment[]> {
    return await db.select().from(bookingAssignments)
      .where(eq(bookingAssignments.employeeId, employeeId))
      .orderBy(desc(bookingAssignments.assignedAt));
  }

  async getBookingAssignments(bookingId: string): Promise<BookingAssignment[]> {
    return await db.select().from(bookingAssignments)
      .where(eq(bookingAssignments.bookingId, bookingId));
  }

  // Enhanced tracking methods
  async updateBookingWithTracking(id: string, status: string, userId: string): Promise<Booking | undefined> {
    // Get old booking for audit
    const oldBooking = await this.getBooking(id);
    
    const [updatedBooking] = await db
      .update(bookings)
      .set({ 
        status, 
        lastModifiedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id))
      .returning();

    // Create audit log
    if (updatedBooking && oldBooking) {
      await this.createAuditLog({
        userId,
        action: 'status_change',
        entityType: 'booking',
        entityId: id,
        oldValues: { status: oldBooking.status },
        newValues: { status: updatedBooking.status }
      });
    }

    return updatedBooking || undefined;
  }

  async updateQuoteWithTracking(id: string, data: Partial<Quote>, userId: string): Promise<Quote | undefined> {
    // Get old quote for audit
    const oldQuote = await this.getQuote(id);
    
    const [updatedQuote] = await db
      .update(quotes)
      .set({ 
        ...data, 
        lastModifiedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(quotes.id, id))
      .returning();

    // Create audit log
    if (updatedQuote && oldQuote) {
      await this.createAuditLog({
        userId,
        action: data.status ? 'status_change' : 'update',
        entityType: 'quote',
        entityId: id,
        oldValues: oldQuote,
        newValues: data
      });
    }

    return updatedQuote || undefined;
  }

  async updateInvoiceWithTracking(id: string, data: Partial<Invoice>, userId: string): Promise<Invoice | undefined> {
    // Get old invoice for audit
    const oldInvoice = await this.getInvoice(id);
    
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ 
        ...data, 
        lastModifiedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();

    // Create audit log
    if (updatedInvoice && oldInvoice) {
      await this.createAuditLog({
        userId,
        action: data.status ? 'status_change' : 'update',
        entityType: 'invoice',
        entityId: id,
        oldValues: oldInvoice,
        newValues: data
      });
    }

    return updatedInvoice || undefined;
  }

  // Employee management
  async getEmployees(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.role, 'employee'));
  }

  // Time Slot Configurations
  async getTimeSlotConfigs(): Promise<TimeSlotConfig[]> {
    return await db.select().from(timeSlotConfigs);
  }

  async createTimeSlotConfig(config: InsertTimeSlotConfig): Promise<TimeSlotConfig> {
    const [newConfig] = await db.insert(timeSlotConfigs)
      .values(config)
      .returning();
    return newConfig;
  }

  async updateTimeSlotConfig(date: string, timeSlot: string, data: Partial<InsertTimeSlotConfig>): Promise<TimeSlotConfig | undefined> {
    const [updatedConfig] = await db.update(timeSlotConfigs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(timeSlotConfigs.date, date), eq(timeSlotConfigs.timeSlot, timeSlot)))
      .returning();
    
    return updatedConfig || undefined;
  }

  async getTimeSlotConfig(date: string, timeSlot: string): Promise<TimeSlotConfig | undefined> {
    const [config] = await db.select().from(timeSlotConfigs)
      .where(and(eq(timeSlotConfigs.date, date), eq(timeSlotConfigs.timeSlot, timeSlot)));
    return config || undefined;
  }

  // Additional method for getting a single booking
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getAdminSettings(): Promise<any> {
    const [setting] = await db.select().from(adminSettings).limit(1);
    return setting || undefined;
  }

  async updateAdminSettings(data: any): Promise<void> {
    const existing = await this.getAdminSettings();
    
    if (existing) {
      await db
        .update(adminSettings)
        .set(data)
        .where(eq(adminSettings.id, existing.id));
    } else {
      await db.insert(adminSettings).values(data);
    }
  }

  // User Groups Implementation
  async getUserGroups(): Promise<UserGroup[]> {
    return await db.select().from(userGroups).orderBy(userGroups.name);
  }

  async getUserGroup(id: string): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.id, id));
    return group || undefined;
  }

  async createUserGroup(group: InsertUserGroup): Promise<UserGroup> {
    const [newGroup] = await db.insert(userGroups).values(group).returning();
    return newGroup;
  }

  async updateUserGroup(id: string, updates: Partial<InsertUserGroup>): Promise<UserGroup | undefined> {
    const [updatedGroup] = await db.update(userGroups)
      .set(updates)
      .where(eq(userGroups.id, id))
      .returning();
    return updatedGroup || undefined;
  }

  async deleteUserGroup(id: string): Promise<void> {
    // First remove all members from the group
    await db.delete(userGroupMembers).where(eq(userGroupMembers.groupId, id));
    // Then delete the group
    await db.delete(userGroups).where(eq(userGroups.id, id));
  }

  async getUsersByGroup(groupId: string): Promise<User[]> {
    const result = await db
      .select({ 
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        address: users.address,
        role: users.role,
        clientType: users.clientType,
        companyName: users.companyName,
        companyAddress: users.companyAddress,
        companySiret: users.companySiret,
        companyVat: users.companyVat,
        companyApe: users.companyApe,
        companyContact: users.companyContact,
        isOnLeave: users.isOnLeave,
        leaveStartDate: users.leaveStartDate,
        leaveEndDate: users.leaveEndDate,
        leaveReason: users.leaveReason,
        createdAt: users.createdAt
      })
      .from(users)
      .innerJoin(userGroupMembers, eq(users.id, userGroupMembers.userId))
      .where(eq(userGroupMembers.groupId, groupId));
    
    return result;
  }

  async getUserGroupMemberships(userId: string): Promise<UserGroup[]> {
    const result = await db
      .select({
        id: userGroups.id,
        name: userGroups.name,
        description: userGroups.description,
        type: userGroups.type,
        color: userGroups.color,
        permissions: userGroups.permissions,
        createdAt: userGroups.createdAt,
        createdBy: userGroups.createdBy
      })
      .from(userGroups)
      .innerJoin(userGroupMembers, eq(userGroups.id, userGroupMembers.groupId))
      .where(eq(userGroupMembers.userId, userId));
    
    return result;
  }

  async addUserToGroup(userId: string, groupId: string, addedBy: string): Promise<UserGroupMember> {
    const [member] = await db
      .insert(userGroupMembers)
      .values({ userId, groupId, addedBy })
      .returning();
    return member;
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await db
      .delete(userGroupMembers)
      .where(and(eq(userGroupMembers.userId, userId), eq(userGroupMembers.groupId, groupId)));
  }

  // Leave Requests Implementation
  async getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
    if (employeeId) {
      return await db.select().from(leaveRequests)
        .where(eq(leaveRequests.employeeId, employeeId))
        .orderBy(desc(leaveRequests.createdAt));
    }
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || undefined;
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [newRequest] = await db.insert(leaveRequests).values(request).returning();
    return newRequest;
  }

  async updateLeaveRequestStatus(id: string, status: string, approvedBy: string, notes?: string): Promise<LeaveRequest | undefined> {
    const [updatedRequest] = await db.update(leaveRequests)
      .set({
        status,
        approvedBy,
        approvedAt: new Date(),
        notes
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updatedRequest || undefined;
  }

  async getUserLeaveStatus(userId: string): Promise<{isOnLeave: boolean, leaveEnd?: Date}> {
    const [user] = await db.select({
      isOnLeave: users.isOnLeave,
      leaveEndDate: users.leaveEndDate
    }).from(users).where(eq(users.id, userId));
    
    return {
      isOnLeave: user?.isOnLeave || false,
      leaveEnd: user?.leaveEndDate || undefined
    };
  }

  async updateUserLeaveStatus(userId: string, isOnLeave: boolean, startDate?: Date, endDate?: Date, reason?: string): Promise<void> {
    await db.update(users)
      .set({
        isOnLeave,
        leaveStartDate: startDate || null,
        leaveEndDate: endDate || null,
        leaveReason: reason || null
      })
      .where(eq(users.id, userId));
  }
}

// In-memory storage implementation for development
export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private services: Map<string, Service> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private quotes: Map<string, Quote> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private workProgress: Map<string, WorkProgress> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private bookingAssignments: Map<string, BookingAssignment> = new Map();
  private timeSlotConfigs: Map<string, TimeSlotConfig> = new Map();
  private userGroups: Map<string, UserGroup> = new Map();
  private userGroupMembers: Map<string, UserGroupMember> = new Map();
  private leaveRequests: Map<string, LeaveRequest> = new Map();
  private adminSettings: any = {};

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize with real services from myjantes.fr
    const servicesData: Service[] = [
      {
        id: nanoid(),
        name: "Rénovation",
        description: "Rénovation complète de vos jantes en aluminium avec finition professionnelle",
        basePrice: "150.00",
        image: "https://myjantes.fr/wp-content/uploads/2024/01/repar-jantes.jpg",
        active: true,
      },
      {
        id: nanoid(),
        name: "Personnalisation",
        description: "Personnalisation de vos jantes selon vos goûts et couleurs préférées",
        basePrice: "200.00",
        image: "https://myjantes.fr/wp-content/uploads/2025/02/jantes-concaver-lexus-1024x675-1.webp",
        active: true,
      },
      {
        id: nanoid(),
        name: "Dévoilage",
        description: "Réparation et redressement de jantes voilées",
        basePrice: "80.00",
        image: "https://myjantes.fr/wp-content/uploads/2024/01/dvoilage-3.jpg",
        active: true,
      },
      {
        id: nanoid(),
        name: "Décapage",
        description: "Décapage professionnel pour remettre vos jantes à neuf",
        basePrice: "120.00",
        image: "https://myjantes.fr/wp-content/uploads/2025/02/jantes-intro-1024x675.webp",
        active: true,
      },
    ];

    servicesData.forEach(service => {
      this.services.set(service.id, service);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: nanoid(),
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.password = hashedPassword;
    }
  }

  async updateUserProfile(id: string, profileData: UpdateClientProfileData): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, profileData);
      return user;
    }
    return undefined;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, userData);
      return user;
    }
    return undefined;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Services
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values()).filter(s => s.active);
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const service: Service = {
      id: nanoid(),
      ...insertService,
    };
    this.services.set(service.id, service);
    return service;
  }

  // Bookings
  async getUserBookings(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(b => b.userId === userId);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(booking: InsertBooking & { userId: string }): Promise<Booking> {
    const newBooking: Booking = {
      id: nanoid(),
      ...booking,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.set(newBooking.id, newBooking);
    return newBooking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      booking.status = status;
      booking.updatedAt = new Date();
      return booking;
    }
    return undefined;
  }

  // Quotes
  async getUserQuotes(userId: string): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(q => q.userId === userId);
  }

  async getAllQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async createQuote(quote: InsertQuote & { userId: string }): Promise<Quote> {
    const newQuote: Quote = {
      id: nanoid(),
      ...quote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.quotes.set(newQuote.id, newQuote);
    return newQuote;
  }

  async updateQuoteStatus(id: string, status: string, amount?: string): Promise<Quote | undefined> {
    const quote = this.quotes.get(id);
    if (quote) {
      quote.status = status;
      if (amount) quote.amount = amount;
      quote.updatedAt = new Date();
      return quote;
    }
    return undefined;
  }

  // Invoices
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(i => i.userId === userId);
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoice: Invoice = {
      id: nanoid(),
      ...insertInvoice,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (invoice) {
      invoice.status = status;
      invoice.updatedAt = new Date();
      return invoice;
    }
    return undefined;
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: nanoid(),
      ...notification,
      createdAt: new Date(),
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
    }
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.read).length;
  }

  // Work Progress
  async getWorkProgressByBooking(bookingId: string): Promise<WorkProgress[]> {
    return Array.from(this.workProgress.values())
      .filter(wp => wp.bookingId === bookingId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createWorkProgress(progress: InsertWorkProgress): Promise<WorkProgress> {
    const newProgress: WorkProgress = {
      id: nanoid(),
      ...progress,
      createdAt: new Date(),
    };
    this.workProgress.set(newProgress.id, newProgress);
    return newProgress;
  }

  async updateWorkProgress(id: string, progress: Partial<InsertWorkProgress>): Promise<WorkProgress | undefined> {
    const existing = this.workProgress.get(id);
    if (existing) {
      Object.assign(existing, progress);
      return existing;
    }
    return undefined;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: nanoid(),
      ...log,
      createdAt: new Date(),
    };
    this.auditLogs.set(newLog.id, newLog);
    return newLog;
  }

  async getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values());
    
    if (entityType && entityId) {
      logs = logs.filter(log => log.entityType === entityType && log.entityId === entityId);
    } else if (entityType) {
      logs = logs.filter(log => log.entityType === entityType);
    }
    
    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Booking Assignments
  async assignEmployeeToBooking(assignment: InsertBookingAssignment): Promise<BookingAssignment> {
    const newAssignment: BookingAssignment = {
      id: nanoid(),
      ...assignment,
      assignedAt: new Date(),
    };
    this.bookingAssignments.set(newAssignment.id, newAssignment);
    return newAssignment;
  }

  async getEmployeeAssignments(employeeId: string): Promise<BookingAssignment[]> {
    return Array.from(this.bookingAssignments.values())
      .filter(ba => ba.employeeId === employeeId)
      .sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
  }

  async getBookingAssignments(bookingId: string): Promise<BookingAssignment[]> {
    return Array.from(this.bookingAssignments.values())
      .filter(ba => ba.bookingId === bookingId);
  }

  // Enhanced tracking methods
  async updateBookingWithTracking(id: string, status: string, userId: string): Promise<Booking | undefined> {
    const oldBooking = this.bookings.get(id);
    if (oldBooking) {
      const oldStatus = oldBooking.status;
      oldBooking.status = status;
      oldBooking.lastModifiedBy = userId;
      oldBooking.updatedAt = new Date();

      // Create audit log
      await this.createAuditLog({
        userId,
        action: 'status_change',
        entityType: 'booking',
        entityId: id,
        oldValues: { status: oldStatus },
        newValues: { status }
      });

      return oldBooking;
    }
    return undefined;
  }

  async updateQuoteWithTracking(id: string, data: Partial<Quote>, userId: string): Promise<Quote | undefined> {
    const oldQuote = this.quotes.get(id);
    if (oldQuote) {
      const oldValues = { ...oldQuote };
      Object.assign(oldQuote, data);
      oldQuote.lastModifiedBy = userId;
      oldQuote.updatedAt = new Date();

      // Create audit log
      await this.createAuditLog({
        userId,
        action: data.status ? 'status_change' : 'update',
        entityType: 'quote',
        entityId: id,
        oldValues,
        newValues: data
      });

      return oldQuote;
    }
    return undefined;
  }

  async updateInvoiceWithTracking(id: string, data: Partial<Invoice>, userId: string): Promise<Invoice | undefined> {
    const oldInvoice = this.invoices.get(id);
    if (oldInvoice) {
      const oldValues = { ...oldInvoice };
      Object.assign(oldInvoice, data);
      oldInvoice.lastModifiedBy = userId;
      oldInvoice.updatedAt = new Date();

      // Create audit log
      await this.createAuditLog({
        userId,
        action: data.status ? 'status_change' : 'update',
        entityType: 'invoice',
        entityId: id,
        oldValues,
        newValues: data
      });

      return oldInvoice;
    }
    return undefined;
  }

  // Employee management
  async getEmployees(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === 'employee');
  }

  // Time Slot Configurations
  async getTimeSlotConfigs(): Promise<TimeSlotConfig[]> {
    return Array.from(this.timeSlotConfigs.values());
  }

  async createTimeSlotConfig(config: InsertTimeSlotConfig): Promise<TimeSlotConfig> {
    const newConfig: TimeSlotConfig = {
      id: nanoid(),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timeSlotConfigs.set(newConfig.id, newConfig);
    return newConfig;
  }

  async updateTimeSlotConfig(date: string, timeSlot: string, data: Partial<InsertTimeSlotConfig>): Promise<TimeSlotConfig | undefined> {
    // Find config by date and timeSlot
    for (const config of this.timeSlotConfigs.values()) {
      if (config.date === date && config.timeSlot === timeSlot) {
        Object.assign(config, data);
        config.updatedAt = new Date();
        return config;
      }
    }
    return undefined;
  }

  async getTimeSlotConfig(date: string, timeSlot: string): Promise<TimeSlotConfig | undefined> {
    for (const config of this.timeSlotConfigs.values()) {
      if (config.date === date && config.timeSlot === timeSlot) {
        return config;
      }
    }
    return undefined;
  }

  // Admin Settings
  async getAdminSettings(): Promise<any> {
    return this.adminSettings;
  }

  async updateAdminSettings(settings: any): Promise<any> {
    Object.assign(this.adminSettings, settings);
    return this.adminSettings;
  }

  // User Groups
  async getUserGroups(): Promise<UserGroup[]> {
    return Array.from(this.userGroups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getUserGroup(id: string): Promise<UserGroup | undefined> {
    return this.userGroups.get(id);
  }

  async createUserGroup(group: InsertUserGroup): Promise<UserGroup> {
    const newGroup: UserGroup = {
      id: nanoid(),
      ...group,
      createdAt: new Date(),
    };
    this.userGroups.set(newGroup.id, newGroup);
    return newGroup;
  }

  async updateUserGroup(id: string, updates: Partial<InsertUserGroup>): Promise<UserGroup | undefined> {
    const group = this.userGroups.get(id);
    if (group) {
      Object.assign(group, updates);
      return group;
    }
    return undefined;
  }

  async deleteUserGroup(id: string): Promise<void> {
    // Remove all members from the group
    for (const [memberId, member] of this.userGroupMembers) {
      if (member.groupId === id) {
        this.userGroupMembers.delete(memberId);
      }
    }
    // Delete the group
    this.userGroups.delete(id);
  }

  async getUsersByGroup(groupId: string): Promise<User[]> {
    const memberUserIds = Array.from(this.userGroupMembers.values())
      .filter(member => member.groupId === groupId)
      .map(member => member.userId);
    
    return Array.from(this.users.values())
      .filter(user => memberUserIds.includes(user.id));
  }

  async getUserGroupMemberships(userId: string): Promise<UserGroup[]> {
    const groupIds = Array.from(this.userGroupMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.groupId);
    
    return Array.from(this.userGroups.values())
      .filter(group => groupIds.includes(group.id));
  }

  async addUserToGroup(userId: string, groupId: string, addedBy: string): Promise<UserGroupMember> {
    const newMember: UserGroupMember = {
      id: nanoid(),
      userId,
      groupId,
      addedBy,
      joinedAt: new Date(),
    };
    this.userGroupMembers.set(newMember.id, newMember);
    return newMember;
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    for (const [memberId, member] of this.userGroupMembers) {
      if (member.userId === userId && member.groupId === groupId) {
        this.userGroupMembers.delete(memberId);
        break;
      }
    }
  }

  // Leave Requests
  async getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
    let requests = Array.from(this.leaveRequests.values());
    if (employeeId) {
      requests = requests.filter(r => r.employeeId === employeeId);
    }
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const newRequest: LeaveRequest = {
      id: nanoid(),
      ...request,
      createdAt: new Date(),
    };
    this.leaveRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async updateLeaveRequestStatus(id: string, status: string, approvedBy: string, notes?: string): Promise<LeaveRequest | undefined> {
    const request = this.leaveRequests.get(id);
    if (request) {
      request.status = status;
      request.approvedBy = approvedBy;
      request.approvedAt = new Date();
      if (notes) request.notes = notes;
      return request;
    }
    return undefined;
  }

  async getUserLeaveStatus(userId: string): Promise<{isOnLeave: boolean, leaveEnd?: Date}> {
    const user = this.users.get(userId);
    return {
      isOnLeave: user?.isOnLeave || false,
      leaveEnd: user?.leaveEndDate || undefined
    };
  }

  async updateUserLeaveStatus(userId: string, isOnLeave: boolean, startDate?: Date, endDate?: Date, reason?: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isOnLeave = isOnLeave;
      user.leaveStartDate = startDate || null;
      user.leaveEndDate = endDate || null;
      user.leaveReason = reason || null;
    }
  }
}

// Use memory storage for development when database is not available
export const storage = new MemoryStorage();
