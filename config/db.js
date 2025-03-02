const mongoose = require('mongoose');
const SizeCloth = require('../models/Size');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        await SizeCloth.init();
        console.log('connected to the database')
    } catch (error) {
        console.log(error);
        process.exit(1);  
    }
}
module.exports = connectDB;