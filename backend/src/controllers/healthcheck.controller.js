import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const healthcheck = asyncHandler(async (req, res) => {
    // Check if MongoDB is actually connected (1 = connected)
    const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

    const healthData = {
        status: "OK",
        message: "Server is running smoothly",
        uptime: `${process.uptime().toFixed(2)} seconds`,
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            host: mongoose.connection.host
        },
        environment: process.env.NODE_ENV || "development"
    };

    return res
        .status(200)
        .json(new ApiResponse(200, healthData, "Healthcheck successful"));
});

export { healthcheck };