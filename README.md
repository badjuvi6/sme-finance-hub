# SME Finance Hub

A full-stack platform that helps Small and Medium Enterprises (SMEs) track income and expenses,
generate and monitor invoices, and apply for micro-financing or business loans — with a
financial officer console to review and decide on those applications.

## Tech stack

| Layer      | Technology                                                            |
|------------|------------------------------------------------------------------------|
| Frontend   | React 18 (Vite), React Router, Tailwind CSS, Lucide icons, Recharts, Axios |
| Backend    | Node.js, Express.js                                                    |
| Database   | MongoDB with Mongoose                                                  |
| Auth       | JWT (JSON Web Tokens), bcrypt password hashing                         |

## Project structure

```
sme-finance-hub/
├── backend/
│   ├── config/            # Database connection
│   ├── controllers/       # Route handler logic (auth, transactions, invoices, loans, admin)
│   ├── middleware/        # JWT auth guard, role guard, error handling
│   ├── models/            # Mongoose schemas: User, Transaction, Invoice, LoanApplication
│   ├── routes/            # Express routers, mounted under /api/*
│   ├── utils/             # Token helper + demo data seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js          # App entry point
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance + one module per resource
    │   ├── components/     # layout, common, and feature components (by domain)
    │   ├── context/        # AuthContext (session) and ToastContext (notifications)
    │   ├── pages/           # sme/ and admin/ route pages
    │   ├── utils/           # formatting + shared constants
    │   ├── App.jsx          # Router configuration
    │   └── main.jsx         # React entry point
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB instance — either local (`mongod` running on `127.0.0.1:27017`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if your MongoDB URI, port, or JWT secret should differ from the defaults
npm run seed     # populates the database with a demo admin + two demo SME accounts
npm run dev      # starts the API on http://localhost:5000 with auto-reload
```

The seed script (`npm run seed`) creates three accounts with several months of realistic
transactions, invoices in all three payment states, and loan applications in all three review
states, so the UI is fully populated the moment you log in. Demo credentials:

| Role              | Email                             | Password      |
|-------------------|------------------------------------|---------------|
| Financial Officer | `admin@smefinancehub.com`          | `Admin123!`   |
| Business Owner     | `owner@goldencrustbakery.com`      | `Password123!`|
| Business Owner     | `owner@accratechrepairs.com`       | `Password123!`|

Run `npm run seed:destroy` at any time to remove the demo accounts and their data.

### 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL defaults to http://localhost:5000/api, matching the backend default
npm run dev      # starts the app on http://localhost:5173
```

Open `http://localhost:5173` and sign in with one of the demo accounts above (the login page
also has one-click buttons that fill these in for you).

### 3. Production build

```bash
cd frontend
npm run build     # outputs static assets to frontend/dist
npm run preview   # serve the production build locally to sanity-check it
```

Deploy `frontend/dist` to any static host, and the `backend/` folder to any Node host. Set
`CLIENT_URL` in the backend `.env` to your deployed frontend origin (for CORS), and
`VITE_API_URL` in the frontend `.env` to your deployed backend's `/api` base URL before building.

## Currency

Sample data and all currency formatting default to Ghanaian Cedi (GHS). To change this, edit
the two constants at the top of `frontend/src/utils/format.js`:

```js
export const CURRENCY_CODE = 'GHS';
export const CURRENCY_LOCALE = 'en-GH';
```

## API reference

All routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>`
header, obtained from the login/register response.

### Auth — `/api/auth`

| Method | Route      | Access  | Description                    |
|--------|------------|---------|---------------------------------|
| POST   | `/register`| Public  | Create a new SME account       |
| POST   | `/login`   | Public  | Authenticate and receive a JWT |
| GET    | `/me`      | Private | Get the current user's profile |
| PUT    | `/me`      | Private | Update the current user's profile |

### Transactions — `/api/transactions` (SME only)

| Method | Route      | Description                                   |
|--------|------------|------------------------------------------------|
| GET    | `/`        | List the logged-in user's transactions (filter by `type`, `category`, `from`, `to`) |
| GET    | `/summary` | Aggregated totals + 6-month cash flow for dashboard cards/chart |
| GET    | `/:id`     | Get a single transaction                       |
| POST   | `/`        | Log a new income or expense                     |
| PUT    | `/:id`     | Update a transaction                            |
| DELETE | `/:id`     | Delete a transaction                            |

### Invoices — `/api/invoices` (SME only)

| Method | Route      | Description                                    |
|--------|------------|--------------------------------------------------|
| GET    | `/`        | List invoices (filter by `status`)               |
| GET    | `/summary` | Counts and amounts grouped by status             |
| GET    | `/:id`     | Get a single invoice                             |
| POST   | `/`        | Create an invoice (auto-generates the invoice number) |
| PUT    | `/:id`     | Update invoice details or payment status         |
| DELETE | `/:id`     | Delete an invoice                                |

### Loan / financing applications — `/api/loans`

| Method | Route          | Access | Description                              |
|--------|----------------|--------|--------------------------------------------|
| POST   | `/`            | SME    | Submit a loan/grant application            |
| GET    | `/mine`        | SME    | List the logged-in user's own applications |
| GET    | `/`            | Admin  | List all applications (filter by `status`) |
| GET    | `/:id`         | Owner or Admin | Get a single application           |
| PUT    | `/:id/status`  | Admin  | Update status (`Under Review` / `Approved` / `Rejected`) with review notes |

### Admin — `/api/admin` (Admin only)

| Method | Route       | Description                                        |
|--------|-------------|------------------------------------------------------|
| GET    | `/overview` | Platform stats: total SMEs, total/approved/rejected loan requests, amounts |
| GET    | `/smes`     | List every registered SME                            |

## Data models (Mongoose)

- **User** — `name`, `email`, `password` (hashed), `role` (`sme` \| `admin`), `businessName`,
  `businessType`, `phone`.
- **Transaction** — `user`, `type` (`income` \| `expense`), `category`, `amount`, `description`,
  `date`.
- **Invoice** — `user`, `invoiceNumber`, `clientName`, `clientEmail`, `items[]`
  (`description`, `quantity`, `unitPrice`), `totalAmount`, `status`
  (`Paid` \| `Pending` \| `Overdue`), `issueDate`, `dueDate`, `notes`.
- **LoanApplication** — `user`, `businessName`, `businessType`, `yearsInOperation`,
  `monthlyRevenue`, `requestedAmount`, `fundingType` (`Micro-loan` \| `Business Loan` \| `Grant`),
  `purpose`, `status` (`Under Review` \| `Approved` \| `Rejected`), `reviewNotes`, `reviewedBy`,
  `reviewedAt`.

## Notes on security

- Passwords are hashed with bcrypt before being stored; the `password` field is excluded from
  query results by default (`select: false`).
- JWTs are signed with `JWT_SECRET` from the environment — replace the placeholder in
  `.env.example` with a long random string in any real deployment.
- All transaction/invoice/loan routes are scoped to the authenticated user's own records; the
  public registration endpoint cannot create admin accounts.
- Pending invoices automatically flip to `Overdue` once their due date passes, whenever the
  invoice list or summary endpoints are read.
