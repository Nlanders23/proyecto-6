const { default: mongoose } = require('mongoose');
const moongosee = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('connected to the database')
    } catch (error) {
        console.log(error);
        process.exit(1);  
    }
}
module.exports = connectDB;