import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { google } from 'googleapis';
import { insertClientSchema, insertProjectSchema, insertQuoteSchema, insertServiceOrderSchema, insertStaffSchema, insertActivitySchema, insertSubcontractorSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Client routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      
      // Create activity for client creation
      await storage.createActivity({
        type: "client_created",
        description: `New client ${client.name} added`,
        userId: req.user.id,
        clientId: client.id,
        projectId: null
      });
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(id, clientData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create activity for client update
      await storage.createActivity({
        type: "client_updated",
        description: `Client ${updatedClient.name} updated`,
        userId: req.user.id,
        clientId: updatedClient.id,
        projectId: null
      });
      
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const deleted = await storage.deleteClient(id);
      
      if (deleted) {
        // Create activity for client deletion
        await storage.createActivity({
          type: "client_deleted",
          description: `Client ${client.name} deleted`,
          userId: req.user.id,
          clientId: id,
          projectId: null
        });
        
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete client" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      let projects;
      
      if (req.query.status) {
        projects = await storage.getProjectsByStatus(req.query.status as string);
      } else if (req.query.clientId) {
        projects = await storage.getProjectsByClient(parseInt(req.query.clientId as string));
      } else {
        projects = await storage.getProjects();
      }
      
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      
      // Create activity for project creation
      await storage.createActivity({
        type: "project_created",
        description: `New project "${project.title}" created`,
        userId: req.user.id,
        projectId: project.id,
        clientId: project.clientId
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, projectData);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Create activity for project update
      await storage.createActivity({
        type: "project_updated",
        description: `Project "${updatedProject.title}" updated`,
        userId: req.user.id,
        projectId: updatedProject.id,
        clientId: updatedProject.clientId
      });
      
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const deleted = await storage.deleteProject(id);
      
      if (deleted) {
        // Create activity for project deletion
        await storage.createActivity({
          type: "project_deleted",
          description: `Project "${project.title}" deleted`,
          userId: req.user.id,
          projectId: id,
          clientId: project.clientId
        });
        
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete project" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Quote routes
  app.get("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const quote = await storage.getQuote(parseInt(req.params.id));
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:projectId/quote", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const quote = await storage.getQuoteByProject(projectId);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found for project" });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      try {
        const quoteData = insertQuoteSchema.parse(req.body);
        const quote = await storage.createQuote(quoteData);
        
        // Get the project for the activity
        const project = await storage.getProject(quote.projectId);
        
        // Create activity for quote creation
        await storage.createActivity({
          type: "quote_created",
          description: `New quote created for project "${project?.title || 'Unknown'}"`,
          userId: req.user.id,
          projectId: quote.projectId,
          clientId: project?.clientId
        });
        
        // Si la cotización se crea con estado "sent", actualizar estado del proyecto
        if (quote.status === "sent") {
          await storage.updateProject(quote.projectId, {
            status: "quoted"
          });
          
          // Crear actividad para envío de cotización
          await storage.createActivity({
            type: "quote_sent",
            description: `Quote for project "${project?.title || 'Unknown'}" has been sent to client`,
            userId: req.user.id,
            projectId: quote.projectId,
            clientId: project?.clientId
          });
        }
        
        res.status(201).json(quote);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error("Validation error:", JSON.stringify(validationError.errors, null, 2));
          return res.status(400).json({ message: "Invalid quote data", errors: validationError.errors });
        }
        throw validationError; // Re-throw if it's not a ZodError
      }
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quoteData = insertQuoteSchema.partial().parse(req.body);
      const updatedQuote = await storage.updateQuote(id, quoteData);
      
      if (!updatedQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      // Get the project for the activity
      const project = await storage.getProject(updatedQuote.projectId);
      
      // Actualizamos el estado del proyecto según el estado de la cotización
      if (quoteData.status === "approved") {
        await storage.updateProject(updatedQuote.projectId, {
          status: "approved",
        });
        
        // Registramos actividad específica de aprobación
        await storage.createActivity({
          type: "quote_approved",
          description: `Quote for project "${project?.title || 'Unknown'}" has been approved`,
          userId: req.user.id,
          projectId: updatedQuote.projectId,
          clientId: project?.clientId
        });
      } else if (quoteData.status === "rejected") {
        // Registramos actividad específica de rechazo
        await storage.createActivity({
          type: "quote_rejected",
          description: `Quote for project "${project?.title || 'Unknown'}" has been rejected`,
          userId: req.user.id,
          projectId: updatedQuote.projectId,
          clientId: project?.clientId
        });
      } else if (quoteData.status === "sent") {
        // Si la cotización fue enviada, actualizamos el estado del proyecto a "quoted"
        await storage.updateProject(updatedQuote.projectId, {
          status: "quoted",
        });
        
        // Registramos actividad específica de envío de cotización
        await storage.createActivity({
          type: "quote_sent",
          description: `Quote for project "${project?.title || 'Unknown'}" has been sent to client`,
          userId: req.user.id,
          projectId: updatedQuote.projectId,
          clientId: project?.clientId
        });
      } else {
        // Create general activity for quote update
        await storage.createActivity({
          type: "quote_updated",
          description: `Quote updated for project "${project?.title || 'Unknown'}"`,
          userId: req.user.id,
          projectId: updatedQuote.projectId,
          clientId: project?.clientId
        });
      }
      
      res.json(updatedQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Service Order routes
  app.get("/api/service-orders", isAuthenticated, async (req, res) => {
    try {
      let serviceOrders;
      
      if (req.query.projectId) {
        serviceOrders = await storage.getServiceOrdersByProject(parseInt(req.query.projectId as string));
      } else {
        serviceOrders = await storage.getServiceOrders();
      }
      
      res.json(serviceOrders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/service-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const serviceOrder = await storage.getServiceOrder(parseInt(req.params.id));
      if (!serviceOrder) {
        return res.status(404).json({ message: "Service order not found" });
      }
      res.json(serviceOrder);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/service-orders", isAuthenticated, async (req, res) => {
    try {
      const serviceOrderData = insertServiceOrderSchema.parse(req.body);
      const serviceOrder = await storage.createServiceOrder(serviceOrderData);
      
      // Get project for activity
      const project = await storage.getProject(serviceOrder.projectId);
      
      // Create activity for service order creation
      await storage.createActivity({
        type: "service_order_created",
        description: `New service order created for project "${project?.title || 'Unknown'}"`,
        userId: req.user.id,
        projectId: serviceOrder.projectId,
        clientId: project?.clientId
      });
      
      res.status(201).json(serviceOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service order data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/service-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceOrderData = insertServiceOrderSchema.partial().parse(req.body);
      const updatedServiceOrder = await storage.updateServiceOrder(id, serviceOrderData);
      
      if (!updatedServiceOrder) {
        return res.status(404).json({ message: "Service order not found" });
      }
      
      // Get project for activity
      const project = await storage.getProject(updatedServiceOrder.projectId);
      
      // Create activity for service order update
      await storage.createActivity({
        type: "service_order_updated",
        description: `Service order updated for project "${project?.title || 'Unknown'}"`,
        userId: req.user.id,
        projectId: updatedServiceOrder.projectId,
        clientId: project?.clientId
      });
      
      res.json(updatedServiceOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service order data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Staff routes
  app.get("/api/staff", isAuthenticated, async (req, res) => {
    try {
      const staffMembers = await storage.getStaff();
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/staff/:id", isAuthenticated, async (req, res) => {
    try {
      const staffMember = await storage.getStaffMember(parseInt(req.params.id));
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staffMember);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/staff", isAuthenticated, async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      const staffMember = await storage.createStaffMember(staffData);
      
      // Create activity for staff creation
      await storage.createActivity({
        type: "staff_created",
        description: `New staff member ${staffMember.name} added`,
        userId: req.user.id,
        projectId: null,
        clientId: null
      });
      
      res.status(201).json(staffMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid staff data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/staff/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffData = insertStaffSchema.partial().parse(req.body);
      const updatedStaffMember = await storage.updateStaffMember(id, staffData);
      
      if (!updatedStaffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      // Create activity for staff update
      await storage.createActivity({
        type: "staff_updated",
        description: `Staff member ${updatedStaffMember.name} updated`,
        userId: req.user.id,
        projectId: null,
        clientId: null
      });
      
      res.json(updatedStaffMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid staff data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      let activities;
      
      if (req.query.projectId) {
        activities = await storage.getActivitiesByProject(parseInt(req.query.projectId as string));
      } else if (req.query.clientId) {
        activities = await storage.getActivitiesByClient(parseInt(req.query.clientId as string));
      } else if (req.query.userId) {
        activities = await storage.getActivitiesByUser(parseInt(req.query.userId as string));
      } else {
        activities = await storage.getActivities();
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const activity = await storage.getActivity(parseInt(req.params.id));
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Subcontractor routes
  app.get("/api/subcontractors", isAuthenticated, async (req, res) => {
    try {
      const subcontractors = await storage.getSubcontractors();
      res.json(subcontractors);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subcontractors/:id", isAuthenticated, async (req, res) => {
    try {
      const subcontractor = await storage.getSubcontractor(parseInt(req.params.id));
      if (!subcontractor) {
        return res.status(404).json({ message: "Subcontractor not found" });
      }
      res.json(subcontractor);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subcontractors", isAuthenticated, async (req, res) => {
    try {
      const subcontractorData = insertSubcontractorSchema.parse(req.body);
      const subcontractor = await storage.createSubcontractor(subcontractorData);
      
      // Create activity for subcontractor creation
      await storage.createActivity({
        type: "subcontractor_created",
        description: `New subcontractor ${subcontractor.name} added`,
        userId: req.user.id,
        projectId: null,
        clientId: null
      });
      
      res.status(201).json(subcontractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subcontractor data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/subcontractors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subcontractorData = insertSubcontractorSchema.partial().parse(req.body);
      const updatedSubcontractor = await storage.updateSubcontractor(id, subcontractorData);
      
      if (!updatedSubcontractor) {
        return res.status(404).json({ message: "Subcontractor not found" });
      }
      
      // Create activity for subcontractor update
      await storage.createActivity({
        type: "subcontractor_updated",
        description: `Subcontractor ${updatedSubcontractor.name} updated`,
        userId: req.user.id,
        projectId: null,
        clientId: null
      });
      
      res.json(updatedSubcontractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subcontractor data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/subcontractors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First get the subcontractor info
      const subcontractor = await storage.getSubcontractor(id);
      
      if (!subcontractor) {
        return res.status(404).json({ message: "Subcontractor not found" });
      }
      
      // Delete the subcontractor
      const deleted = await storage.deleteSubcontractor(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete subcontractor" });
      }
      
      // Create activity for subcontractor deletion
      await storage.createActivity({
        type: "subcontractor_deleted",
        description: `Subcontractor ${subcontractor.name} deleted`,
        userId: req.user.id,
        projectId: null,
        clientId: null
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      let invoices;
      
      if (req.query.status) {
        invoices = await storage.getInvoicesByStatus(req.query.status as string);
      } else if (req.query.clientId) {
        invoices = await storage.getInvoicesByClient(parseInt(req.query.clientId as string));
      } else if (req.query.projectId) {
        invoices = await storage.getInvoicesByProject(parseInt(req.query.projectId as string));
      } else {
        invoices = await storage.getInvoices();
      }
      
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      // Create a unique invoice number
      const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const invoiceNumber = `INV-${formattedDate}-${randomStr}`;
      
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        invoiceNumber
      });
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // Get the project and client for the activity
      const project = await storage.getProject(invoice.projectId);
      const client = await storage.getClient(invoice.clientId);
      
      // Create activity for invoice creation
      await storage.createActivity({
        type: "invoice_created",
        description: `New invoice ${invoice.invoiceNumber} created for project "${project?.title || 'Unknown'}"`,
        userId: req.user.id,
        projectId: invoice.projectId,
        clientId: invoice.clientId
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const updatedInvoice = await storage.updateInvoice(id, invoiceData);
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Create activity for invoice update
      await storage.createActivity({
        type: "invoice_updated",
        description: `Invoice ${updatedInvoice.invoiceNumber} updated`,
        userId: req.user.id,
        projectId: updatedInvoice.projectId,
        clientId: updatedInvoice.clientId
      });
      
      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const deleted = await storage.deleteInvoice(id);
      
      if (deleted) {
        // Create activity for invoice deletion
        await storage.createActivity({
          type: "invoice_deleted",
          description: `Invoice ${invoice.invoiceNumber} deleted`,
          userId: req.user.id,
          projectId: invoice.projectId,
          clientId: invoice.clientId
        });
        
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete invoice" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create Stripe payment intent for invoices
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Stripe secret key not configured" });
      }

      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      
      const { amount, invoiceId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents for Stripe
        currency: "usd",
        metadata: {
          invoiceId: invoiceId || null,
        },
      });
      
      // If we have an invoice ID, update the invoice with the payment intent ID
      if (invoiceId) {
        const invoice = await storage.getInvoice(parseInt(invoiceId));
        if (invoice) {
          await storage.updateInvoice(invoice.id, {
            stripePaymentIntentId: paymentIntent.id
          });
        }
      }
      
      // Create activity
      await storage.createActivity({
        type: "payment_intent_created",
        description: `Payment intent created for $${(amount).toFixed(2)}`,
        userId: req.user.id,
        projectId: null,
        clientId: null
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Google Calendar routes
  app.post("/api/google/auth", isAuthenticated, async (req, res) => {
    try {
      // In a real application, this would initiate the OAuth 2.0 flow
      // For demonstration purposes, we'll simulate a successful authentication
      
      // Get Google credentials and create an OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      
      // Generate a URL for the user to authorize the app
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
      });
      
      // In a real application, you would redirect the user to the authUrl
      // For our simulation, we'll just return the URL
      res.json({ success: true, url: authUrl });
    } catch (error) {
      console.error('Google Auth Error:', error);
      res.status(500).json({ message: "Google Calendar authentication failed" });
    }
  });
  
  app.get("/api/google/callback", isAuthenticated, async (req, res) => {
    try {
      // This would be the callback endpoint for the OAuth flow
      // The code would be exchanged for tokens here
      
      // In a real application, store the tokens in the user's session or database
      res.redirect('/calendar');
    } catch (error) {
      console.error('Google Callback Error:', error);
      res.status(500).json({ message: "Google Calendar authorization failed" });
    }
  });
  
  app.get("/api/google/events", isAuthenticated, async (req, res) => {
    try {
      // In a real application, retrieve the user's tokens and create a new auth client
      // For our simulation, we'll return sample events
      
      // Example of how to use the Google Calendar API
      /*
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials(tokens);
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      const events = response.data.items;
      res.json(events);
      */
      
      // For simulation, return sample events
      const sampleEvents = [
        {
          id: 'google-event-1',
          summary: 'Client Meeting',
          start: { dateTime: new Date().toISOString() },
          end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
          location: 'Client Office',
          description: 'Discuss project requirements',
        },
        {
          id: 'google-event-2',
          summary: 'Site Visit',
          start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
          end: { dateTime: new Date(Date.now() + 86400000 + 7200000).toISOString() },
          location: 'Project Site',
          description: 'Inspect the site and take measurements',
        }
      ];
      
      res.json(sampleEvents);
    } catch (error) {
      console.error('Google Events Error:', error);
      res.status(500).json({ message: "Failed to fetch Google Calendar events" });
    }
  });
  
  app.post("/api/google/events", isAuthenticated, async (req, res) => {
    try {
      // In a real application, this would create an event in Google Calendar
      // For our simulation, we'll just return the event data
      
      // Example of creating an event
      /*
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials(tokens);
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const event = {
        summary: req.body.title,
        description: req.body.description,
        start: {
          dateTime: req.body.start,
          timeZone: 'America/Los_Angeles',
        },
        end: {
          dateTime: req.body.end,
          timeZone: 'America/Los_Angeles',
        },
        location: req.body.location,
      };
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      
      res.json(response.data);
      */
      
      // For simulation
      const event = {
        id: `google-event-${Date.now()}`,
        summary: req.body.title,
        description: req.body.description,
        start: { dateTime: req.body.start },
        end: { dateTime: req.body.end },
        location: req.body.location,
        status: 'confirmed'
      };
      
      // Create activity log
      await storage.createActivity({
        type: "google_event_created",
        description: `Google Calendar event "${req.body.title}" created`,
        userId: req.user.id,
        projectId: req.body.projectId || null,
        clientId: null
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error('Google Create Event Error:', error);
      res.status(500).json({ message: "Failed to create Google Calendar event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
