# TaskMind AI

TaskMind AI is a chat-first project management prototype that uses AI to help you manage tasks autonomously. 

## ✨ Features

- **AI-Powered Project Management:** Manage tasks effortlessly through a conversational interface.
- **Secure Authentication:** Integrated Google OAuth for seamless and secure sign-in.
- **User Profiles:** Personalized user profiles with specific tasks and persisted chat history.
- **Modern Tech Stack:** Fast, responsive frontend powered by React and Vite, with a robust FastAPI backend.

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, TailwindCSS, React Router DOM, Axios, Lucide React.
- **Backend:** FastAPI, Python, SQLAlchemy, OpenAI API, PyJWT, Uvicorn.

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

- Node.js (v18 or higher recommended)
- Python (v3.9 or higher)
- Git

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

Install the required dependencies:
```bash
pip install -r requirements.txt
```

Set up your environment variables by creating a `.env` file in the `backend` directory (you can copy `.env.example` if it exists):
```env
OPENAI_API_KEY=your_openai_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
JWT_SECRET_KEY=replace_with_a_long_random_secret_string
```

Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```
The backend will be available at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend
```

Install the Node.js dependencies:
```bash
npm install
```

Set up your environment variables by creating a `.env` file in the `frontend` directory (you can copy `.env.example` if it exists):
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```
*Note: Make sure to use the exact same Google OAuth Web Client ID in both the backend and frontend `.env` files.*

Start the frontend development server:
```bash
npm run dev
```
The frontend will typically be available at `http://localhost:5173`.

## 🤝 Contributing

Currently, active development is taking place on the `feature/auth-and-profiles` branch, which introduces Google sign-in, user profiles, user-specific tasks, and persisted chat history.

## 📝 License

This project is licensed under the MIT License.
