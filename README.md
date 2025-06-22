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
│   └── src/
|       └── components/
|       └── pages/
|       └── redux/
|       └── services/
|       └── styles/
|       └── utils/
│   └── ...
├── server/                  # Express backend
│   ├── config/
│   ├── controllers/
│   ├── DB/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── ...
└── README.md
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
