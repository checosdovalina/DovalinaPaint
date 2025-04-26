import { users, type User, type InsertUser, InsertClient, Client, clients, Project, projects, InsertProject, Quote, quotes, InsertQuote, ServiceOrder, serviceOrders, InsertServiceOrder, Staff, staff, InsertStaff, Activity, activities, InsertActivity } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client methods
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Project methods
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Quote methods
  getQuotes(): Promise<Quote[]>;
  getQuote(id: number): Promise<Quote | undefined>;
  getQuoteByProject(projectId: number): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
  
  // Service Order methods
  getServiceOrders(): Promise<ServiceOrder[]>;
  getServiceOrder(id: number): Promise<ServiceOrder | undefined>;
  getServiceOrdersByProject(projectId: number): Promise<ServiceOrder[]>;
  createServiceOrder(serviceOrder: InsertServiceOrder): Promise<ServiceOrder>;
  updateServiceOrder(id: number, serviceOrder: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined>;
  deleteServiceOrder(id: number): Promise<boolean>;
  
  // Staff methods
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: number): Promise<Staff | undefined>;
  createStaffMember(staff: InsertStaff): Promise<Staff>;
  updateStaffMember(id: number, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaffMember(id: number): Promise<boolean>;
  
  // Activity methods
  getActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByProject(projectId: number): Promise<Activity[]>;
  getActivitiesByClient(clientId: number): Promise<Activity[]>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Initialize admin user if needed (will run on startup)
    this.initializeAdminUser();
  }
  
  private async initializeAdminUser() {
    try {
      // Check if we have any users in the system
      const existingUsers = await db.select().from(users);
      
      if (existingUsers.length === 0) {
        // For simplicity, we'll create a manual hash for the password "password123"
        // Using the same format as in the hashPassword function: hash.salt
        // This is equivalent to await hashPassword("password123")
        const hashedPassword = "fc92f0e017aecb11d5fce8693166416f765c76afbf1cad72c9d879e7b73f3959a7a57ef2ebc3f7ceda684c9d998a07c141170dd39b230095b5ff53890a87c620.c23cd42c3e4f2b21c3dbd65e";
        
        // Create default admin users with the required usernames and passwords
        await this.createUser({
          username: "sdovalina",
          password: hashedPassword,
          name: "Santiago Dovalina",
          role: "superadmin"
        });
        
        await this.createUser({
          username: "alexdovalina",
          password: hashedPassword,
          name: "Alex Dovalina",
          role: "admin"
        });
        
        await this.createUser({
          username: "dianashindledecker",
          password: hashedPassword,
          name: "Diana Shindledecker",
          role: "admin"
        });
        
        await this.createUser({
          username: "davidshindledecker",
          password: hashedPassword,
          name: "David Shindledecker",
          role: "admin"
        });
        
        console.log("Created all admin users");
        
        // Add some initial staff members
        await this.initializeSampleStaff();
      }
    } catch (error) {
      console.error("Error initializing admin users:", error);
    }
  }
  
  // Initialize sample staff members if needed
  private async initializeSampleStaff() {
    try {
      const existingStaff = await this.getStaff();
      
      if (existingStaff.length === 0) {
        await this.createStaffMember({
          name: "Alex Dovalina",
          role: "Painter",
          email: "alex@dovalinapainting.com",
          phone: "555-1234",
          availability: "available",
          skills: ["interior", "exterior"],
          avatar: "/worker1.svg"
        });
        
        await this.createStaffMember({
          name: "Diana Shindledecker",
          role: "Project Manager",
          email: "diana@dovalinapainting.com",
          phone: "555-5678",
          availability: "available",
          skills: ["management", "client relations"],
          avatar: "/worker2.svg"
        });
        
        await this.createStaffMember({
          name: "David Shindledecker",
          role: "Painter",
          email: "david@dovalinapainting.com",
          phone: "555-9012",
          availability: "available",
          skills: ["commercial", "industrial"],
          avatar: "/worker3.svg"
        });
        
        console.log("Created sample staff members");
      }
    } catch (error) {
      console.error("Error initializing sample staff:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  // Client methods
  async getClients(): Promise<Client[]> {
    try {
      return await db.select().from(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    try {
      const [client] = await db.select().from(clients).where(eq(clients.id, id));
      return client;
    } catch (error) {
      console.error("Error fetching client:", error);
      return undefined;
    }
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    try {
      const [newClient] = await db.insert(clients).values(client).returning();
      return newClient;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }
  
  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    try {
      const [updatedClient] = await db
        .update(clients)
        .set(client)
        .where(eq(clients.id, id))
        .returning();
      return updatedClient;
    } catch (error) {
      console.error("Error updating client:", error);
      return undefined;
    }
  }
  
  async deleteClient(id: number): Promise<boolean> {
    try {
      const result = await db.delete(clients).where(eq(clients.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      return false;
    }
  }
  
  // Project methods
  async getProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, id));
      return project;
    } catch (error) {
      console.error("Error fetching project:", error);
      return undefined;
    }
  }
  
  async getProjectsByClient(clientId: number): Promise<Project[]> {
    try {
      return await db.select().from(projects).where(eq(projects.clientId, clientId));
    } catch (error) {
      console.error("Error fetching projects by client:", error);
      return [];
    }
  }
  
  async getProjectsByStatus(status: string): Promise<Project[]> {
    try {
      return await db.select().from(projects).where(eq(projects.status, status));
    } catch (error) {
      console.error("Error fetching projects by status:", error);
      return [];
    }
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    try {
      const [newProject] = await db.insert(projects).values(project).returning();
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }
  
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    try {
      const [updatedProject] = await db
        .update(projects)
        .set(project)
        .where(eq(projects.id, id))
        .returning();
      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      return undefined;
    }
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      await db.delete(projects).where(eq(projects.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      return false;
    }
  }
  
  // Quote methods
  async getQuotes(): Promise<Quote[]> {
    try {
      return await db.select().from(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      return [];
    }
  }
  
  async getQuote(id: number): Promise<Quote | undefined> {
    try {
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
      return quote;
    } catch (error) {
      console.error("Error fetching quote:", error);
      return undefined;
    }
  }
  
  async getQuoteByProject(projectId: number): Promise<Quote | undefined> {
    try {
      const [quote] = await db.select().from(quotes).where(eq(quotes.projectId, projectId));
      return quote;
    } catch (error) {
      console.error("Error fetching quote by project:", error);
      return undefined;
    }
  }
  
  async createQuote(quote: InsertQuote): Promise<Quote> {
    try {
      const [newQuote] = await db.insert(quotes).values(quote).returning();
      return newQuote;
    } catch (error) {
      console.error("Error creating quote:", error);
      throw error;
    }
  }
  
  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    try {
      const [updatedQuote] = await db
        .update(quotes)
        .set(quote)
        .where(eq(quotes.id, id))
        .returning();
      return updatedQuote;
    } catch (error) {
      console.error("Error updating quote:", error);
      return undefined;
    }
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    try {
      await db.delete(quotes).where(eq(quotes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting quote:", error);
      return false;
    }
  }
  
  // Service Order methods
  async getServiceOrders(): Promise<ServiceOrder[]> {
    try {
      return await db.select().from(serviceOrders);
    } catch (error) {
      console.error("Error fetching service orders:", error);
      return [];
    }
  }
  
  async getServiceOrder(id: number): Promise<ServiceOrder | undefined> {
    try {
      const [serviceOrder] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
      return serviceOrder;
    } catch (error) {
      console.error("Error fetching service order:", error);
      return undefined;
    }
  }
  
  async getServiceOrdersByProject(projectId: number): Promise<ServiceOrder[]> {
    try {
      return await db.select().from(serviceOrders).where(eq(serviceOrders.projectId, projectId));
    } catch (error) {
      console.error("Error fetching service orders by project:", error);
      return [];
    }
  }
  
  async createServiceOrder(serviceOrder: InsertServiceOrder): Promise<ServiceOrder> {
    try {
      const [newServiceOrder] = await db.insert(serviceOrders).values(serviceOrder).returning();
      return newServiceOrder;
    } catch (error) {
      console.error("Error creating service order:", error);
      throw error;
    }
  }
  
  async updateServiceOrder(id: number, serviceOrder: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined> {
    try {
      const [updatedServiceOrder] = await db
        .update(serviceOrders)
        .set(serviceOrder)
        .where(eq(serviceOrders.id, id))
        .returning();
      return updatedServiceOrder;
    } catch (error) {
      console.error("Error updating service order:", error);
      return undefined;
    }
  }
  
  async deleteServiceOrder(id: number): Promise<boolean> {
    try {
      await db.delete(serviceOrders).where(eq(serviceOrders.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting service order:", error);
      return false;
    }
  }
  
  // Staff methods
  async getStaff(): Promise<Staff[]> {
    try {
      return await db.select().from(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      return [];
    }
  }
  
  async getStaffMember(id: number): Promise<Staff | undefined> {
    try {
      const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
      return staffMember;
    } catch (error) {
      console.error("Error fetching staff member:", error);
      return undefined;
    }
  }
  
  async createStaffMember(staffMember: InsertStaff): Promise<Staff> {
    try {
      const [newStaffMember] = await db.insert(staff).values(staffMember).returning();
      return newStaffMember;
    } catch (error) {
      console.error("Error creating staff member:", error);
      throw error;
    }
  }
  
  async updateStaffMember(id: number, staffMember: Partial<InsertStaff>): Promise<Staff | undefined> {
    try {
      const [updatedStaffMember] = await db
        .update(staff)
        .set(staffMember)
        .where(eq(staff.id, id))
        .returning();
      return updatedStaffMember;
    } catch (error) {
      console.error("Error updating staff member:", error);
      return undefined;
    }
  }
  
  async deleteStaffMember(id: number): Promise<boolean> {
    try {
      await db.delete(staff).where(eq(staff.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting staff member:", error);
      return false;
    }
  }
  
  // Activity methods
  async getActivities(): Promise<Activity[]> {
    try {
      return await db.select().from(activities).orderBy(desc(activities.createdAt));
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    try {
      const [activity] = await db.select().from(activities).where(eq(activities.id, id));
      return activity;
    } catch (error) {
      console.error("Error fetching activity:", error);
      return undefined;
    }
  }
  
  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    try {
      return await db
        .select()
        .from(activities)
        .where(eq(activities.projectId, projectId))
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      console.error("Error fetching activities by project:", error);
      return [];
    }
  }
  
  async getActivitiesByClient(clientId: number): Promise<Activity[]> {
    try {
      return await db
        .select()
        .from(activities)
        .where(eq(activities.clientId, clientId))
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      console.error("Error fetching activities by client:", error);
      return [];
    }
  }
  
  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    try {
      return await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      console.error("Error fetching activities by user:", error);
      return [];
    }
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    try {
      const [newActivity] = await db.insert(activities).values(activity).returning();
      return newActivity;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }
}

export class MemStorage implements IStorage {
  // This class is kept for compatibility but is no longer used
  private users: Map<number, User> = new Map();
  private clients: Map<number, Client> = new Map();
  private projects: Map<number, Project> = new Map();
  private quotes: Map<number, Quote> = new Map();
  private serviceOrders: Map<number, ServiceOrder> = new Map();
  private staffMembers: Map<number, Staff> = new Map();
  private activitiesLog: Map<number, Activity> = new Map();
  
  sessionStore: any;
  
  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }
  
  async getUser(id: number): Promise<User | undefined> { return undefined; }
  async getUserByUsername(username: string): Promise<User | undefined> { return undefined; }
  async createUser(user: InsertUser): Promise<User> { throw new Error("Not implemented"); }
  async getClients(): Promise<Client[]> { return []; }
  async getClient(id: number): Promise<Client | undefined> { return undefined; }
  async createClient(client: InsertClient): Promise<Client> { throw new Error("Not implemented"); }
  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> { return undefined; }
  async deleteClient(id: number): Promise<boolean> { return false; }
  async getProjects(): Promise<Project[]> { return []; }
  async getProject(id: number): Promise<Project | undefined> { return undefined; }
  async getProjectsByClient(clientId: number): Promise<Project[]> { return []; }
  async getProjectsByStatus(status: string): Promise<Project[]> { return []; }
  async createProject(project: InsertProject): Promise<Project> { throw new Error("Not implemented"); }
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> { return undefined; }
  async deleteProject(id: number): Promise<boolean> { return false; }
  async getQuotes(): Promise<Quote[]> { return []; }
  async getQuote(id: number): Promise<Quote | undefined> { return undefined; }
  async getQuoteByProject(projectId: number): Promise<Quote | undefined> { return undefined; }
  async createQuote(quote: InsertQuote): Promise<Quote> { throw new Error("Not implemented"); }
  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined> { return undefined; }
  async deleteQuote(id: number): Promise<boolean> { return false; }
  async getServiceOrders(): Promise<ServiceOrder[]> { return []; }
  async getServiceOrder(id: number): Promise<ServiceOrder | undefined> { return undefined; }
  async getServiceOrdersByProject(projectId: number): Promise<ServiceOrder[]> { return []; }
  async createServiceOrder(serviceOrder: InsertServiceOrder): Promise<ServiceOrder> { throw new Error("Not implemented"); }
  async updateServiceOrder(id: number, serviceOrder: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined> { return undefined; }
  async deleteServiceOrder(id: number): Promise<boolean> { return false; }
  async getStaff(): Promise<Staff[]> { return []; }
  async getStaffMember(id: number): Promise<Staff | undefined> { return undefined; }
  async createStaffMember(staff: InsertStaff): Promise<Staff> { throw new Error("Not implemented"); }
  async updateStaffMember(id: number, staff: Partial<InsertStaff>): Promise<Staff | undefined> { return undefined; }
  async deleteStaffMember(id: number): Promise<boolean> { return false; }
  async getActivities(): Promise<Activity[]> { return []; }
  async getActivity(id: number): Promise<Activity | undefined> { return undefined; }
  async getActivitiesByProject(projectId: number): Promise<Activity[]> { return []; }
  async getActivitiesByClient(clientId: number): Promise<Activity[]> { return []; }
  async getActivitiesByUser(userId: number): Promise<Activity[]> { return []; }
  async createActivity(activity: InsertActivity): Promise<Activity> { throw new Error("Not implemented"); }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
