const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');





require('dotenv').config();

connectDB();

app.use(cors());
app.use(express.json());

app.listen(3000, () => {
    console.log('El servidor esta conectado en el puerto 3000')
})
