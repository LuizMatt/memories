const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors()); // Permite que o servidor aceite requisições de outros domínios
app.use(express.json()); //Indica que o servidor vai receber JSON

app.use(express.static('public')); // Indica que o servidor vai servir arquivos estáticos da pasta public

const port = process.env.PORT || 3000; // Define a porta do servidor, se não estiver definida, usa a porta 3000

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});