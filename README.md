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

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/nishant-x/AgentAxis.git
cd AgentAxis
2. Backend Setup
bash
Copy code
cd Backend
npm install
Create a .env file inside the Backend folder with the following:

env
Copy code
# Backend port
PORT=5000

# Frontend URL for CORS
VITE_FRONTEND_URL=http://localhost:5173

# JWT secret for authentication
JWT_SECRET=your_jwt_secret_here

# MongoDB connection string
MONGODB_URL=your_mongodb_connection_string_here
Start the backend server:

bash
Copy code
npm run dev
Backend will run at: http://localhost:5000

3. Frontend Setup
bash
Copy code
cd ../Frontend
npm install
Create a .env file inside the Frontend folder with:

env
Copy code
VITE_BACKEND_URL=http://localhost:5000
Start the frontend app:

bash
Copy code
npm run dev
Frontend will run at: http://localhost:5173