# AgentAxis

**AgentAxis** is a web-based platform designed to manage agents and distribute leads efficiently. It helps businesses streamline their agent management, lead allocation, and tracking processes.

## Features

- **Admin Dashboard**
  - Create, update, and delete agents
  - Upload CSV files with leads
  - Automatic validation of CSV structure
  - Even distribution of leads across agents
  - Track all uploaded leads and their status

- **Agent Dashboard**
  - View assigned leads
  - Update lead status (active/inactive)
  - Easy-to-use interface

- **Authentication**
  - JWT-based secure login
  - Role-based access: Admin and Agent

- **Technology Stack**
  - **Frontend:** React, Tailwind CSS
  - **Backend:** Node.js, Express
  - **Database:** MongoDB
  - **Authentication:** JWT
  - **File Handling:** Multer for CSV uploads

## Demo Users

- **Admin:**  
  - Email: `admin@example.com`  
  - Password: `Admin@123`  
- **Agent:**  
  - Email: `jhadenishant@gmail.com`  
  - Password: `Nishant@123`  

## Installation

1. Clone the repository:  
   ```bash
   git clone - https://github.com/nishant-x/AgentAxis.git
   cd agentaxis

## .env file description
# Frontend
VITE_BACKEND_URL = http://localhost:5000

# Backend port
PORT=5000

# Frontend URL for CORS
VITE_FRONTEND_URL=# Backend port
PORT=5000

# Frontend URL for CORS
VITE_FRONTEND_URL=http://localhost:5173

# JWT secret for authentication
JWT_SECRET=your_jwt_secret_here

# MongoDB connection string
MONGODB_URL=your_mongodb_connection_string_here

## Frontend URL
https://agent-axis-rouge.vercel.app/


