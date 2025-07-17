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

## Screenshots

### Login Page

![Login Page](Screenshots/1.%20Login%20Page.png)

### Signup Page

![Signup Page](Screenshots/2.%20Signup%20Page.png)

### Forgot Password Page

![Forgot Password Page](Screenshots/3.%20Forgot%20Password%20Page.png)

### Sales Dashboard Page

![Sales Dashboard Page](Screenshots/4.%20Sales%20Dashboard%20Page.png)

### Products Page

![Products Page](Screenshots/5.%20Products%20Page.png)

### Add Product Page

![Add Product Page](Screenshots/6.%20Add%20Product%20Page.png)

### Edit Product Page

![Edit Product Page](Screenshots/7.%20Edit%20Product%20Page.png)

### Sales Page

![Sales Page](Screenshots/8.%20Sales%20Page.png)

### Sale Details

![Sale Details](Screenshots/9.%20Sale%20Details.png)

### New Sale Page

![New Sale Page](Screenshots/10.%20New%20Sale%20Page.png)

### Users Page

![Users Page](Screenshots/11.%20Users%20Page.png)

### Add User Page

![Add User Page](Screenshots/12.%20Add%20User.png)

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
|   |   |   └── Products.css
|   |   |   └── ResetPassword.css
|   |   |   └── Sales.css
|   |   |   └── Sidebar.css
|   |   |   └── Signup.css
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
