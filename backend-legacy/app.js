const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors()); // Permite que o servidor aceite requisições de outros domínios
app.use(express.json()); //Indica que o servidor vai receber JSON
app.use(express.static('public')); 
require("./db/conn.js"); 


const port = 3000; 
const memoryRoutes = require('./routes');
app.use('/memories', memoryRoutes); // Define a rota base para as rotas de memória

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});