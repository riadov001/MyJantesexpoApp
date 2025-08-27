import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookingSchema, insertQuoteSchema, insertNotificationSchema, insertWorkProgressSchema, loginSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
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
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des factures" });
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

  const httpServer = createServer(app);
  return httpServer;
}
