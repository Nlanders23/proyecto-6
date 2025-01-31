#Proyecto 6: base de datos con MONGODB

Para explorar este proyecto deberás:

1. clona este repositorio a través del comando git clone y luego abrelo a través de visual studio code.
2. Instala los modulos, por medio de la terminal de VSC, a través del comando npm install.
3. Ejecuta el proyecto escribiendo el comando npm run start en la terminal de VSC. Si todo sale bien, deberá aparecer un mensaje que diga: "conectado en el puerto 3000" en la terminal de VSC. 

En este proyecto podrás acceder a la base de datos de Usuario y Prenda de vestir a través de ThunderClient o MongoDB Atlas configurando tu archivo .env

- Para ThunderCLient
   crea un archivo .env en la raíz del proyecto y dentro de él escribe:
     MONGODB_URI=mongodb://localhost:27017/ucamp-proyect
     PORT=3000
     SECRET=UCAMP

- Para MongoDB Atlas
  crea un archivo .env en la raíz del proyecto y dentro de él escribe:
     MONGODB_URI= "aca debes insertar el string de conexión que te otorga Mongodb Atlas"
     PORT=3000
     SECRET=UCAMP

Ruta y Modelos

- Modelo usuario: 

{ "username": String,
  "email": String,
  "password": String,
  "genre": String,
  "age": Number
}

- Rutas del usuario: 

POST.../api/user/register      *para crear un usuario
POST.../api/user/login         *para iniciar sesión con   username y password
GET.../api/user/verifyToken    *para verificar el token de usuario
PUT.../api/user/update/:id     *para actualizar información del usuario (username, password, age)

- Modelo Prenda de vestir

{
    "name": String,
    "price": Number,
    "description": String,
    "item": String,
    "size": String, 
}

-Rutas de la Prenda de vestir:

POST.../api/cloth/createCloth        *para crear una nueva prenda
GET.../api/cloth/getAllClothes       *para traer todas las prendas de la base de datos
GET/api/cloth/getCloth/:id           *para traer la información de una prenda por su id
PUT.../api/cloth/updateCloth/:id     *para actualizar la información de una prenda por su id (name, price, size)
DELETE.../api/cloth/deleteCloth/:id  *para eliminar una prenda por su id
