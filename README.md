# Smart Finance Management System

A production-ready, full-stack Finance Management System built for financial businesses managing three primary operations:
1. **Daily Finance Management** (Micro-loans with daily installment repayments, automatic 100-day schedule generation, and collection sheets)
2. **Weekly Finance Management** (Explicit interest loans, configurable collection days, e.g. every Monday/Friday, week-by-week ledgers)
3. **Chitti (Chit Fund) Management** (Multi-group management, ticket enrollment, auction bidding, automatic foreman commission & dividend split calculation, net payouts, and statutory legal disclaimers)

---

## 🛠 Technology Stack

### Frontend
- **React.js 18** with **Vite** & **TypeScript**
- **Tailwind CSS** for modern fintech UI design
- **Lucide React** for clean financial iconography
- **Recharts** for live financial analytics & recovery graphs
- **jsPDF & jspdf-autotable** for pixel-perfect PDF receipt & statement generation
- **XLSX** for Excel and CSV ledger export
- **QRCode.react** for dynamic UPI QR code generation (Google Pay, PhonePe, Paytm)
- **PWA Ready** with standalone manifest and mobile-responsive viewport

### Backend
- **Node.js** with **Express.js** & **TypeScript**
- **MongoDB Atlas** with **Mongoose** schemas, validations, and indexes
- **JWT Authentication** with **HttpOnly cookies** & Bearer header support
- **bcryptjs** for salted password hashing
- **Helmet & Rate Limiting** for enterprise security
- **Zero-config automated fallback**: In development mode, automatically runs an embedded in-memory MongoDB if no remote URI is configured, with auto-seeding of realistic financial records!

---

## 🔑 Demo Admin Credentials

Upon initial server boot, the database automatically initializes with sample customers, loans, chits, and an administrator account:

- **Admin Email**: `admin@finance.local`
- **Password**: `Password@123`
- **Role**: `admin`

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ installed

### 2. Install Dependencies
```bash
# In the server directory:
cd server
npm install

# In the client directory:
cd ../client
npm install
```

### 3. Start Development Servers

You can run both client and server:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend UI):**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

### 4. Run Financial Accuracy & Integrity Tests
```bash
cd server
npm test
# Runs 14/14 decimal accuracy and financial math checks

npx tsx src/scripts/testEndToEnd.ts
# Runs 26/26 live end-to-end integration tests
```

---

## 📊 Core Financial Formulas & Logic

### 1. Decimal Precision & Monetary Math
All currency arithmetic is sanitized against floating point errors using IEEE 754 precision rounding:
$$\text{roundMoney}(x) = \frac{\text{round}((x + \varepsilon) \times 100)}{100}$$

### 2. Chit Fund (Chitti) Transparent Auction Math
For a chit fund with chit value $V$, winning discount bid $B$, foreman commission rate $c\%$ (default 5%), total members $N$, and standard monthly contribution $M = V / N$:
- **Foreman Commission**:
  $$C = \text{round}\left(\frac{V \times c}{100}\right)$$
- **Total Dividend (Discount Pool)**:
  $$D = B - C$$
- **Dividend Per Member**:
  $$d = \text{round}\left(\frac{D}{N}\right)$$
- **Next Month Net Payable by Non-Prized Members**:
  $$M_{\text{net}} = \max(0, M - d)$$
- **Winner Net Payout Amount**:
  $$P_{\text{net}} = V - B$$

*Example*: On a ₹1,00,000 chit with 20 members (₹5,000/mo) and a winning bid of ₹25,000:
- Foreman Commission (5%) = ₹5,000
- Total Dividend = ₹25,000 - ₹5,000 = ₹20,000
- Dividend Per Member = ₹20,000 / 20 = ₹1,000
- Next Month Due = ₹5,000 - ₹1,000 = ₹4,000
- Winner Net Payout = ₹1,00,000 - ₹25,000 = ₹75,000

### 3. Weekly Finance Explicit Interest
Unlike hidden fee lending, all weekly loans explicitly track interest as agreed charges:
$$\text{Total Repayment} = \text{Principal} + \text{Explicit Interest} + \text{Doc Charges}$$
$$\text{Weekly Installment} = \frac{\text{Total Repayment}}{\text{Total Weeks}}$$

---

## 📱 Google Pay & PhonePe QR Payments

1. Configured under **Admin Settings -> UPI & QR Settings**:
   - Primary UPI ID (e.g. `srilakshmifinance@okaxis`)
   - Payee Name
2. On payment collection modals or the dedicated QR modal:
   - Encodes a standard compliant UPI string:
     `upi://pay?pa=<UPI_ID>&pn=<PAYEE>&am=<AMOUNT>&cu=INR&tn=<NOTE>`
   - Compatible with Google Pay, PhonePe, Paytm, and BHIM UPI.
   - **Audit Notice**: QR code display does not trigger blind automatic credit; admin confirms bank UTR reference before receipt issuance to prevent fraud.

---

## 📄 PDF Receipts & Exportable Statements

- **Digital Receipt**: Generates a professional A5 receipt with business header, transaction ID, customer details, amount in words ("Rupees Only"), payment mode, and signature lines.
- **Reports Export**: Any Daily, Weekly, or Monthly statement can be downloaded as PDF or exported to Microsoft Excel (`.xlsx`) or CSV.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Push project to GitHub.
2. In Vercel, set root directory to `client`.
3. Set build command to `npm run build` and output directory to `dist`.
4. Update `client/vercel.json` with your backend production domain.

### Backend (Render)
1. In Render, create a new **Web Service** pointing to the `server` directory.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random 64-character secret.
   - `CLIENT_URL`: Your Vercel frontend URL.

