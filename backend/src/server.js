// src/server.js
import dotenv from 'dotenv';
// Load env variables FIRST before importing other files that might need them
dotenv.config({ path: "./.env" });

import connectDB from './db/index.js';
import { app } from './app.js';

connectDB()
    .then(() => {
        app.on('error', (error) => {
            console.log("Error while connecting express app: ", error);
            throw error;
        });

        const port = process.env.PORT || 8000;
        app.listen(port, () => {
            console.log(`🚀 Server is running on port: ${port}`);
        });
    })
    .catch((error) => {
        console.log(`❌ MongoDB connection failed: ${error}`);
        process.exit(1); // Added this to kill the server if DB fails
    });