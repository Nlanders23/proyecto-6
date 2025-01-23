const express = require('express');
const {createUser, login, verifyUser, updateUserById} = require('../controllers/userControllers')
const authorization = require('../middlewares/authorization')

const userRouter = express.Router();

userRouter.post('/register', createUser);
userRouter.post('/login', login);
userRouter.get('/verificar.usuario', authorization, verifyUser);
userRouter.put('/update', updateUserById);

module.exports = userRouter;