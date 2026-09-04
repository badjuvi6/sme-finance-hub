```markdown
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

```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** 18+
* **MongoDB** instance — local (`mongod` running on `127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure MONGO_URI, PORT, and JWT_SECRET in .env if different from defaults
npm run seed     # Populates database with demo accounts and multi-month financial records
npm run dev      # Starts API on http://localhost:5000 with auto-reload

```

The seed script (`npm run seed`) populates the database with realistic transactions, invoices across payment statuses, and loan applications across review states.

#### Demo Credentials:

| Role | Email | Password |
| --- | --- | --- |
| **Financial Officer** | `admin@smefinancehub.com` | `Admin123!` |
| **Business Owner** | `owner@goldencrustbakery.com` | `Password123!` |
| **Business Owner** | `owner@accratechrepairs.com` | `Password123!` |

*(Run `npm run seed:destroy` at any time to purge seed data).*

---

### 2. Frontend Setup (Web Console)

In a separate terminal:

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL defaults to http://localhost:5000/api
npm run dev      # Starts React Vite dev server on http://localhost:5173

```

Open `http://localhost:5173` to log in using the demo credentials or the one-click quick login buttons.

---

### 3. Mobile Setup (React Native / Expo)

In a third terminal:

```bash
cd mobile
npm install
npx expo start

```

Scan the generated QR code using **Expo Go** on iOS or Android.

---

### 4. Production Build & Deployment

```bash
cd frontend
npm run build   # Static asset compilation to frontend/dist
npm run preview # Sanity check production build locally

```

Deploy `frontend/dist` to Netlify or Vercel, and `backend/` to Render or Railway. Ensure `CLIENT_URL` in backend `.env` matches your deployed web domain, and `VITE_API_URL` in frontend `.env` points to your backend base URL.

---

## 💱 Currency & Localization

Default financial metrics format in Ghanaian Cedi (**GHS**). To adjust currency preferences globally across the frontend, update `frontend/src/utils/format.js`:

```javascript
export const CURRENCY_CODE = 'GHS';
export const CURRENCY_LOCALE = 'en-GH';

```

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Register new SME account |
| POST | `/login` | Public | Authenticate user & return JWT |
| GET | `/me` | Private | Fetch active profile |
| PUT | `/me` | Private | Update user profile |

### Transactions — `/api/transactions` (SME)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/` | List user transactions (supports `type`, `category`, `from`, `to` filters) |
| GET | `/summary` | Aggregated metrics & 6-month cash flow trends |
| GET | `/:id` | Fetch single transaction |
| POST | `/` | Log income or expense entry |
| PUT | `/:id` | Update transaction record |
| DELETE | `/:id` | Delete transaction record |

### Invoices — `/api/invoices` (SME)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/` | List invoices (filterable by `status`) |
| GET | `/summary` | Counts and totals grouped by invoice status |
| GET | `/:id` | Fetch single invoice details |
| POST | `/` | Create invoice (auto-generates sequential invoice number) |
| PUT | `/:id` | Update invoice details or payment status |
| DELETE | `/:id` | Delete invoice |

### Loans & Financing — `/api/loans`

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/` | SME | Submit financing application |
| GET | `/mine` | SME | List current user's applications |
| GET | `/` | Admin | List all platform applications (filter by `status`) |
| GET | `/:id` | Owner/Admin | Fetch single application detail |
| PUT | `/:id/status` | Admin | Update status (`Under Review`, `Approved`, `Rejected`) |

### Admin — `/api/admin` (Financial Officer / Admin)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/overview` | Platform statistics: total SMEs, loan volume, approval metrics |
| GET | `/smes` | Directory of registered SMEs |

---

## 🗄️ Data Models (Mongoose)

* **User:** `name`, `email`, `password` (hashed, `select: false`), `role` (`sme` | `admin`), `businessName`, `businessType`, `phone`.
* **Transaction:** `user`, `type` (`income` | `expense`), `category`, `amount`, `description`, `date`.
* **Invoice:** `user`, `invoiceNumber`, `clientName`, `clientEmail`, `items[]` (`description`, `quantity`, `unitPrice`), `totalAmount`, `status` (`Paid` | `Pending` | `Overdue`), `issueDate`, `dueDate`, `notes`.
* **LoanApplication:** `user`, `businessName`, `businessType`, `yearsInOperation`, `monthlyRevenue`, `requestedAmount`, `fundingType` (`Micro-loan` | `Business Loan` | `Grant`), `purpose`, `status` (`Under Review` | `Approved` | `Rejected`), `reviewNotes`, `reviewedBy`, `reviewedAt`.

---

## 🔐 Security Specifications

* Passwords hashed via **bcrypt** before persistence.
* Stateless JWT session validation across API routes.
* Endpoint security using custom **RBAC middleware** (`verifyToken` & `checkRole`).
* Automatic status updating: Pending invoices transition to `Overdue` when due dates elapse during list queries.

---

## 👤 Author

**Winfred Manu**

* **GitHub:** [@badjuvi6](https://www.google.com/search?q=https://github.com/badjuvi6)
* **Institution:** Ghana Communication Technology University (GCTU)

```

```
