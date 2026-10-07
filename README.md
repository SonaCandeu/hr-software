# HR Employee Performance Rating Portal

A full-stack performance rating portal built with **FastAPI** (Python) and **React** (TypeScript + Vite + Tailwind CSS), fully containerized using **Docker Compose**.

The application enforces organizational hierarchy rules—allowing managers to rate only their direct and indirect reports—and applies a mandatory **1-week cooldown period** between ratings for the same employee.

---

## Features

- **Active Identity Switching:** Select which leader/employee you are acting as directly from the home dashboard.
- **Hierarchy-Aware Roster:** Visual indicators display who is in your reporting line (`Report`) versus outside your team (`Out of Line`).
- **Access Guard & Enforcement:** Server-side and client-side recursive hierarchy checks prevent unauthorized rating attempts.
- **1–4 Rating Scale:** Whole-number scoring system (1 = Unsatisfactory, 4 = Exceeds) with optional feedback comments.
- **Rate Limit Cooldown:** Enforces a 7-day waiting period per leader-employee pair before a new rating can be submitted.

---

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routers/
│   │       ├── employees.py
│   │       └── ratings.py
│   ├── data/
│   │   ├── app.db
│   │   └── app.sql
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   ├── pages/
│   │   └── types/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Prerequisites

Ensure you have the following installed on your machine:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes `docker-compose`)
- [Git](https://git-scm.com/)

---

## Quick Start with Docker

### 1. Clone the Repository
```bash
git clone https://github.com/SonaCandeu/hr-software.git
cd hr-software
```

### 2. Build and Run Containers
Start the application using Docker Compose. This will build and start two containers:
- **`backend`**: FastAPI backend running on port `8000`
- **`frontend`**: Nginx web server serving the React app on port `80`

```bash
docker compose up --build -d
```

### 3. Open the Application
Navigate to your web browser and access:
- **Frontend App:** http://localhost
- **FastAPI Interactive API Docs:** http://localhost:8000/docs

---

## Database Seeding (First Time Setup)

To populate the database with the initial employees and hierarchy from `backend/data/app.sql`, you can use the `backend/seed.py` script inside the running container.

Run the Python seed script inside the `backend` container:

```bash
docker exec -it backend python seed.py
```

---

## How to Use the Application

1. **Select Active Identity:**
   On the **Home Page**, use the **Active Identity** dropdown at the top to select who you are acting as (e.g., *Alice*, *Bob*, *David*, etc.).
2. **View Authorized Reports:**
   Employees highlighted with a green **`Report`** badge are within your reporting line. Grayed-out cards belong to employees outside your hierarchy or yourself.
3. **Submit a Rating:**
   - Click **Rate Employee** on an authorized team member.
   - Adjust the slider from **1 to 4** and add optional feedback.
   - Submit the rating.
4. **Cooldown Enforcement:**
   Once a rating is submitted, the form will lock for **7 days** for that specific leader-employee pair, showing an active countdown banner.

---

## Helpful Docker Commands

| Action | Description |
| :--- | :--- |
| **Start Services** | Start containers in the background using Docker Compose |
| **Stop Services** | Stop and remove running containers |
| **Backend Logs** | View real-time backend logs |
| **Frontend Logs** | View real-time frontend logs |
| **Restart Services** | Restart all running container services |

---

## Development & Testing

You can inspect the SQLite database entries inside the running container using Python's built-in `sqlite3` module to verify that new ratings are persisted correctly.

```bash
docker exec -it hr_backend python -c "
import sqlite3
conn = sqlite3.connect('data/app.db')
print('Ratings:', conn.cursor().execute('SELECT * FROM ratings').fetchall())
"
```