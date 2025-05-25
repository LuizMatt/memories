const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set('strictQuery', true);

async function connectDB() {
    await mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jnltlbx.mongodb.net/`);

    console.log('MongoDB connected');
}

connectDB().catch(err => {
    console.error('MongoDB connection error:', err);
});
module.exports = mongoose;