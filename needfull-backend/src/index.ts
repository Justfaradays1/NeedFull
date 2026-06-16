// WHAT: Main Express server with Socket.io for NeedFull backend
// WHY: Entry point for all HTTP requests and real-time WebSocket connections
// FUTURE: Add request logging middleware, add error tracking with Sentry, add graceful shutdown

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import env from "./config/env";

// WHAT: Import route modules
// WHY: Modular route organization
import authRoutes from "./routes/authRoutes";
import walletRoutes from "./routes/wallet.routes";
import webhookRoutes from "./routes/webhookRoutes";

// WHAT: Initialize Express app
const app = express();
const server = createServer(app);

// WHAT: Initialize Socket.io for real-time notifications
// WHY: Push notifications to connected clients without polling
export const io = new SocketIOServer(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

// WHAT: Global middleware - Security headers
app.use(helmet());

// WHAT: CORS configuration
// WHY: Allow frontend to make requests to backend
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// WHAT: Compression middleware
// WHY: Reduce response payload size for slow networks
app.use(compression());

// WHAT: Request logging
// WHY: Track all requests for debugging and monitoring
app.use(morgan("combined"));

// WHAT: JSON body parser - with 100kb limit for standard requests
// WHY: Parse JSON bodies, limit size to prevent abuse
app.use(express.json({ limit: "100kb" }));

// WHAT: URL-encoded body parser
// WHY: Parse form submissions
app.use(express.urlencoded({ limit: "100kb", extended: true }));

// WHAT: Mount webhook routes BEFORE json() middleware
// WHY: Webhooks need raw body for signature verification
app.use(webhookRoutes);

// WHAT: Mount authentication routes
// WHY: User signup, login, token refresh
app.use("/api/auth", authRoutes);

// WHAT: Mount wallet routes
// WHY: Balance, transactions, funding methods
app.use("/api/wallet", walletRoutes);

// WHAT: Mount chat routes
// WHY: Conversations and messages API
import chatRoutes from "./routes/chat.routes";
app.use("/api/chat", chatRoutes);

// WHAT: Mount notification routes
// WHY: Notification management API
import notificationsRoutes from "./routes/notifications.routes";
app.use("/api/notifications", notificationsRoutes);

// WHAT: Mount user routes
// WHY: Profile, nearby runners, verification
import usersRoutes from "./routes/users.routes";
app.use("/api/users", usersRoutes);

// WHAT: Mount admin routes
// WHY: Dashboard, user management, deposits, withdrawals, reports, tasks, transactions
import adminRoutes from "./routes/admin.routes";
app.use("/api/admin", adminRoutes);

// WHAT: Mount task routes
// WHY: Task CRUD, listing, lifecycle
import tasksRoutes from "./routes/tasks.routes";
app.use("/api/tasks", tasksRoutes);

// WHAT: Mount application routes
// WHY: Task application workflow
import applicationsRoutes from "./routes/applications.routes";
app.use("/api/applications", applicationsRoutes);

// WHAT: Mount category routes
// WHY: Task category listing and management
import categoriesRoutes from "./routes/categories.routes";
app.use("/api/categories", categoriesRoutes);

// WHAT: Mount review routes
// WHY: Review creation and listing
import reviewsRoutes from "./routes/reviews.routes";
app.use("/api/reviews", reviewsRoutes);

// WHAT: Mount report routes
// WHY: User report creation and listing
import reportsRoutes from "./routes/reports.routes";
app.use("/api/reports", reportsRoutes);

// WHAT: Mount upload routes
// WHY: File uploads (receipts, avatars, etc.)
import uploadRoutes from "./routes/upload.routes";
app.use("/api/upload", uploadRoutes);

// WHAT: Health check endpoint
// WHY: Uptime monitoring and deployment verification
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// WHAT: Root API info
// WHY: Documentation of API
app.get("/api", (_req, res) => {
  res.json({
    name: "NeedFull Backend API",
    version: "1.0.0",
    description: "Student task marketplace platform",
    endpoints: {
      auth: "/api/auth",
      wallet: "/api/wallet",
      tasks: "/api/tasks",
      applications: "/api/applications",
      categories: "/api/categories",
      chat: "/api/chat",
      notifications: "/api/notifications",
      users: "/api/users",
      reviews: "/api/reviews",
      reports: "/api/reports",
      admin: "/api/admin",
      upload: "/api/upload/receipt",
      health: "/api/health",
    },
  });
});

// WHAT: 404 handler
// WHY: Clear error for non-existent routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// WHAT: Global error handler
// WHY: Catch unhandled errors and return consistent error responses
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[Error Handler]", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(env.NODE_ENV === "development" && { error: err }),
    });
  },
);

// WHAT: Socket.io connection handler
// WHY: Set up real-time bidirectional communication
io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // WHAT: User joins their notification room
  socket.on("join", (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`[Socket.io] User ${userId} joined room user:${userId}`);
  });

  // WHAT: Join a conversation room for real-time messaging
  socket.on("join:conv", (conversationId: string) => {
    socket.join(`conv:${conversationId}`);
    console.log(`[Socket.io] Socket ${socket.id} joined conv:${conversationId}`);
  });

  // WHAT: Leave a conversation room
  socket.on("leave:conv", (conversationId: string) => {
    socket.leave(`conv:${conversationId}`);
  });

  // WHAT: Relay new message to conversation room
  // WHY: Real-time delivery after REST POST saves to DB
  socket.on("send:message", (data: { conversationId: string; messageId: string; senderId: string; content: string; createdAt: string }) => {
    socket.to(`conv:${data.conversationId}`).emit("new:message", data);
  });

  // WHAT: Typing indicator — broadcast to other participants
  socket.on("typing", (data: { conversationId: string; userId: string }) => {
    socket.to(`conv:${data.conversationId}`).emit("partner:typing", { userId: data.userId });
  });

  socket.on("stop:typing", (data: { conversationId: string; userId: string }) => {
    socket.to(`conv:${data.conversationId}`).emit("partner:stop:typing", { userId: data.userId });
  });

  // WHAT: Handle disconnection
  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

import { initCronJobs } from "./jobs/cron.js";

// WHAT: Start server
// WHY: Listen for incoming requests
initCronJobs();

const PORT = env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     NeedFull Backend - Running         ║
║     Environment: ${env.NODE_ENV.toUpperCase().padEnd(24)}║
║     Port: ${PORT.toString().padEnd(33)}║
║     Frontend: ${env.FRONTEND_URL.padEnd(28)}║
╚════════════════════════════════════════╝
  `);
});

// WHAT: Handle graceful shutdown
// WHY: Clean up connections on process termination
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("[Server] Server closed");
    process.exit(0);
  });
});

export default app;
