CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"user_id" integer,
	"project_id" integer,
	"client_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"classification" text DEFAULT 'residential' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"service_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"progress" integer DEFAULT 0,
	"start_date" timestamp,
	"due_date" timestamp,
	"completed_date" timestamp,
	"total_cost" integer,
	"assigned_staff" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"images" jsonb
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"materials_estimate" jsonb,
	"labor_estimate" jsonb,
	"total_estimate" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_date" timestamp,
	"valid_until" timestamp,
	"approved_date" timestamp,
	"rejected_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"details" text NOT NULL,
	"assigned_staff" jsonb,
	"assigned_subcontractors" jsonb,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"before_images" jsonb,
	"after_images" jsonb,
	"client_signature" text,
	"signature_date" timestamp,
	"language" text DEFAULT 'english' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"availability" text DEFAULT 'available' NOT NULL,
	"skills" jsonb,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcontractors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"specialty" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"address" text,
	"tax_id" text,
	"insurance_info" text,
	"rate" real,
	"rate_type" text DEFAULT 'hourly',
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
