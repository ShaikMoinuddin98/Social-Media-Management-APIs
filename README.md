# User Authentication and Post Management API

This is an Express-based server application that provides user authentication, session management, email notifications, and post management functionalities. It uses MongoDB for the database, Passport.js for authentication, JWT for token-based authentication, and Nodemailer for sending emails.

## Features

- User registration, login, and logout
- Email encryption and decryption
- Password reset via email with JWT
- Post creation, retrieval, update, deletion, likes, and comments
- Session management with Express-session
- Token-based authentication with JWT
- Secure password handling with Passport.js

## Prerequisites

- Node.js and npm
- MongoDB
- Google account for sending emails via Nodemailer

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/user-auth-post-management.git
    cd user-auth-post-management
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Configure MongoDB:
    - Make sure you have a MongoDB instance running and update the connection string in `main()` function:
      ```js
      await mongoose.connect('mongodb+srv://<username>:<password>@cluster0.mongodb.net/');
      ```

4. Configure Nodemailer:
    - Update the email and password in the `transporter` configuration:
      ```js
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: "your-email@gmail.com",
              pass: "your-email-password",
          },
      });
      ```

5. Run the server:
    ```sh
    node server.js
    ```

## Usage

### API Endpoints

#### User Registration

- **URL:** `/signup`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "username": "your-username",
    "email": "your-email",
    "password": "your-password"
  }
  ```
  - **Response:**
  ```json
  {
  "Authenication": true,
  "message": "signup success",
  "token": "jwt-token"
  }
  ```
  
- **URL:** `/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
   "username": "your-username",
  "password": "your-password"
  }
  ```
  - **Response:**
  ```json
  {
  "Authenication": true,
  "message": "signup success",
  "token": "jwt-token"
  }
  ```

- **URL:** `/logout`
- **Method:** `POST`
- **Response:**
  ```json
  {
  "message": "Logout success"
  }
  ```

  
