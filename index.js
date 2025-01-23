const express = require('express');
const app = express();
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')

const connectDB = require('./config/db');

const User = require('./models/user')
const Clothes = require('./models/clothes')

const auth = require('./middlewares/authorization')

require('dotenv').config();

connectDB();

app.use(cors());
app.use(express.json());

app.listen(3000, () => {
    console.log('El servidor esta conectado en el puerto 3000')
})
