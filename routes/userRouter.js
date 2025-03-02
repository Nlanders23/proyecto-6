const express = require('express');
const {createUser, login, verifyUser, updateUserById} = require('../controllers/userControllers')
const authorization = require('../middlewares/authorization')

const userRouter = express.Router();

userRouter.post('/register', createUser);
userRouter.post('/login', login);
userRouter.get('/verify-token', authorization, verifyUser);
userRouter.put('/update/:id', updateUserById);

module.exports = userRouter;