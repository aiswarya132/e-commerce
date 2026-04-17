# E-Commerce RBAC Project

This project is a full-stack e-commerce system with role-based access:

- Admin: manage vendors, customers, and products
- Vendor: manage own products and own customers
- Customer: view products and place orders

## Project Structure

- `backend/` Express + MySQL API
- `frontend/` React (Vite) app
- `database/schema.sql` database schema

## 1) Database Setup

Run `database/schema.sql` in MySQL to create DB and tables.

Example (from project root):

```bash
mysql -u root -p < database/schema.sql
```

## 2) Backend Setup

Open terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and set values:

```env
PORT=5000
JWT_SECRET=replace_with_strong_secret
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_rbac
```

Run backend:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

Health check: `http://localhost:5000/health`

## 3) Frontend (React) Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run React app:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Main APIs

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Admin:
  - `GET /api/admin/users`
  - `GET /api/admin/products`
  - `POST /api/admin/products`
- Vendor:
  - `GET /api/vendor/products`
  - `POST /api/vendor/products`
  - `PUT /api/vendor/products/:id`
  - `GET /api/vendor/customers`
- Customer:
  - `GET /api/customer/products`
  - `POST /api/customer/orders`
  - `GET /api/customer/orders/me`
