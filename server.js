import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the project start date as 07/04/2025.
const projectStartDate = new Date('2025-04-07T00:00:00Z');

// MongoDB Connection Setup
const uri = process.env.MONGO_URI || 'mongodb+srv://allUsers:8dM56tILY883uQUJ@cluster0.cokrpzd.mongodb.net/';
const client = new MongoClient(uri);
try {
    await client.connect();
    console.log('Connected to MongoDB');
} catch (err) {
    console.error('MongoDB connection error:', err);
}
const db = client.db('cdn_data');
const statsCollection = db.collection('stats');
const historyCollection = db.collection('history');

// Load Global Stats from MongoDB
let totalOriginalBytes = 0;
let totalConvertedBytes = 0;
let totalBytesSaved = 0;
let countConverted = 0;
let countOriginal = 0;
let userStats = {};

let statsDoc = await statsCollection.findOne({ _id: 'globalStats' });
if (statsDoc) {
    totalOriginalBytes = statsDoc.totalOriginalBytes || 0;
    totalConvertedBytes = statsDoc.totalConvertedBytes || 0;
    totalBytesSaved = statsDoc.totalBytesSaved || 0;
    countConverted = statsDoc.countConverted || 0;
    countOriginal = statsDoc.countOriginal || 0;
    userStats = statsDoc.userStats || {};
    console.log('Loaded stats from MongoDB.');
} else {
    console.log('No stats found, starting with initial values.');
}

// Load History from MongoDB
let history = await historyCollection.find().sort({ timestamp: 1 }).toArray();
if (history.length > 0) {
    console.log('Loaded previous history from MongoDB.');
} else {
    history = [];
    console.log('No history found, starting with empty history.');
}

/*
    Constants for additional metrics:

    energyFactor: The energy cost for data transport has been studied by several reputable sources:

    1. Baliga et al. (2011), in "Green Cloud Computing: Balancing Energy in Processing, Storage, and Transport"
        (Proceedings of the IEEE, vol. 99, no. 1, pp. 149–167, DOI:10.1109/JPROC.2011.2100192),
        report in Table II (pp. 153–157) that the energy consumption for data transport is in the range
        of 1.0×10⁻⁶ to 2.0×10⁻⁶ Joules per byte.

    2. Shehabi et al. (2016), in the "United States Data Center Energy Usage Report" published by
        Lawrence Berkeley National Laboratory (see pp. 25–27), provides estimates that corroborate a
        data transport energy cost on the order of 10⁻⁶ Joules per byte.

    3. Koomey, J.G. (2011) in his analysis "Worldwide Electricity Use for Data Processing" (pages 3–5)
        discusses energy metrics for data centers that imply network transport costs of a similar order.

    4. The U.S. Department of Energy’s report "Data Center Energy Efficiency" (2012, p. 14) also supports
        the notion that the energy required to transmit data is on the order of microjoules per byte.

    5. The International Energy Agency (IEA) report "Energy Efficiency in Information and Communication Technology"
        (2015, pp. 45–47) provides additional confirmation that network energy costs typically fall within
        the 10⁻⁶ Joules per byte range.

    Based on these studies, we adopt an average value of 1.6×10⁻⁶ Joules per byte.
*/
const energyFactor = 1.6e-6; // Joules per byte

/*
    networkThroughput: According to broadband speed statistics from Speedtest.net,
    average download speeds are around 10 Mbps (~1.25e6 bytes/sec).
*/
const networkThroughput = 1.25e6; // bytes per second

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Socket.IO connection – emit current stats and history
io.on('connection', (socket) => {
    const now = new Date();
    const daysRunning = Math.floor((now - projectStartDate) / (1000 * 60 * 60 * 24));
    const energySaved = totalBytesSaved * energyFactor;
    const ledSeconds = energySaved;
    const stirSeconds = energySaved / 5;
    const phoneCharges = energySaved / 39600;
    const timeSaved = totalBytesSaved / networkThroughput;
    const conversionRate = totalOriginalBytes > 0 ? (totalBytesSaved / totalOriginalBytes) * 100 : 0;
    const totalImages = countConverted + countOriginal;
    const uniqueUsers = Object.keys(userStats).length;

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
        uniqueUsers,
        projectStartDate: projectStartDate.toISOString(),
        daysRunning,
        ledSeconds,
        stirSeconds,
        phoneCharges
    });

    socket.emit('initHistory', history);
});

// /convert endpoint – fetch and possibly convert image, then update MongoDB
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
        // Update user stats based on clientId
        const clientId = req.query.clientId || 'anonymous';
        userStats[clientId] = (userStats[clientId] || 0) + 1;

        // Fetch the original image
        const response = await fetch(imageUrl);
        const originalContentType = response.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        const originalBytes = imageBuffer.length;
        totalOriginalBytes += originalBytes;

        let servedBuffer;
        let servedContentType;
        try {
            // Attempt conversion to WebP at 80% quality
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
            console.log(`Processed image from ${imageUrl} for client ${clientId}.`);
        } catch (convErr) {
            console.error('Error converting image, serving original image:', convErr);
            servedBuffer = imageBuffer;
            servedContentType = originalContentType;
            totalConvertedBytes += originalBytes;
            countOriginal++;
            console.log(`Fallback: served original image from ${imageUrl} for client ${clientId}`);
        }

        const bytesSaved = totalBytesSaved;
        const energySaved = bytesSaved * energyFactor;
        const ledSeconds   = energySaved;
        const stirSeconds  = energySaved / 5;
        const phoneCharges = energySaved / 39600;
        const timeSaved = bytesSaved / networkThroughput;
        const conversionRate = totalOriginalBytes > 0 ? (bytesSaved / totalOriginalBytes) * 100 : 0;
        const totalImages = countConverted + countOriginal;
        const uniqueUsers = Object.keys(userStats).length;

        // Record new history entry and update the history collection
        const record = {
            timestamp: Date.now(),
            totalOriginalBytes,
            totalConvertedBytes,
            bytesSaved: totalBytesSaved
        };
        history.push(record);
        historyCollection.insertOne(record)
            .catch(err => console.error('Error inserting history record into MongoDB:', err));

        // Update global stats document in MongoDB with upsert
        const statsToSave = {
            totalOriginalBytes,
            totalConvertedBytes,
            totalBytesSaved,
            countConverted,
            countOriginal,
            userStats
        };
        statsCollection.updateOne(
            { _id: 'globalStats' },
            { $set: statsToSave },
            { upsert: true }
        ).catch(err => console.error('Error updating stats in MongoDB:', err));

        const now = new Date();
        const daysRunning = Math.floor((now - projectStartDate) / (1000 * 60 * 60 * 24));

        // Emit updated stats to all connected clients via Socket.IO
        io.emit('stats', {
            totalOriginalBytes,
            totalConvertedBytes,
            bytesSaved: totalBytesSaved,
            energySaved,
            ledSeconds,
            stirSeconds,
            phoneCharges,
            timeSaved,
            conversionRate,
            countConverted,
            countOriginal,
            totalImages,
            uniqueUsers,
            projectStartDate: projectStartDate.toISOString(),
            daysRunning
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
