# AutoLux — Node.js Suppliers API

**Author:** Diana Simões

## Description

The AutoLux Suppliers API is a REST API developed with Node.js and Express for managing suppliers and supplier orders in an automotive parts warehouse.

It uses a MySQL database to store supplier information, orders and order items. The API integrates with the AutoLux PHP interface, allowing users to access supplier information and manage supplier orders through a web application.

## Technologies

- Node.js
- Express.js
- MySQL
- mysql2
- dotenv
- JavaScript
- npm

## Features

- List all suppliers.
- Retrieve supplier details by ID.
- Register new suppliers.
- Update supplier information.
- Deactivate suppliers.
- List supplier orders.
- Retrieve the details of a specific supplier order.
- Create supplier orders containing multiple parts.
- Calculate order totals automatically.
- Validate supplier information and order data.
- Update supplier order statuses.
- Use database transactions when creating orders and their associated items.

## Requirements

- XAMPP, including Apache and MySQL.
- Node.js and npm.
- Git, to clone the repository.
- A web browser.

## Database Setup

The API uses the MySQL database `autolux_fornecedores`.

The SQL scripts are located in the `sql/` directory:

- `02_criar_base_dados_fornecedores.sql` — creates the `autolux_fornecedores` database and the tables required to manage suppliers, supplier orders and order items.
- `04_inserir_dados_demo_fornecedores.sql` — inserts sample suppliers, supplier orders and order items.

To set up the database:

1. Open the XAMPP Control Panel.
2. Start **Apache** and **MySQL**, and wait until both services are running.
3. Open phpMyAdmin in your browser: `http://localhost/phpmyadmin/`.
4. Execute `02_criar_base_dados_fornecedores.sql`.
5. Execute `04_inserir_dados_demo_fornecedores.sql` to insert the sample data.

**Note:** Run the sample data script only once on a fresh database to avoid duplicate or inconsistent sample records.

## Installation and Execution

### 1. Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/abiliaframboesa/autolux-backend-fornecedores-node.git
cd autolux-backend-fornecedores-node
```

### 2. Install dependencies

Run the following command in the project directory:

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory of the project, using `.env.example` as a reference.

Example configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=autolux_fornecedores
```

Adjust the values to match your MySQL configuration. Do not commit the `.env` file to the repository.

### 4. Prepare the database

Follow the instructions in the **Database Setup** section to create and populate the database before starting the API.

### 5. Start the API

1. Make sure Apache and MySQL are running in the XAMPP Control Panel.
2. Open a terminal in the Node.js project directory.
3. Run:

   ```bash
   npm start
   ```

4. Keep the terminal open while using the application.

The API runs at `http://localhost:3000` by default.

To verify that the API is running, open the following address in your browser:

`http://localhost:3000/`

The API should return a JSON response confirming that it is running.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check API status |
| GET | `/fornecedores` | List suppliers |
| GET | `/fornecedores/:id` | Retrieve a supplier by ID |
| POST | `/fornecedores` | Register a new supplier |
| PUT | `/fornecedores/:id` | Update supplier information |
| PATCH | `/fornecedores/:id/desativar` | Deactivate a supplier |
| GET | `/encomendas` | List supplier orders |
| GET | `/encomendas/:id` | Retrieve a supplier order by ID |
| POST | `/encomendas` | Create a supplier order |
| PUT | `/encomendas/:id` | Update a supplier order's status |

### Creating a Supplier Order

To create a supplier order, send a `POST` request to `/encomendas` with a JSON body containing the supplier ID and the list of parts.

Example:

```json
{
  "fornecedor_id": 1,
  "pecas": [
    {
      "referencia_peca": "FIL-001",
      "nome_peca": "Oil Filter",
      "quantidade": 2,
      "preco_unitario": 12.50
    },
    {
      "referencia_peca": "TRV-001",
      "nome_peca": "Brake Pads",
      "quantidade": 1,
      "preco_unitario": 35.00
    }
  ]
}
```

The API validates the request, calculates the total order value and stores the order and its items in the database.

### Updating an Order Status

To update an order's status, send a `PUT` request to `/encomendas/:id`.

The supported statuses are:

- `Pendente`
- `Enviada`
- `Recebida`

Example request body:

```json
{
  "estado": "Enviada"
}
```

## Database Information

The `autolux_fornecedores` database contains the information required for supplier and supplier order management.

It includes the following tables:

- `fornecedores` — stores supplier information.
- `encomendas_fornecedor` — stores supplier orders.
- `encomenda_pecas` — stores the parts associated with each order.

This database is separate from `autolux_vendas`, which is used by the PHP interface for customers, parts, sales and sale items.

## Integration with the PHP Interface

This API works together with the AutoLux PHP interface:

https://github.com/abiliaframboesa/autolux-backend-interface-php

The PHP application communicates with this API at `http://localhost:3000` to retrieve supplier information and manage supplier orders.

Apache serves the PHP application, Node.js runs the API, and MySQL stores the application data.

The Node.js API must be running for the supplier-related functionality in the PHP application to work.

## Repository

**Node.js API:** https://github.com/abiliaframboesa/autolux-backend-fornecedores-node

## Author

Diana Simões