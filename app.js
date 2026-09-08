const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const { NODE_ENV, FRONTEND_URL } = require("./config/env.config");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const chatbotRoutes = require("./routes/chatbot.routes");
const petRoutes = require("./routes/pet.routes");
const medicalRecordLookupRoutes = require("./routes/medicalRecordLookup.routes");
const vetProfileRoutes = require("./routes/vetProfile.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const shelterRoutes = require("./routes/shelter.routes");
const shelterPetRoutes = require("./routes/shelterPet.routes");
const adoptionRoutes = require("./routes/adoption.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const careArticleRoutes = require("./routes/careArticle.routes");
const reminderRoutes = require("./routes/reminder.routes");
const notificationRoutes = require("./routes/notification.routes");
const reviewRoutes = require("./routes/review.routes");
const adminRoutes = require("./routes/admin.routes");
const contactRoutes = require("./routes/contact.routes");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

if (NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// General API rate limiter (auth routes get their own tighter limiter if needed later)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VetaGuard API is running",
    data: {
      env: NODE_ENV,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/medical-records", medicalRecordLookupRoutes);
app.use("/api/vets", vetProfileRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/shelter-pets", shelterPetRoutes);
app.use("/api/adoptions", adoptionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/articles", careArticleRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
