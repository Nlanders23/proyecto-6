const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')

const userRouter = require('./routes/userRouter')
const clothRouter = require('./routes/clothesRouter')
const cartsRouter = require('./routes/cartsRouter');

const auth = require('./middlewares/authorization')

require('dotenv').config();

connectDB();

app.use(cors());

app.use(express.json());

app.use('/api/user', userRouter);
app.use('/api/cloth', clothRouter);
app.use('/api/carts', cartsRouter);

app.listen(3000, () => {
    console.log('El servidor esta conectado en el puerto 3000')
})
