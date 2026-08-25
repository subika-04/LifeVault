# 🚀 LifeVault — Personal Digital Life Vault

LifeVault is a MERN + Generative AI personal digital hub designed to help users organize, search, and extract structured insights from everyday life documents, physical assets, expenses, and reminders.

This project showcases a production-quality full-stack architecture with a dedicated AI intelligence layer (grounded context prompting via Gemini) suitable for software engineering demonstrations.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite 5, JavaScript, React Router 6, Axios, Recharts, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, Express.js, Mongoose, MongoDB, Multer, bcryptjs, jsonwebtoken, dotenv, CORS
- **AI Integration**: Google Gemini API (`@google/generative-ai`) on the backend (fully grounded in user data context)

---

## 🎨 Design System
Tailored dark-theme aesthetics matching modern productivity SaaS:
- **Primary**: Indigo/Purple
- **Secondary**: Blue/Cyan
- **Accent**: Pink/Violet
- **Success/Warning/Danger**: Emerald, Amber, and Rose

---

## 📂 Repository Structure
```
LifeVault/
├── backend/                  # Express REST API Server
│   ├── config/               # Database configurations
│   ├── controllers/          # Request handlings & Business logic
│   ├── models/               # Mongoose schemas (User, Document, Asset, Expense, Reminder, Chat)
│   ├── routes/               # API route maps
│   ├── services/             # Operations layers (Gemini parsing, database helpers)
│   └── server.js             # Main server entrypoint
└── frontend/                 # Vite + React Client
    ├── src/
    │   ├── components/       # Visual elements (modals, empty states, sidebar)
    │   ├── context/          # State management (auth, toast notifications)
    │   ├── services/         # Axios network endpoints
    │   └── pages/            # View components (Dashboard, Assets, Expenses, Reminders, Timeline)
    └── index.html
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (running locally on port 27017 or Atlas URI)

### 2. Configuration
Create `.env` file inside `backend/` directory:
```env
MONGO_URI=mongodb://127.0.0.1:27017/lifevault
JWT_SECRET=supersecretlifevaulttokenkeyforjwt
PORT=5000
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 4. Seed Database
Seed the application with realistic interview-ready demonstration data (Dell laptop, Samsung fridge, insurance, timeline, expenses):
```bash
cd backend
npm run seed
```

### 5. Running the Application
```bash
# Start backend server
cd backend
npm run dev

# Start frontend (in a separate terminal)
cd frontend
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend API runs on: `http://localhost:5000`

---

## 🔑 Demo Account
- **Email**: `demo@lifevault.com`
- **Password**: `Demo@123`
