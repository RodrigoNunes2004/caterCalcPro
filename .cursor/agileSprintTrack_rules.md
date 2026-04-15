// GastroGrid / caterCalcPro — Agile Sprint Tracking

The goal is to stabilize development, protect the existing architecture, and deliver production‑ready features using Agile principles.

Project Overview

System Name: GastroGrid (caterCalcPro) Architecture: Multi‑tenant SaaS Stack:

Frontend:

React
Vite
TypeScript
Tailwind
shadcn / Radix

Backend:

Express
TypeScript

Database:

PostgreSQL (Neon)
Drizzle ORM
PGlite (development fallback)

Authentication:

JWT (httpOnly cookie)

Billing:

Stripe Subscriptions

Deployment:

Vercel / Node server
Agile Development Principles

We will follow these rules:

Small, safe increments
No destructive schema changes
Backward compatibility at all times
Test before moving to next sprint
One responsibility per sprint
Production‑safe migrations
Feature gating by plan tier
Development Phases

Phase 1 — Foundation Stabilization Phase 2 — Data & Pricing Core Phase 3 — Analytics System Phase 4 — AI Features Phase 5 — Performance & Security Phase 6 — UX & Responsiveness Phase 7 — Testing & Production Hardening

Sprint Structure

Each sprint duration:

1 week (recommended)

Sprint workflow:

Plan Develop Test Review Deploy Document

Sprint 0 — Project Setup & Governance

Goal: Establish development workflow and tracking system.

Tasks:

Create GitHub repository Create GitHub Project board Create environment configuration Create .env templates Create database migration workflow Create logging system Create error handling middleware Create health check endpoints

Deliverables:

GitHub Project board operational Development workflow documented Environment stable

Sprint 1 — RDBMS Schema Stabilization

Priority: CRITICAL

Goal: Define and stabilize the database schema before feature development.

Tasks:

Audit existing schema Normalize relationships Verify foreign keys Add indexes for performance Ensure organizationId exists on all tenant data Add planTier column to organizations Create event_snapshots table Create inventory_transactions table Create migration scripts Test migrations on dev database

Deliverables:

Stable database schema Migration scripts verified Tenant isolation confirmed

Sprint 2 — Pricing Engine Core

Priority: CRITICAL

Goal: Centralize all costing logic into a reusable pricing engine.

Tasks:

Create pricingEngine service Move recipe cost logic Move menu cost logic Move event cost logic Standardize unit conversion logic Implement cost fallback logic Write unit tests for calculations Replace inline calculations

Deliverables:

Reusable pricing engine Consistent cost calculations Test coverage for pricing

Sprint 3 — REST API Stabilization

Priority: HIGH

Goal: Ensure API structure is clean, consistent, and production ready.

Tasks:

Standardize API response format Add request validation middleware Add error handling middleware Add rate limiting Add request logging Add API versioning support Review all route handlers Ensure organization filtering

Deliverables:

Stable API layer Consistent responses Secure request validation

Sprint 4 — Inventory Transaction System

Priority: HIGH

Goal: Track all inventory movement for analytics and auditing.

Tasks:

Create inventory_transactions logic Log restock operations Log prep deductions Log manual adjustments Connect transaction logging to prep completion Prevent duplicate deductions Add transaction history endpoint

Deliverables:

Inventory audit trail Reliable stock tracking

Sprint 5 — Analytics System (Pro Plan)

Priority: HIGH

Goal: Provide business intelligence and financial visibility.

Tasks:

Create analytics service Implement profit summary endpoint Implement event trends endpoint Implement inventory spend endpoint Create analytics dashboard API Add plan gating middleware Optimize analytics queries

Deliverables:

Analytics API operational Pro feature gating working

Sprint 6 — AI Recipe Generator (AI Plan)

Priority: MEDIUM

Goal: Enable AI‑powered recipe creation.

Tasks:

Create AI service Define recipe JSON schema Integrate AI provider Validate AI responses Match ingredients automatically Create missing ingredients Store AI recipes safely Calculate recipe cost automatically Add AI usage logging

Deliverables:

AI recipe generator operational Safe recipe creation workflow

Sprint 7 — Subscription & Plan Enforcement

Priority: HIGH

Goal: Control feature access based on subscription plan.

Tasks:

Implement requirePlan middleware Map Stripe price IDs to plan tiers Handle subscription downgrade Handle subscription cancellation Restrict Pro features Restrict AI features Add upgrade prompts

Deliverables:

Reliable plan enforcement Subscription control working

Sprint 8 — Security Hardening

Priority: HIGH

Goal: Protect the platform from vulnerabilities.

Tasks:

Implement input sanitization Enable CORS configuration Add CSRF protection Secure cookies Add password hashing validation Add JWT expiration handling Implement role‑based permissions Run security audit

Deliverables:

Secure authentication system Hardened API

Sprint 9 — Client‑Side UX & Responsiveness

Priority: MEDIUM

Goal: Improve usability across devices.

Tasks:

Optimize mobile layout Improve navigation responsiveness Add loading states Add error feedback UI Improve dashboard performance Implement skeleton loaders Optimize table rendering Improve accessibility

Deliverables:

Responsive UI Improved user experience

Sprint 10 — Performance Optimization

Priority: MEDIUM

Goal: Ensure system performance under load.

Tasks:

Add database indexes Optimize queries Implement caching strategy Add pagination to lists Reduce API response size Optimize bundle size Implement lazy loading

Deliverables:

Faster system performance Reduced server load

Sprint 11 — Automated Testing

Priority: HIGH

Goal: Ensure reliability and prevent regressions.

Tasks:

Create unit tests Create integration tests Create API tests Create database tests Create authentication tests Create billing tests Create analytics tests Implement CI pipeline

Deliverables:

Test suite operational Continuous integration running

Sprint 12 — Production Readiness

Priority: CRITICAL

Goal: Prepare system for real users.

Tasks:

Enable production logging Configure monitoring Configure backups Configure database failover Set environment variables Verify Stripe webhooks Run load testing Create deployment checklist

Deliverables:

Production‑ready system Deployment verified

GitHub Projects Workflow

Create columns:

Backlog Ready In Progress Testing Done

Each task becomes an issue.

Each sprint becomes a milestone.

Issue Template

Title:

Feature or Fix Name

Description:

What needs to be implemented

Acceptance Criteria:

Expected behavior

Technical Notes:

Implementation details

Definition of Done

A task is complete only when:

Code implemented Tests pass No console errors No TypeScript errors Database migration verified Feature works in production mode Documentation updated

Risk Control Rules

Never modify production schema without migration Never bypass organizationId filtering Never remove working logic without replacement Never deploy untested code Never mix feature logic across modules

Long‑Term Vision

This sprint system prepares the platform for:

Multi‑tenant SaaS scaling Enterprise customers White‑label deployments AI‑driven automation Financial analytics Operational intelligence