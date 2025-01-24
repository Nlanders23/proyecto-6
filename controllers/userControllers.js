const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
    const { username, email, password, genre, age } = req.body;
       try {
           const salt = await bcryptjs.genSalt(10);
           const hashedPassword = await bcryptjs.hash(password, salt);
   
           const createdUser = await User.create({
               username,
               email,
               password: hashedPassword,
               genre,
               age
           })
           return res.json(createdUser);
       } catch (error) {
           return res.status(400).json({ message: 'hubo un error al crear el usuario', error })
       }
   }

   exports.login = async (req, res) => {
    const { username, password } = req.body;
       try {
           let foundedUser = await User.findOne({ username });
           if (!foundedUser) {
               return res.status(400).json({ message: 'El username no existe' });
           }
           const correctPassword = await bcryptjs.compare(password, foundedUser.password); 
           if (!correctPassword){
               return res.status(400).json({ message: 'El usuario o la contrasena no corresponden' });
           }
   
           const payload = { user: {  id: foundedUser.id } };
   
           jwt.sign(
               payload,
               process.env.SECRET,
               {
                   expiresIn: 120
               },
               (error, token) => {
                   if (error) throw error;
                   res.json({ token });
               }
           )
   
       } catch (error) {
           res.json({
               message: "Hubo un error",
               error
           })
       }
}

exports.verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json({ user })
    } catch (error) {
        res.status(500).json({ message: 'Hubo un error verificando el usuario', error })
    }
}

exports.updateUserById = async (req, res) => {
    const {id} = req.params;
    const {  username, password, age } = req.body
    try {
        const userUpdate = 
	        await User.findByIdAndUpdate(id, { username, password, age }, { new: true })
        res.json(userUpdate)
    } catch (error) {        
        res.status(500).json({
            msg: "There was an error updating the user"
        })
    }
}

