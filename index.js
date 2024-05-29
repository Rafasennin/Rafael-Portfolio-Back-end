const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ContatoModel = require("./mongoModel"); 
const cors = require("cors");

// Middleware para analisar corpos de solicitação
app.use(bodyParser.json());

// Use o middleware corsS
app.use(cors()); 

// Conectar ao MongoDB
const mongoUrl = process.env.MONGO_URL;
console.log(mongoUrl)
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Conexão estabelecida com sucesso com o MongoDB");
  })
  .catch(error => {
    console.error("Erro ao conectar com o MongoDB:", error);
  });

// Rota para listar todos os contatos
app.get("/contatos", async (req, res) => {
  try {
    const contatos = await ContatoModel.find();
    res.json(contatos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota para adicionar um novo contato
app.post("/contatos", async (req, res) => {
  const novoContato = new ContatoModel({
    name: req.body.name,
    email: req.body.email,
    message: req.body.message
  });

  try {
    const contatoSalvo = await novoContato.save();
    res.status(201).json(contatoSalvo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rota para buscar um contato pelo ID
app.get("/contatos/:id", async (req, res) => {
  try {
    const contato = await ContatoModel.findById(req.params.id);
    if (contato === null) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    res.json(contato);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota para deletar um contato pelo ID
app.delete("/contatos/:id", async (req, res) => {
  try {
    console.log(req.params.id)
    const contato = await ContatoModel.findById(req.params.id);
    if (!contato) {
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    await ContatoModel.deleteOne({ _id: req.params.id }); // Remover o contato do banco de dados
    res.json({ message: "Contato deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar contato:", error); // Adicionando um log para registrar o erro
    res.status(500).json({ message: error.message });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
