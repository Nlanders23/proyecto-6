const express = require('express');
const { getAllClothes, createCloth, getClothById, updateClothById, deleteClothById } = require('../controllers/clothesControllers');

const clothRouter = express.Router();

clothRouter.post('/createCloth', createCloth);
clothRouter.get('/getAllClothes', getAllClothes);
clothRouter.get('/getCloth', getClothById);
clothRouter.put('/updateCloth', updateClothById);
clothRouter.delete('/deleteCloth', deleteClothById);

module.exports = clothRouter;
