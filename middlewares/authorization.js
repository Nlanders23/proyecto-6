const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    let {authorization} = req.headers;

    if (!authorization) {
        res.status(401).json({message:'Acceso no autorizado' });
    }

    try {
        let [type, token] = authorization.split(" "); // en el indice 0 del arreglo se encuentra el type y en el indice 1 se encuentra el token
        if (type === 'Token' || type === 'Bearer') {
            const openToken = jwt.verify(token, process.env.SECRET);
            req.user = openToken.user
            next()
        } else {
            return res.status(401).json({ message: 'Acceso no autorizado' })
        }
    } catch (error) {
        res.json({ message: 'Hubo un error', error });
    } 
    
}