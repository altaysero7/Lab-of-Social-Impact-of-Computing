import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Global statistics
let totalOriginalBytes = 0;
let totalConvertedBytes = 0;

// Constants for additional metrics:
const energyFactor = 0.01; // Joules saved per byte saved (arbitrary value)
const networkThroughput = 1.25e6; // bytes per second (e.g. ~10 Mbps)

app.get('/convert', async (req, res) => {
    // Reassemble the original image URL from the query parameters.
    let imageUrl = req.query.img;
    if (!imageUrl) {
        return res.status(400).send('Missing "img" query parameter.');
    }
    // If extra query parameters were parsed (because inner URL wasn’t encoded), reassemble.
    const extraParams = { ...req.query };
    delete extraParams.img;
    if (Object.keys(extraParams).length > 0) {
        const separator = imageUrl.includes('?') ? '&' : '?';
        const extras = new URLSearchParams(extraParams).toString();
        imageUrl = imageUrl + separator + extras;
    }

    try {
        // Fetch the original image.
        const response = await fetch(imageUrl);
        const originalContentType = response.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        const originalBytes = imageBuffer.length;
        totalOriginalBytes += originalBytes;

        let servedBuffer;
        let servedContentType;
        try {
            // Attempt conversion to WebP (80% quality).
            const convertedImageBuffer = await sharp(imageBuffer)
                .webp({ quality: 80 })
                .toBuffer();
            servedBuffer = convertedImageBuffer;
            servedContentType = 'image/webp';
            totalConvertedBytes += convertedImageBuffer.length;
            console.log(`Converted image from ${imageUrl} to WebP.`);
        } catch (convErr) {
            console.error('Error converting image, serving original image:', convErr);
            servedBuffer = imageBuffer;
            servedContentType = originalContentType;
            totalConvertedBytes += originalBytes;
            console.log(`Fallback: served original image from ${imageUrl}`);
        }

        // Calculate bytes saved, energy saved, time saved, and a sustainability index.
        const bytesSaved = totalOriginalBytes - totalConvertedBytes;
        const energySaved = bytesSaved * energyFactor; // in Joules
        const timeSaved = bytesSaved / networkThroughput; // in seconds
        // An arbitrary sustainability index // might delete later
        const sustainabilityIndex = (energySaved * 0.5) + (timeSaved * 100);
        const conversionRate = totalOriginalBytes > 0
            ? (bytesSaved / totalOriginalBytes) * 100
            : 0;

        // Emit updated statistics to all connected dashboard clients.
        io.emit('stats', {
            totalOriginalBytes,
            totalConvertedBytes,
            bytesSaved,
            energySaved,
            timeSaved,
            sustainabilityIndex,
            conversionRate
        });

        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', servedContentType);
        res.send(servedBuffer);
    } catch (err) {
        console.error('Error processing image:', err);
        res.status(500).send('Error processing image.');
    }
});

// Serve a simple dashboard page.
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`CDN server running on port ${PORT}`);
});
