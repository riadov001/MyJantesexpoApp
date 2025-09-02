import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookingSchema, insertQuoteSchema, insertInvoiceSchema, insertNotificationSchema, insertWorkProgressSchema, loginSchema } from "@shared/schema";
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

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      
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
        phone: user.phone 
      });
    } catch (error) {
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
      const [quotes, invoices] = await Promise.all([
        storage.getUserQuotes(req.user.userId),
        storage.getUserInvoices(req.user.userId),
      ]);

      res.json({
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
      const booking = await storage.updateBookingStatus(req.params.id, status);
      
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
      const quote = await storage.updateQuoteStatus(req.params.id, status, amount);
      
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
      const invoice = await storage.updateInvoiceStatus(req.params.id, status);
      
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

  // PDF generation routes
  app.get("/api/admin/invoices/:id/pdf", authenticateToken, requireAdmin, async (req: any, res) => {
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

  // Send invoice by email
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

  const httpServer = createServer(app);
  return httpServer;
}
