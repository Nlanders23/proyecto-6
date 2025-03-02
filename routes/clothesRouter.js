const express = require('express');
const { getAllClothes, createCloth, getClothById, updateClothById, deleteClothById } = require('../controllers/clothesControllers');

const clothRouter = express.Router();

clothRouter.post('/create-cloth', createCloth);
clothRouter.get('/get-all-clothes', getAllClothes);
clothRouter.get('/get-cloth/:id', getClothById);
clothRouter.put('/update-cloth/:id', updateClothById);
clothRouter.delete('/delete-cloth/:id', deleteClothById);

module.exports = clothRouter;
