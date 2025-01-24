const express = require('express');
const { getAllClothes, createCloth, getClothById, updateClothById, deleteClothById } = require('../controllers/clothesControllers');

const clothRouter = express.Router();

clothRouter.post('/createCloth', createCloth);
clothRouter.get('/getAllClothes', getAllClothes);
clothRouter.get('/getCloth/:id', getClothById);
clothRouter.put('/updateCloth/:id', updateClothById);
clothRouter.delete('/deleteCloth/:id', deleteClothById);

module.exports = clothRouter;
