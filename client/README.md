# RESUME2JOBS — AI Resume Analyzer & Job Match Platform

> Analyze your resume against any job description in seconds. Get a match score, close the skill gaps, and discover real, recently posted jobs that actually fit your profile — all in one place.

[![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**🔗 Live Demo:** [add your deployed link here]
**🎥 Demo Video:** [add a 60–90s Loom/YouTube walkthrough link here]

---

## The Problem

Job seekers apply to dozens of roles without knowing *why* they get rejected — resumes get filtered out by ATS software before a human ever reads them, and there's no easy way to see exactly which skills are missing for a specific job. Meanwhile, sifting through hundreds of stale job board listings to find ones that actually match your profile wastes hours every week.

## The Solution

CareerLens does two things well:

1. **JD-Specific Analysis** — paste any job description, get an instant match score, a skill-gap breakdown (what the JD wants vs. what your resume has), ATS compatibility issues, and concrete suggestions to improve your bullet points.
2. **Live Job Discovery** — using your parsed resume, it pulls recently posted jobs from a real job-market API, ranks them by fit against your profile, and gives you a direct apply link for each one.

No manual keyword-stuffing guesswork. No trawling ten tabs of job boards.

---

## Features

- 🔐 Secure signup/login with JWT auth and hashed passwords
- 📄 PDF/DOCX resume upload, automatically parsed into structured skills, experience, education, and projects
- 🎯 AI-powered match scoring against any pasted job description, with skill-gap and ATS-issue breakdown
- 💼 Real-time job discovery ranked by fit, pulled from live job postings with direct apply links
- 📊 Visual score gauges and color-coded match badges (green/yellow/red) for fast scanning
- 🕓 History of past resume analyses to track improvement over time
- 📱 Fully responsive, clean UI with loading states on every async action

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT, bcrypt |
| AI / Analysis | Google Gemini API |
| Job Data | JSearch API (RapidAPI) |
| File Parsing | pdf-parse, mammoth |

---

## Architecture

```
Client (React)  →  Express REST API  →  MongoDB Atlas
                          ↓
                 Google Gemini API (resume/JD analysis)
                          ↓
                 JSearch API (live job postings, cached daily)
```

Resume parsing and job-result caching are handled server-side to keep third-party API usage efficient and to keep the app responsive even on slower connections.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (free tier works)
- A free Google Gemini API key
- A free RapidAPI account subscribed to JSearch

### Installation

```bash
git clone https://github.com/<your-username>/careerlens.git
cd careerlens

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in `/server`:

```
GEMINI_API_KEY=your_gemini_key
RAPIDAPI_KEY=your_rapidapi_key
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret
```

### Running Locally

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

Visit `http://localhost:5173`.

---

## Screenshots

| Dashboard | Analysis Result | Job Matches |
|---|---|---|
| _add screenshot_ | _add screenshot_ | _add screenshot_ |

---

## What I Learned Building This

- Designing a REST API that cleanly separates auth, parsing, and AI-analysis concerns
- Handling unreliable LLM output (malformed JSON) gracefully in a production-style flow instead of trusting it blindly
- Working within third-party API rate limits by designing a caching layer instead of calling live on every request
- End-to-end deployment of a MERN app across separate frontend/backend hosts, including CORS and environment configuration

## Roadmap

- [ ] Cosine-similarity-based job ranking as a faster alternative to per-job LLM scoring
- [ ] Cover letter generator tailored to each JD
- [ ] Multi-source job aggregation (Adzuna, Arbeitnow) alongside JSearch
- [ ] Rate-limiting middleware for production hardening

---

## Author

**Ashish Tiwari**
Final-year Computer Science Engineering student, Quantum University, Roorkee
[LinkedIn](#) · [GitHub](#) · [Email](#)

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
