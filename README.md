# Sustainable Image Optimization with CDN & Browser Extension

A system that detects and optimizes unnecessarily heavy images by redirecting them through a CDN server, converting them to lighter formats like WebP, and providing real-time impact visualization. The project consists of a browser extension, a CDN server, and a dashboard to track the environmental and performance benefits. This project is developed as part of the "Lab of Social Impact of Computing" course at the University of Trento, Italy.

---

## 🌍 Project Overview

Many websites serve images in outdated or excessively high‑quality formats, resulting in unnecessary data transfer, increased energy consumption, and slower page loads. This system addresses these issues by:

- **Intercepting Image Requests:**
  The browser extension intercepts image requests using the Declarative Net Request API (Manifest V3) and dynamically injects a unique, anonymized client ID to track usage in a privacy‑friendly manner.

- **Optimizing Images via a CDN Server:**
  The CDN server (built with Express.js, Sharp, Socket.IO, and Node‑Fetch) fetches the original image, converts it to a more efficient format (WebP), and only serves the converted image if it reduces file size. Otherwise, it falls back to serving the original image.

- **Real‑Time Dashboard:**
  A dashboard (built with Chart.js, HTML, CSS, and JavaScript) visualizes key metrics over time, such as total bytes saved, energy saved (in Joules), sustainability equivalents (e.g., LED bulb runtime, smartphone charges, laptop runtime), performance improvements, and user statistics (unique users and images processed per user).

- **Persistent Statistics:**
  All key statistics and historical data (for charting) are persisted to files on the server. (Note: For multi‑instance or long‑term production use, a database or cloud storage solution is recommended.)

---

## 🛠️ Technologies Used

- **CDN Server:**
  Express.js, Sharp, Socket.IO, Node‑Fetch
  _Persistent file‑based storage for overall stats and history._

- **Browser Extension:**
  WebExtensions API (Manifest V3), Declarative Net Request, chrome.storage
  _Generates a unique, anonymized client ID for each installation to track usage without compromising privacy._

- **Dashboard:**
  Chart.js, JavaScript, HTML, CSS
  _Displays real‑time and historical performance, energy, and user metrics._

- **Deployment:**
  Render (public hosting)

---

## ⚙️ Installation & Setup
- **1️⃣ Set Up the CDN Server**
  Clone the repository
  git clone https://github.com/yourusername/sustainable-image-optimization.git cd sustainable-image-optimization/cdn-server
  Install dependencies
  npm install
  Run the CDN server
  node server.js
  Access the dashboard at http://localhost:3000/dashboard
- **2️⃣ Install the Browser Extension**
  Open Chrome (or any Chromium-based browser).

  Navigate to chrome://extensions/.

  Enable Developer mode (top-right corner).

  Click Load Unpacked and select the browser-extension folder.

  The extension will now redirect image requests to the CDN!

---

## 📊 How It Works
Image Interception & Redirection:
The browser extension intercepts image requests and redirects them to the CDN server with a dynamically injected client ID.

Image Optimization:
The CDN server fetches the original image, converts it to WebP (if the conversion reduces file size), and serves the smaller image—thus saving bytes and energy.

Statistics & History:
The server keeps track of:

Total original bytes, converted bytes, and bytes saved.

Energy saved (Joules) and equivalent metrics (e.g., LED bulb runtime, smartphone charges, laptop runtime).

Performance metrics such as time saved and conversion rate.

Per‑user statistics using anonymous client IDs.

A complete history of stats for charting over time.

Dashboard Visualization:
The dashboard displays these metrics in real‑time with human‑readable formatting. Historical data is persisted, so even after a restart, previous data is loaded and shown on the chart.