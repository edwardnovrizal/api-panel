const mongoose = require("mongoose");

// Fungsi untuk koneksi ke MongoDB menggunakan Mongoose
async function connectDatabase() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.DB_NAME || "api_panel";
    
    // MongoDB connection options
    const options = {
      dbName: dbName,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    };

    await mongoose.connect(uri, options);
    
    console.log("✅ Connected to MongoDB successfully");
    console.log(`📊 Database: ${dbName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error("❌ Database connection error:", error);
    throw error;
  }
}

// Fungsi untuk mendapatkan database instance (compatibility)
function getDatabase() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Database not connected. Call connectDatabase() first.");
  }
  return mongoose.connection.db;
}

// Fungsi untuk disconnect database
async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error disconnecting from database:", error);
  }
}

// Event listeners untuk connection
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected");
});

module.exports = {
  connectDatabase,
  getDatabase,
  disconnectDatabase,
  mongoose
}; 