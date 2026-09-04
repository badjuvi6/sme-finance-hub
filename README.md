# SME Finance Hub 📊

A full-stack, cross-platform financial management and analytics platform designed for Small and Medium Enterprises (SMEs). **SME Finance Hub** helps business owners track income and expenses, generate and monitor invoices, and apply for micro-financing or business loans — complete with a dedicated Financial Officer console for review and approval and a companion mobile application.

---

## 🚀 Live Demos

* **Web Console:** [smefinancehub.netlify.app](https://smefinancehub.netlify.app)
* **Backend API:** Hosted on [Render](https://sme-finance-hub.onrender.com)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Web** | React 18 (Vite), React Router, Tailwind CSS, Lucide icons, Recharts, Axios |
| **Mobile App** | React Native / Expo, React Native SVG |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ORM |
| **Auth & Security** | JWT (JSON Web Tokens), bcrypt password hashing, Role-Based Access Control (RBAC) |

---

## 📂 Project Structure

```text
sme-finance-hub/
├── backend/
│   ├── config/          # Database connection setup
│   ├── controllers/     # Route handler logic (auth, transactions, invoices, loans, admin)
│   ├── middleware/      # JWT auth guard, RBAC role guard, error handling
│   ├── models/          # Mongoose schemas: User, Transaction, Invoice, LoanApplication
│   ├── routes/          # Express routers mounted under /api/*
│   ├── utils/           # Token helper + demo data seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js        # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios instance + modular API endpoints
│   │   ├── components/  # Navigation, modal sheets, and domain-specific UI components
│   │   ├── context/     # AuthContext (session) and ToastContext (notifications)
│   │   ├── pages/       # SME Dashboard & Financial Officer / Admin route pages
│   │   ├── utils/       # Currency formatting + shared constants
│   │   ├── App.jsx      # Router configuration
│   │   └── main.jsx     # React application entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── mobile/              # React Native / Expo companion app
    ├── assets/          # Application icons & branding assets
    ├── App.js           # Mobile application layout & navigation
    └── package.json
