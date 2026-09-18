# 🏥 Hospital Management System – Salesforce

A Salesforce-based Hospital Management System designed to manage patients, doctors, appointments, and prescriptions through a centralized healthcare portal.

This project demonstrates practical Salesforce development using **Apex, SOQL, DML, Triggers, Lightning Web Components (LWC), Salesforce Flow, Reports, Dashboards, Permission Sets, Experience Cloud, Salesforce CLI, Git, and GitHub**.

---

## 📌 Project Overview

The Hospital Management System provides a digital healthcare portal where patients can:

- 👨‍⚕️ View available doctors
- 🔎 Search and filter doctors
- 🟢 Check doctor availability
- 📅 Book appointments
- 🚨 Select Normal or Emergency appointments
- ⚡ Automatically assign appointment priority
- 📋 View appointment history
- ❌ Cancel appointments
- 💊 View prescriptions
- 📝 Create prescriptions for appointments
- 🌐 Access the application through Salesforce Experience Cloud

The system also implements server-side business rules using Apex to validate appointments and maintain data consistency.

---

## 🎯 Objectives

The main objectives of this project are:

- Build a real-world Salesforce application from scratch
- Implement Salesforce data modeling
- Develop Apex business logic
- Implement Apex Trigger and Trigger Handler patterns
- Build reusable Lightning Web Components
- Automate business processes using Salesforce Flow
- Implement security and access control
- Create reports and dashboards
- Provide a patient-facing Experience Cloud portal
- Practice Salesforce DX development
- Manage the project using Git and GitHub

---

## 🏗️ Salesforce Architecture

```text
                    ┌──────────────────────────┐
                    │    Experience Cloud      │
                    │  Patient Healthcare      │
                    │        Portal            │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       LWC Layer           │
                    │                          │
                    │ Hospital Appointment      │
                    │ Portal                   │
                    │                          │
                    │ Prescription Manager      │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       Apex Layer          │
                    │                          │
                    │ HospitalDoctorController  │
                    │ AppointmentHandler        │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌──────────────────┐       ┌──────────────────┐
          │   Apex Trigger   │       │ Salesforce Flow  │
          │                  │       │                  │
          │ Appointment      │       │   Automation     │
          │ Conflict Trigger │       │                  │
          └────────┬─────────┘       └────────┬─────────┘
                   │                          │
                   └────────────┬─────────────┘
                                ▼
                    ┌──────────────────────────┐
                    │   Salesforce Data Model   │
                    │                          │
                    │ Patient                  │
                    │ Doctor                   │
                    │ Appointment              │
                    │ Prescription             │
                    └──────────────────────────┘