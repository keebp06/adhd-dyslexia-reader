ADHD & Dyslexia-Friendly PDF Reader

An accessibility-first full-stack web application that transforms traditional PDF documents into cognitively optimized reading formats designed to reduce visual overload and improve focus for individuals with ADHD and dyslexia.

🔗 Live Demo: https://adhd-dyslexia-reader.vercel.app
📘 API Docs: https://adhd-dyslexia-reader.onrender.com/docs
💻 GitHub Repository: https://github.com/keebp06/adhd-dyslexia-reader

Why This Project Matters:

Many PDFs are dense, visually cluttered, and difficult to read for neurodivergent users.
This application restructures text layout and presentation to:
Improve readability
Reduce cognitive strain
Enhance focus retention
Support accessibility-first design
The goal is to make digital reading more inclusive.

Architecture Overview:
Frontend (React + Vite)
⬇
Backend API (FastAPI)
⬇
PDF Processing Engine (PyMuPDF)
Deployed with:
Vercel (Frontend)
Render (Backend)

Key Features:
📄 Upload PDF documents
🔍 Extract structured text from PDFs
🧩 Split-reader mode for improved focus
🧠 Dyslexia-friendly formatting mode
⚡ FastAPI backend with REST endpoints
🌍 Production deployment with CORS configuration

Tech Stack:
Frontend
React
Vite
JavaScript (ES6+)
CSS
Fetch API
Backend
Python
FastAPI
PyMuPDF
Uvicorn
Deployment
Vercel
Render

API Endpoints:
Method	Endpoint	Description
POST	/api/documents	Upload PDF file
GET	/api/documents/{doc_id}/pages	Retrieve extracted pages
GET	/api/documents/{doc_id}/convert?mode=dyslexia	Convert document to accessible format

Running Locally:
1️⃣ Clone the Repository
git clone https://github.com/keebp06/adhd-dyslexia-reader.git
cd adhd-dyslexia-reader
2️⃣ Backend Setup
cd Backend
pip install -r requirements.txt
uvicorn app:app --reload

Backend runs at:
http://localhost:10000
3️⃣ Frontend Setup
In a new terminal:
npm install
npm run dev
Frontend runs at:
http://localhost:5173

🌍 Environment Variables (Production)
For Vercel deployment:
Key	Value
VITE_API_BASE	https://adhd-dyslexia-reader.onrender.com

What I Learned:
Designing accessibility-first user interfaces
Handling multipart file uploads securely
Configuring CORS for cross-origin production deployments
Structuring full-stack React + FastAPI applications
Deploying production systems with environment-based configuration

Future Improvements:
Adjustable font spacing & dyslexia-specific fonts
User accounts & saved documents
Dockerized deployment
Performance optimization for large PDFs

Accessibility Focus:
This project prioritizes inclusive design by reducing:
Visual clutter
Dense line spacing
Overstimulating formatting
Cognitive overload
It aims to make reading digital documents more accessible and inclusive.

Author:
Keerthana Belthur Parthasarathy
M.S. Applied Data Science | Syracuse University
GitHub: https://github.com/keebp06