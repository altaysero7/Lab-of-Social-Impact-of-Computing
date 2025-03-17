# Sustainable Image Optimization with CDN & Browser Extension

A system that detects and optimizes unnecessarily heavy images by redirecting them through a CDN server, converting them to lighter formats like WebP, and providing real-time impact visualization. The project consists of a browser extension, a CDN server, and a dashboard to track the environmental and performance benefits.

## 🌍 Project Overview

Many websites serve images in outdated or excessively high-quality formats, leading to unnecessary data transfer, higher energy consumption, and longer loading times. This system solves that by:

* Intercepting image requests via a browser extension

* Redirecting images through a CDN that optimizes them

* Converting them into more efficient formats like WebP

* Providing real-time insights into data savings and sustainability impact

## 🛠️ Technologies Used

* CDN Server: Express.js, Sharp, Socket.IO, Fetch API

* Browser Extension: WebExtensions API (Manifest v3), Declarative Net Request

* Dashboard: Chart.js, JavaScript, HTML, CSS

## ⚙️ Installation & Setup

### 1️⃣ Set Up the CDN Server

1. Clone the repository

- git clone https://github.com/yourusername/sustainable-image-optimization.git
cd sustainable-image-optimization/cdn-server

2. Install dependencies

- npm install

3. Run the CDN server

- node server.js

4. Access the dashboard at http://localhost:3000/dashboard

### 2️⃣ Install the Browser Extension

1. Open Chrome (or any Chromium-based browser).

2. Navigate to chrome://extensions/.

3. Enable Developer mode (top-right corner).

4. Click Load Unpacked and select the browser-extension folder.

5. The extension will now redirect image requests to the CDN!

### 📊 How It Works

1. The browser extension intercepts image requests and redirects them to the CDN server.

2. The CDN server fetches the image, converts it to WebP (or another optimized format), and serves it.

3. The dashboard visualizes key performance metrics, including:

* Total bytes saved

* Energy saved (in Joules)

* Equivalent sustainability impact (e.g., LED bulb runtime, smartphone charges)
