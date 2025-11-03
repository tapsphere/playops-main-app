# PlayOps Main App

This project is a web application with role-based access control for different types of users: player, creator, brand, and admin.

## Features

- **Player:** Can play games, view leaderboards, and manage their wallet.
- **Creator:** Can create new game templates.
- **Brand:** Can preview games, view player results, and manage game settings.
- **Admin:** Can manage users and system settings.

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tapsphere/playops-main-app
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd playops-main-app
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Environment Variables:**
    - Create a `.env` file by copying the `.env.example` file.
    - Update the environment variables in the `.env` file as needed.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Open the application:**
    - Open your browser and navigate to `http://localhost:8080`.

### User Roles

To test the different user roles, you can log in with the following credentials (you might need to create these users in your database):

-   **Player:** Access to the game lobby, leaderboard, and wallet.
-   **Creator:** Access to the creator dashboard to create game templates.
-   **Brand:** Access to the brand dashboard to manage games and view results.
-   **Admin:** Access to the admin panel to manage users and roles.

### Deployed Application

The application is deployed and accessible at the following URLs:

-   **Profile:** [https://playopsai.vercel.app/profile](https://playopsai.vercel.app/profile)
-   **Lobby:** [https://playopsai.vercel.app/lobby](https://playopsai.vercel.app/lobby)
-   **Leaderboard:** [https://playopsai.vercel.app/leaderboard](https://playopsai.vercel.app/leaderboard)
-   **Wallet:** [https://playopsai.vercel.app/wallet](https://playopsai.vercel.app/wallet)
-   **Creator Dashboard:** [https://playopsai.vercel.app/platform/creator](https://playopsai.vercel.app/platform/creator)
-   **Brand Dashboard:** [https://playopsai.vercel.app/platform/brand](https://playopsai.vercel.app/platform/brand)
