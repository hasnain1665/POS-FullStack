# POS Application – Full Stack Web App

> **Tech Stack:** React.js · Node.js · Express.js · MySQL · Sequelize · JWT · Bootstrap

---

## Overview

A full-stack Point of Sale (POS) system designed to manage products, sales, and inventory efficiently. This application allows users to add and manage products, track stock, record sales, and generate reports, with role-based access and secure authentication using JWT.

---

## Features

- **Role-based Authentication (JWT)** – Admin & Cashier login system
- **Product Management** – Add, update, and delete products
- **Sales Management** – Create, view, and manage sale records
- **Stock Tracking** – Auto-adjust stock levels on sale
- **Reports** – Sales and inventory reporting
- **Search & Filters** – Easily search and filter products or sales
- **Pagination** – Efficient data rendering
- **Dashboard** – View KPIs like total sales, products in stock, etc.

---

## Tech Stack

| Category         | Technology                    |
| ---------------- | ----------------------------- |
| Frontend         | React.js, Bootstrap           |
| Backend          | Node.js, Express.js           |
| Database         | MySQL, Sequelize ORM          |
| Authentication   | JWT                           |
| State Management | React Hooks                   |
| Tools            | Git, GitHub, VS Code, Postman |

---

## Folder Structure

```
pos-app/
├── client/                  # React frontend
│   ├── public/
│   ├── src/
|   |   ├── components/
|   |   |   └── ProtectedRoute.jsx
|   |   |   └── Sidebar.jsx
|   |   ├── pages/
|   |   |   └── Dashboard.jsx
|   |   |   └── ForgotPassword.jsx
|   |   |   └── Login.jsx
|   |   |   └── ProductsPage.jsx
|   |   |   └── ResetPassword.jsx
|   |   |   └── SalesPage.jsx
|   |   |   └── Signup.jsx
|   |   |   └── UsersPage.js
|   |   ├── redux/
|   |   |   └── authSlice.jsx
|   |   |   └── store.jsx
|   |   ├── services/
|   |   |   └── dashBoardservice.js
|   |   |   └── productService.js
|   |   |   └── salesService.js
|   |   |   └── userService.js
|   |   ├── styles/
|   |   |   └── Dashboard.css
|   |   |   └── ForgotPassword.css
|   |   |   └── Login.css
|   |   |   └── Product.css
|   |   |   └── Sales.css
|   |   |   └── Sidebar.css
|   |   |   └── users.css
|   |   ├── utils/
|   |   |   └── auth.js
|   |   └── App.js
|   |   └── index.js
├── server/                  # Express backend
|   ├── config/
|   |   └── config.js
|   |   └── database.js
|   ├── constrollers/
|   |   └── authController.js
|   |   └── productController.js
|   |   └── saleController.js
|   |   └── saleItemController.js
|   |   └── userController.js
|   ├── DB/
|   |   └── sql.js
|   ├── middleware/
|   |   └── authMiddleware.js
|   ├── migrations/
|   |   └── 20250318000111-create-user.js
|   |   └── 20250318000122-create-product.js
|   |   └── 20250318000132-create-sale.js
|   |   └── 20250318000139-create-sale-item.js
|   |   └── 20250319010425-add-cashier-id-to-sales.js
|   |   └── 20250319210444-create-stock-history.js
|   ├── models/
|   |   └── index.js
|   |   └── product.js
|   |   └── sale.js
|   |   └── saleitem.js
|   |   └── stockHistory.js
|   |   └── user.js
|   ├── routes/
|   |   └── authRoutes.js
|   |   └── dashboardRoutes.js
|   |   └── index.js
|   |   └── productRoutes.js
|   |   └── saleItemRoutes.js
|   |   └── saleRoutes.js
|   |   └── userRoutes.js
|   ├── utils/
|   |   └── emailService.js
│   └── app.js
└── README.md
└── Users.txt
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/hasnain1665/POS-FullStack.git
cd POS-FullStack
```

### 2. Setup Backend

```bash
cd server
npm install
# Create .env file with your DB config
npm start
```

### 3. Setup Frontend

```bash
cd client
npm install
npm start
```

---

## API Endpoints

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| POST   | `/auth/login`                 | Login user                 |
| POST   | `/auth/register`              | Register user              |
| POST   | `/auth/forgot-password`       | Forgot Password            |
| POST   | `/auth/reset-password/:token` | Reset Password using token |
| GET    | `/products`                   | Get all products           |
| GET    | `/sales`                      | Get all sales              |
| GET    | `/users`                      | Get all users              |

---

## Environment Variables (.env)

Create a `.env` file in `/server` folder:

```env
PORT=8000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=posdb
JWT_SECRET=your_secret_key
```

---

## Test Credentials

| Role    | Email                     | Password    |
| ------- | ------------------------- | ----------- |
| Admin   | john.smith@example.com    | P@ssw0rd123 |
| Cashier | alice.johnson@example.com | Alice@789   |

---

## Future Improvements

- PDF Export for invoices & reports
- Dashboard charts (sales trends)
- Print receipts
- Barcode scanner integration
