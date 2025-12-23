# Signature Injection Engine (MVP)

A prototype **Signature Injection Engine** that ensures fields placed in a responsive web UI (browser)
are burned into a static PDF at the **exact same location**, independent of screen size or device.

This project was built as part of a Full Stack (MERN) assignment to demonstrate **coordinate
normalization, PDF coordinate translation, and audit-grade document integrity**.

---

## 🚀 Problem Statement

Web browsers and PDFs use fundamentally different coordinate systems:

- **Browser**
  - CSS pixels
  - Origin at **top-left**
  - Responsive (varies by screen size)

- **PDF**
  - Points (72 DPI)
  - Origin at **bottom-left**
  - Static (A4 dimensions never change)

Naively storing pixel coordinates breaks field placement across devices.
This project solves that problem deterministically.

---

## 🧠 Core Approach

**Key principle:**
> Store field positions as normalized percentages, not pixels.

### Why this works
- Responsive UI → recalculates pixels from percentages
- Static PDF → recalculates points from percentages
- No drift between frontend and backend

---

## ✨ Features

### Frontend (React + PDF.js)
- Render A4 PDF using `react-pdf`
- Drag & resize fields (Signature, Text, Image, Date, Radio)
- Field positions stored as normalized coordinates (0–1)
- Responsive behavior: placement remains correct across screen sizes
- In-browser signature drawing (canvas)

### Backend (Node + Express + pdf-lib)
- Endpoint: `POST /sign-pdf`
- Converts normalized coordinates → PDF points
- Correct Y-axis inversion (browser → PDF)
- Maintains signature aspect ratio (no stretching)
- Burns fields directly into PDF
- Returns signed PDF URL

### Security / Audit Trail
- SHA-256 hash of original PDF
- SHA-256 hash of signed PDF
- Hashes stored in MongoDB to prove document integrity

---

## 📐 Coordinate Translation Logic

### Normalized format (stored from frontend)
```json
Last Field Position:
X: 24.89%
Y: 33.55%
W: 15.00%
H: 15.00%



start frontend

npm install
npm run dev


start backend
npm install
npm start
