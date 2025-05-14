# 🌿 Sustainable Image Optimization with CDN & Browser Extension

A system designed to detect and optimize unnecessarily large images by redirecting them through a CDN server, converting them to lighter formats like WebP, and providing real-time impact visualization. This project comprises a browser extension, a CDN server, and a dashboard to monitor environmental and performance benefits. It was developed as part of the "Lab of Social Impact of Computing" course at the University of Trento, Italy.

## 🌍 Project Overview

Many websites serve images in outdated or excessively high-quality formats, resulting in unnecessary data transfer, increased energy consumption, and slower page loads. This system addresses these issues through:

### ✅ Intercepting Image Requests

The browser extension intercepts image requests using the Declarative Net Request API (Manifest V3).

It dynamically injects a unique, anonymized client ID to track usage in a privacy-friendly manner.

### ✅ Optimizing Images via CDN

The CDN server, built with Express.js, Sharp, Socket.IO, and Node‑Fetch, fetches the original images.

It converts images to efficient formats (e.g., WebP) and serves the converted image only if it significantly reduces file size. Otherwise, it serves the original image.

### ✅ Real-Time Dashboard

A dashboard created with Chart.js, HTML, CSS, and JavaScript visualizes metrics such as:

- Total bytes saved

- Energy savings (in Joules)

- Sustainability equivalents (e.g., LED bulb runtime, smartphone charges, laptop runtime)

- Performance improvements

### ✅ Persistent Statistics

Key statistics and historical data are persisted to files on the server.

Note: For multi-instance or long-term production, integrating a database or cloud storage is recommended.

## 🛠️ Technologies Used

- CDN Server

- Express.js, Sharp, Socket.IO, Node‑Fetch

- Persistent file-based storage for statistics and historical data.

- Browser Extension

- WebExtensions API (Manifest V3), Declarative Net Request, chrome.storage

- Generates unique, anonymized client IDs for usage tracking.

- Dashboard

- Chart.js, JavaScript, HTML, CSS

- Displays real-time and historical performance, energy, and user metrics.

- Deployment

- Publicly hosted using Render.

## ⚙️ Installation & Setup

### 1️⃣ Set Up the CDN Server

- Clone the repository from GitHub.

- Navigate to the sustainable-image-optimization/cdn-server directory.

- Install dependencies with npm.

- Run the CDN server with Node.

- Access the dashboard at: http://localhost:3000/dashboard

### 2️⃣ Install the Browser Extension

**Note**: You can find the broswer extension in a different tree located in: https://github.com/altaysero7/Lab-of-Social-Impact-of-Computing/tree/browser-extension

- Open Chrome (or any Chromium-based browser).

- Navigate to: chrome://extensions/

- Enable Developer mode (top-right corner).

- Click Load Unpacked and select the browser-extension folder.

- The extension will automatically redirect image requests to the CDN.

## 📊 How It Works

### 🔄 Image Interception & Redirection

The browser extension intercepts image requests and redirects them to the CDN server, embedding a dynamic, anonymous client ID.

### ⚡ Image Optimization

CDN server retrieves the original images, converts them to WebP if beneficial, and serves the optimized images—saving bandwidth and reducing energy use.

### 📈 Statistics & History

The server records:

- Original bytes vs. converted bytes

- Energy savings (in Joules)

- Equivalents like LED bulb usage, smartphone charges, laptop runtime

- Performance metrics (time savings, conversion rate)

- Anonymous per-user metrics

- Historical data for trend analysis

### 📉 Dashboard Visualization

Provides real-time visualization of metrics with clear, user-friendly formatting.

Historical data persists, ensuring continuity across sessions.
