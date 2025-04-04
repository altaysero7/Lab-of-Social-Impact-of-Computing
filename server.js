import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const statsFile = __dirname + '/stats.json';
const historyFile = __dirname + '/history.json';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Global statistics – try to load previous stats from file if it exists.
let totalOriginalBytes = 0;
let totalConvertedBytes = 0;
let totalBytesSaved = 0;
let countConverted = 0; // images converted to WebP
let countOriginal = 0;  // images served in original format
let userStats = {};     // maps user identifier (IP) to number of images processed

if (existsSync(statsFile)) {
    try {
        const saved = JSON.parse(readFileSync(statsFile, 'utf-8'));
        totalOriginalBytes = saved.totalOriginalBytes || 0;
        totalConvertedBytes = saved.totalConvertedBytes || 0;
        totalBytesSaved = saved.totalBytesSaved || 0;
        countConverted = saved.countConverted || 0;
        countOriginal = saved.countOriginal || 0;
        userStats = saved.userStats || {};
        console.log('Loaded previous stats from file.');
    } catch (e) {
        console.error('Error loading stats file, starting from zero:', e);
    }
}

// Global history array for time-series data.
let history = [];
if (existsSync(historyFile)) {
    try {
        history = JSON.parse(readFileSync(historyFile, 'utf-8'));
        console.log('Loaded previous history from file.');
    } catch (e) {
        console.error('Error loading history file, starting with empty history:', e);
    }
}

/*
    Constants for additional metrics:

    energyFactor: Based on Baliga et al. (2011), Table II (pp. 156–157) of
    "Green Cloud Computing: Balancing Energy in Processing, Storage, and Transport"
    (DOI:10.1109/JPROC.2011.2100192), the estimated energy cost for data transport is in the
    range of 1.0×10⁻⁶ to 2.0×10⁻⁶ Joules per byte. We adopt an average value of 1.6×10⁻⁶ Joules per byte.
*/
const energyFactor = 1.6e-6; // Joules per byte

/*
    networkThroughput: According to broadband speed statistics from Speedtest.net,
    average download speeds are around 10 Mbps (~1.25e6 bytes/sec).
*/
const networkThroughput = 1.25e6; // bytes per second

// Emit current stats and history to newly connected clients.
io.on('connection', (socket) => {
    const energySaved = totalBytesSaved * energyFactor;
    const timeSaved = totalBytesSaved / networkThroughput;
    const conversionRate = totalOriginalBytes > 0
        ? (totalBytesSaved / totalOriginalBytes) * 100
        : 0;
    const totalImages = countConverted + countOriginal;
    const uniqueUsers = Object.keys(userStats).length;

    // Emit current stats.
    socket.emit('stats', {
        totalOriginalBytes,
        totalConvertedBytes,
        bytesSaved: totalBytesSaved,
        energySaved,
        timeSaved,
        conversionRate,
        countConverted,
        countOriginal,
        totalImages,
        uniqueUsers
    });

    // Emit historical data.
    socket.emit('initHistory', history);
});

app.get('/convert', async (req, res) => {
    // Reassemble the original image URL.
    let imageUrl = req.query.img;
    if (!imageUrl) {
        return res.status(400).send('Missing "img" query parameter.');
    }
    const extraParams = { ...req.query };
    delete extraParams.img;
    if (Object.keys(extraParams).length > 0) {
        const separator = imageUrl.includes('?') ? '&' : '?';
        const extras = new URLSearchParams(extraParams).toString();
        imageUrl = imageUrl + separator + extras;
    }

    try {
        // Identify the user using IP (or x-forwarded-for header if behind a proxy).
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
        userStats[userIP] = (userStats[userIP] || 0) + 1;

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
            if (convertedImageBuffer.length < originalBytes) {
                servedBuffer = convertedImageBuffer;
                servedContentType = 'image/webp';
                totalConvertedBytes += convertedImageBuffer.length;
                totalBytesSaved += (originalBytes - convertedImageBuffer.length);
                countConverted++;
            } else {
                servedBuffer = imageBuffer;
                servedContentType = originalContentType;
                totalConvertedBytes += originalBytes;
                countOriginal++;
            }
            console.log(`Processed image from ${imageUrl}.`);
        } catch (convErr) {
            console.error('Error converting image, serving original image:', convErr);
            servedBuffer = imageBuffer;
            servedContentType = originalContentType;
            totalConvertedBytes += originalBytes;
            countOriginal++;
            console.log(`Fallback: served original image from ${imageUrl}`);
        }

        const bytesSaved = totalBytesSaved;
        const energySaved = bytesSaved * energyFactor;
        const timeSaved = bytesSaved / networkThroughput;
        const conversionRate = totalOriginalBytes > 0 ? (bytesSaved / totalOriginalBytes) * 100 : 0;
        const totalImages = countConverted + countOriginal;
        const uniqueUsers = Object.keys(userStats).length;

        // Record a new history entry.
        const record = {
            timestamp: Date.now(),
            totalOriginalBytes,
            totalConvertedBytes,
            bytesSaved: totalBytesSaved
        };
        history.push(record);
        try {
            writeFileSync(historyFile, JSON.stringify(history));
        } catch (e) {
            console.error('Error writing history file:', e);
        }

        // Persist overall stats.
        const statsToSave = {
            totalOriginalBytes,
            totalConvertedBytes,
            totalBytesSaved,
            countConverted,
            countOriginal,
            userStats
        };
        try {
            writeFileSync(statsFile, JSON.stringify(statsToSave));
        } catch (e) {
            console.error('Error writing stats file:', e);
        }

        // Emit updated stats.
        io.emit('stats', {
            totalOriginalBytes,
            totalConvertedBytes,
            bytesSaved: totalBytesSaved,
            energySaved,
            timeSaved,
            conversionRate,
            countConverted,
            countOriginal,
            totalImages,
            uniqueUsers
        });

        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', servedContentType);
        res.send(servedBuffer);
    } catch (err) {
        console.error('Error processing image:', err);
        res.status(500).send('Error processing image.');
    }
});

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`CDN server running on port ${PORT}`);
});
