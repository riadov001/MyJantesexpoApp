import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookingSchema, insertQuoteSchema, insertInvoiceSchema, insertNotificationSchema, insertWorkProgressSchema, insertBookingAssignmentSchema, loginSchema, changePasswordSchema, updateClientProfileSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { PDFGenerator } from './pdfGenerator';
import { EmailService } from './emailService';

const JWT_SECRET = process.env.JWT_SECRET || "myjantes-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify admin role
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await storage.getUser(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès administrateur requis' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur de vérification des permissions' });
  }
};

const requireAdminOrEmployee = async (req: any, res: any, next: any) => {
  try {
    const user = await storage.getUser(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
      return res.status(403).json({ message: 'Accès administrateur ou employé requis' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur de vérification des permissions' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(loginData.email);
      
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          phone: user.phone,
          role: user.role
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Données invalides" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({ 
        ...userData, 
        password: hashedPassword 
      });

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.status(201).json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          phone: user.phone 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Données invalides" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        phone: user.phone,
        address: user.address,
        role: user.role,
        clientType: user.clientType,
        companyName: user.companyName,
        companyAddress: user.companyAddress,
        companySiret: user.companySiret,
        companyVat: user.companyVat,
        companyApe: user.companyApe,
        companyContact: user.companyContact
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Route pour modifier le mot de passe
  app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Vérifier l'ancien mot de passe
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }

      // Hash le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Mettre à jour le mot de passe
      await storage.updateUserPassword(req.user.userId, hashedNewPassword);

      res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Route pour mettre à jour le profil client
  app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
    try {
      const profileData = updateClientProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(req.user.userId, profileData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        clientType: updatedUser.clientType,
        companyName: updatedUser.companyName,
        companyAddress: updatedUser.companyAddress,
        companySiret: updatedUser.companySiret,
        companyVat: updatedUser.companyVat,
        companyApe: updatedUser.companyApe,
        companyContact: updatedUser.companyContact
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service non trouvé" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Bookings routes
  app.get("/api/bookings", authenticateToken, async (req: any, res) => {
    try {
      const bookings = await storage.getUserBookings(req.user.userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req: any, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking({
        ...bookingData,
        userId: req.user.userId,
      });
      res.status(201).json(booking);
    } catch (error) {
      res.status(400).json({ message: "Données de réservation invalides" });
    }
  });

  // Quotes routes
  app.get("/api/quotes", authenticateToken, async (req: any, res) => {
    try {
      const quotes = await storage.getUserQuotes(req.user.userId);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des devis" });
    }
  });

  app.post("/api/quotes", authenticateToken, async (req: any, res) => {
    try {
      const quoteData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote({
        ...quoteData,
        userId: req.user.userId,
      });
      res.status(201).json(quote);
    } catch (error) {
      res.status(400).json({ message: "Données de devis invalides" });
    }
  });

  app.post("/api/quotes/:id/accept", authenticateToken, async (req: any, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote || quote.userId !== req.user.userId) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }

      const updatedQuote = await storage.updateQuoteStatus(req.params.id, "accepted");
      
      // Create invoice when quote is accepted
      if (updatedQuote && updatedQuote.amount) {
        await storage.createInvoice({
          userId: req.user.userId,
          quoteId: updatedQuote.id,
          amount: updatedQuote.amount,
          description: `Facture pour devis #${updatedQuote.id}`,
          status: "unpaid",
        });
      }

      res.json(updatedQuote);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'acceptation du devis" });
    }
  });

  // Invoices routes
  app.get("/api/invoices", authenticateToken, async (req: any, res) => {
    try {
      const invoices = await storage.getUserInvoices(req.user.userId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des factures" });
    }
  });

  app.post("/api/invoices/:id/paid", authenticateToken, async (req: any, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice || invoice.userId !== req.user.userId) {
        return res.status(404).json({ message: "Facture non trouvée" });
      }

      const updatedInvoice = await storage.updateInvoiceStatus(req.params.id, "paid");
      res.json(updatedInvoice);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la facture" });
    }
  });

  // History route (combines quotes and invoices)
  app.get("/api/history", authenticateToken, async (req: any, res) => {
    try {
      const [bookings, quotes, invoices] = await Promise.all([
        storage.getUserBookings(req.user.userId),
        storage.getUserQuotes(req.user.userId),
        storage.getUserInvoices(req.user.userId),
      ]);

      res.json({
        bookings: bookings.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()),
        quotes: quotes.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()),
        invoices: invoices.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()),
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  app.post("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de la notification" });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.user.userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du comptage des notifications" });
    }
  });

  // Work Progress routes
  app.get("/api/work-progress/:bookingId", authenticateToken, async (req: any, res) => {
    try {
      const progress = await storage.getWorkProgressByBooking(req.params.bookingId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du suivi" });
    }
  });

  // ADMIN ROUTES
  app.get("/api/admin/dashboard", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const [bookings, quotes, invoices] = await Promise.all([
        storage.getAllBookings(),
        storage.getAllQuotes(),
        storage.getAllInvoices(),
      ]);

      const stats = {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        totalQuotes: quotes.length,
        pendingQuotes: quotes.filter(q => q.status === 'pending').length,
        totalInvoices: invoices.length,
        unpaidInvoices: invoices.filter(i => i.status === 'unpaid').length,
        totalRevenue: invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + parseFloat(i.amount), 0),
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/admin/bookings", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
    }
  });

  app.post("/api/admin/bookings/:id/status", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateBookingWithTracking(req.params.id, status, req.user.userId);
      
      // Create notification for user
      if (booking) {
        await storage.createNotification({
          userId: booking.userId,
          title: "Statut de réservation mis à jour",
          message: `Votre réservation est maintenant : ${status}`,
          type: "booking",
          relatedId: booking.id,
        });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.get("/api/admin/quotes", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const quotes = await storage.getAllQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Get quotes error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des devis" });
    }
  });

  app.post("/api/admin/quotes/:id/status", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { status, amount } = req.body;
      const updateData = { status, ...(amount && { amount }) };
      const quote = await storage.updateQuoteWithTracking(req.params.id, updateData, req.user.userId);
      
      // Create notification for user
      if (quote) {
        await storage.createNotification({
          userId: quote.userId,
          title: "Devis mis à jour",
          message: amount ? `Votre devis a été chiffré à ${amount}€` : `Statut du devis : ${status}`,
          type: "quote",
          relatedId: quote.id,
        });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du devis" });
    }
  });

  app.get("/api/admin/invoices", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      console.log(`Retrieved ${invoices.length} invoices for admin dashboard`);
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des factures" });
    }
  });

  app.post("/api/admin/invoices", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const invoiceData = {
        userId: req.body.userId,
        amount: req.body.amount,
        description: req.body.description,
        quoteId: req.body.quoteId || null,
      };
      
      const validatedData = insertInvoiceSchema.parse(invoiceData);
      const invoice = await storage.createInvoice(validatedData);
      
      // Create notification for user
      await storage.createNotification({
        userId: invoice.userId,
        title: "Nouvelle facture",
        message: `Une facture de ${invoice.amount}€ a été créée`,
        type: "invoice",
        relatedId: invoice.id,
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données de facture invalides", errors: error.errors });
      }
      res.status(400).json({ message: "Erreur lors de la création de la facture" });
    }
  });

  app.post("/api/admin/invoices/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la modification de la facture" });
    }
  });

  app.post("/api/admin/invoices/:id/status", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      const invoice = await storage.updateInvoiceWithTracking(req.params.id, { status }, req.user.userId);
      
      // Create notification for user
      if (invoice) {
        await storage.createNotification({
          userId: invoice.userId,
          title: "Statut de facture mis à jour",
          message: `Votre facture est maintenant : ${status}`,
          type: "invoice",
          relatedId: invoice.id,
        });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.delete("/api/admin/invoices/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.json({ message: "Facture supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la facture" });
    }
  });

  app.post("/api/admin/invoices/:id/notify", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { comment } = req.body;
      const invoice = await storage.getInvoice(req.params.id);
      
      if (invoice) {
        await storage.createNotification({
          userId: invoice.userId,
          title: "Message administrateur",
          message: comment || "L'administrateur a envoyé un message concernant votre facture",
          type: "invoice",
          relatedId: invoice.id,
        });
      }
      
      res.json({ message: "Notification envoyée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'envoi de la notification" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (error) {
      res.status(400).json({ message: "Erreur lors de la création de l'utilisateur" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.user.userId;
      
      // Prevent admin from deleting themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Vous ne pouvez pas vous supprimer vous-même" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" });
    }
  });

  // Dashboard stats
  app.get("/api/admin/dashboard", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const quotes = await storage.getAllQuotes();
      const invoices = await storage.getAllInvoices();
      
      const stats = {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === "pending").length,
        totalQuotes: quotes.length,
        pendingQuotes: quotes.filter(q => q.status === "pending").length,
        totalInvoices: invoices.length,
        unpaidInvoices: invoices.filter(i => i.status === "unpaid").length,
        totalRevenue: invoices
          .filter(i => i.status === "paid")
          .reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Work progress routes  
  app.get("/api/admin/work-progress", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const progress = await storage.getAllWorkProgress();
      res.json(progress);
    } catch (error) {
      console.error("Work progress error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du suivi des travaux" });
    }
  });

  app.post("/api/work-progress", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const progressData = insertWorkProgressSchema.parse({
        ...req.body,
        updatedBy: req.user.userId,
      });
      
      const progress = await storage.createWorkProgress(progressData);
      
      // Create notification for user
      await storage.createNotification({
        userId: progress.userId,
        title: "Mise à jour du suivi",
        message: progress.description,
        type: "work_progress",
        relatedId: progress.id,
      });
      
      res.status(201).json(progress);
    } catch (error) {
      res.status(400).json({ message: "Données de suivi invalides" });
    }
  });

  // Audit Logs Routes
  app.get("/api/admin/audit-logs", authenticateToken, requireAdminOrEmployee, async (req: any, res) => {
    try {
      const { userId, entityType, entityId } = req.query;
      const logs = await storage.getAuditLogs(entityType, entityId);
      
      // Filter by user if requested and not admin
      const user = await storage.getUser(req.user.userId);
      if (userId && user?.role !== "admin") {
        // Only allow employees to see their own logs
        const filteredLogs = logs.filter(log => log.userId === req.user.userId);
        res.json(filteredLogs);
      } else {
        res.json(logs);
      }
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des logs" });
    }
  });

  // Employee Assignment Routes
  app.post("/api/admin/assign-employee", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const assignmentData = insertBookingAssignmentSchema.parse(req.body);
      const assignment = await storage.assignEmployeeToBooking({
        ...assignmentData,
        assignedBy: req.user.userId,
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.userId,
        action: "assign_employee",
        entityType: "booking",
        entityId: assignmentData.bookingId,
        newValues: { employeeId: assignmentData.employeeId, notes: assignmentData.notes }
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Assign employee error:", error);
      res.status(400).json({ message: "Erreur lors de l'assignation" });
    }
  });

  app.get("/api/admin/employee-assignments/:employeeId", authenticateToken, requireAdminOrEmployee, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      
      // Check if user can access this data
      const user = await storage.getUser(req.user.userId);
      if (user?.role !== "admin" && req.user.userId !== employeeId) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      const assignments = await storage.getEmployeeAssignments(employeeId);
      res.json(assignments);
    } catch (error) {
      console.error("Get employee assignments error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des assignations" });
    }
  });

  // Employee Management Routes
  app.get("/api/admin/employees", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des employés" });
    }
  });

  // Object storage routes
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", authenticateToken, async (req: any, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", authenticateToken, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // PDF generation routes - moved outside admin path to avoid global auth
  app.get("/api/invoices/:id/pdf", async (req: any, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Facture non trouvée" });
      }

      const user = await storage.getUser(invoice.userId);
      const invoiceWithUser = { ...invoice, user };

      const pdfGenerator = new PDFGenerator();
      const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoiceWithUser);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.id.substring(0, 8)}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Erreur lors de la génération du PDF" });
    }
  });

  // Route pour génération PDF de devis
  app.get("/api/quotes/:id/pdf", authenticateToken, async (req: any, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }

      const user = await storage.getUser(quote.userId);
      const quoteWithUser = { ...quote, user };

      const pdfGenerator = new PDFGenerator();
      const pdfBuffer = await pdfGenerator.generateQuotePDF(quoteWithUser);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="devis-${quote.id.substring(0, 8)}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating quote PDF:", error);
      res.status(500).json({ message: "Erreur lors de la génération du PDF du devis" });
    }
  });

  // Send invoice by email
  app.get("/api/admin/invoices/:id/mobile-email-data", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Facture non trouvée" });
      }

      const user = await storage.getUser(invoice.userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "Email du client non disponible" });
      }

      // Return the data needed for mobile email
      res.json({
        clientEmail: user.email,
        clientName: user.name,
        description: invoice.description,
        amount: invoice.amount,
        invoiceId: invoice.id,
        pdfUrl: `/api/invoices/${invoice.id}/pdf`
      });
    } catch (error) {
      console.error("Error getting invoice mobile email data:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
  });

  app.post("/api/admin/invoices/:id/send-email", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Facture non trouvée" });
      }

      const user = await storage.getUser(invoice.userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "Email du client non disponible" });
      }

      const invoiceWithUser = { ...invoice, user };
      
      // Generate PDF
      const pdfGenerator = new PDFGenerator();
      const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoiceWithUser);
      
      // Send email
      const emailService = new EmailService();
      const emailSent = await emailService.sendInvoiceEmail(
        user.email,
        user.name,
        invoice.id,
        pdfBuffer
      );

      if (emailSent) {
        // Mark email as sent
        await storage.updateInvoice(invoice.id, { emailSent: true });
        res.json({ message: "Facture envoyée par email avec succès" });
      } else {
        res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
      }
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
    }
  });

  app.put("/api/admin/invoices/:id/photos", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { photosBefore, photosAfter, workDetails } = req.body;
      const objectStorageService = new ObjectStorageService();
      
      const updatedInvoice = await storage.updateInvoice(req.params.id, {
        photosBefore,
        photosAfter,
        workDetails,
      });
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice photos:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour des photos" });
    }
  });

  // Improved quote to invoice conversion
  // Create new quote from admin with client info
  app.post("/api/admin/quotes/create", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const quoteData = req.body;
      
      // First, check if user exists or create them
      let user = await storage.getUserByEmail(quoteData.clientEmail);
      
      if (!user) {
        // Create new user with provided info
        const hashedPassword = await bcrypt.hash("temp123", 10); // Temporary password
        const newUser = await storage.createUser({
          name: quoteData.clientName,
          email: quoteData.clientEmail,
          password: hashedPassword,
          phone: quoteData.clientPhone || "",
          address: quoteData.clientAddress || "",
          clientType: quoteData.clientType,
          companyName: quoteData.companyName,
          companyAddress: quoteData.companyAddress,
          companySiret: quoteData.companySiret,
          companyVat: quoteData.companyVat,
          companyApe: quoteData.companyApe,
          companyContact: quoteData.companyContact,
        });
        user = newUser;
      }

      // Create quote for this user
      const quote = await storage.createQuote({
        userId: user.id,
        vehicleBrand: quoteData.vehicleBrand,
        vehicleModel: quoteData.vehicleModel,
        vehicleYear: quoteData.vehicleYear,
        vehicleEngine: quoteData.vehicleEngine,
        description: quoteData.description,
        status: "pending",
        lastModifiedBy: req.user.userId,
      });

      // Create notification for the user
      await storage.createNotification({
        userId: user.id,
        title: "Nouveau devis créé",
        message: "Un devis a été créé pour votre véhicule. Vous recevrez une réponse prochainement.",
        type: "quote",
        relatedId: quote.id,
      });

      res.status(201).json({ quote, user });
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Erreur lors de la création du devis" });
    }
  });

  app.post("/api/admin/quotes/:id/convert-to-invoice", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }

      if (quote.status !== "approved") {
        return res.status(400).json({ message: "Le devis doit être validé avant conversion" });
      }

      if (!quote.amount) {
        return res.status(400).json({ message: "Le devis doit avoir un montant défini" });
      }

      const subtotal = (parseFloat(quote.amount) / 1.20).toFixed(2);
      const vatAmount = (parseFloat(quote.amount) - parseFloat(subtotal)).toFixed(2);

      const invoiceData = {
        userId: quote.userId,
        quoteId: quote.id,
        subtotal: subtotal,
        vatRate: "20.00",
        vatAmount: vatAmount,
        amount: quote.amount,
        description: `Facture générée depuis le devis ${quote.id.substring(0, 8)} - ${quote.description}`,
        workDetails: quote.description,
      };

      const invoice = await storage.createInvoice(invoiceData);
      
      // Update quote status
      await storage.updateQuote(quote.id, { status: "converted" });
      
      // Create notification
      await storage.createNotification({
        userId: quote.userId,
        title: "Facture générée",
        message: `Une facture a été générée à partir de votre devis. Montant: ${quote.amount}€`,
        type: "invoice",
        relatedId: invoice.id,
      });

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error converting quote to invoice:", error);
      res.status(500).json({ message: "Erreur lors de la conversion du devis" });
    }
  });

  // Create blank invoice route
  app.post("/api/admin/invoices", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { userId, amount, description, workDetails } = req.body;
      
      if (!userId || !amount || !description) {
        return res.status(400).json({ message: "Données manquantes" });
      }

      const subtotalAmount = parseFloat(amount);
      const vatAmount = subtotalAmount * 0.20;
      const totalAmount = subtotalAmount + vatAmount;

      const invoiceData = {
        userId,
        subtotal: subtotalAmount.toFixed(2),
        vatRate: "20.00", 
        vatAmount: vatAmount.toFixed(2),
        amount: totalAmount.toFixed(2),
        description,
        workDetails: workDetails || null,
      };

      const invoice = await storage.createInvoice(invoiceData);
      
      // Create notification
      await storage.createNotification({
        userId,
        title: "Nouvelle facture",
        message: `Une nouvelle facture a été créée pour un montant de ${totalAmount.toFixed(2)}€`,
        type: "invoice",
        relatedId: invoice.id,
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Erreur lors de la création de la facture" });
    }
  });

  // Routes pour la gestion des configurations de créneaux
  app.get("/api/admin/time-slot-configs", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const configs = await storage.getTimeSlotConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching time slot configs:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des configurations" });
    }
  });

  app.post("/api/admin/time-slot-configs", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const config = await storage.createTimeSlotConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error creating time slot config:", error);
      res.status(500).json({ message: "Erreur lors de la création de la configuration" });
    }
  });

  app.put("/api/admin/time-slot-configs/:date/:timeSlot", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { date, timeSlot } = req.params;
      const config = await storage.updateTimeSlotConfig(date, timeSlot, req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating time slot config:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la configuration" });
    }
  });

  app.get("/api/admin/calendar-data", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const allBookings = await storage.getBookings();
      const bookings = allBookings.filter(booking => {
        const bookingDate = booking.date;
        return (!startDate || bookingDate >= startDate) && 
               (!endDate || bookingDate <= endDate);
      });
      
      const configs = await storage.getTimeSlotConfigs();
      
      res.json({
        bookings,
        configs,
      });
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des données du calendrier" });
    }
  });

  // Google Calendar OAuth routes
  app.get("/api/google/auth", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { GoogleCalendarService } = await import('./googleCalendar');
      const calendarService = new GoogleCalendarService();
      const authUrl = calendarService.generateAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ message: "Erreur lors de la génération de l'URL d'authentification" });
    }
  });

  app.get("/api/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: "Code d'autorisation manquant" });
      }

      const { GoogleCalendarService } = await import('./googleCalendar');
      const calendarService = new GoogleCalendarService();
      const tokens = await calendarService.getTokens(code as string);
      
      // Store tokens in admin settings (in a real app, you'd store this per user)
      await storage.updateAdminSettings({
        googleCalendarTokens: JSON.stringify(tokens)
      });

      // Redirect to admin calendar with success message
      res.redirect('/admin/calendar?sync=success');
    } catch (error) {
      console.error("Error handling Google callback:", error);
      res.redirect('/admin/calendar?sync=error');
    }
  });

  app.post("/api/google/sync-booking", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { bookingId } = req.body;
      
      // Get admin settings to retrieve Google tokens
      const settings = await storage.getAdminSettings();
      const tokens = settings?.googleCalendarTokens ? JSON.parse(settings.googleCalendarTokens) : null;
      
      if (!tokens) {
        return res.status(400).json({ message: "Google Calendar non configuré" });
      }

      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Réservation non trouvée" });
      }

      const user = await storage.getUser(booking.userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const { GoogleCalendarService } = await import('./googleCalendar');
      const calendarService = new GoogleCalendarService();
      calendarService.setCredentials(tokens);

      // Create calendar event
      const calendarEvent = await calendarService.createBookingEvent(
        booking,
        user.email,
        user.name
      );

      // Store calendar event ID in booking
      await storage.updateBookingWithTracking(bookingId, {
        googleCalendarEventId: calendarEvent.id
      }, req.user.userId);

      res.json({ 
        message: "Réservation synchronisée avec Google Calendar",
        eventId: calendarEvent.id,
        eventUrl: calendarEvent.htmlLink
      });
    } catch (error) {
      console.error("Error syncing booking with Google Calendar:", error);
      res.status(500).json({ message: "Erreur lors de la synchronisation" });
    }
  });

  app.get("/api/google/status", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      const isConnected = !!(settings?.googleCalendarTokens);
      
      res.json({ 
        connected: isConnected,
        message: isConnected ? "Google Calendar connecté" : "Google Calendar non connecté"
      });
    } catch (error) {
      console.error("Error checking Google Calendar status:", error);
      res.status(500).json({ message: "Erreur lors de la vérification du statut" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
