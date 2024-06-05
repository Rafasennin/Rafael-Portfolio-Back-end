require("dotenv").config(); // Para carregar variáveis de ambiente do arquivo .env
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const ContatoModel = require("./mongoModel"); 
const sendMail = require("./nodeMailer");

const app = express();

// Middleware para analisar corpos de solicitação no express
app.use(bodyParser.json());
app.use(cors()); 

// Conectar ao MongoDB
const mongoUrl = process.env.MONGO_URL;

mongoose.connect(mongoUrl)
  .then(() => {
    console.log("Conexão estabelecida com sucesso com o MongoDB");
  })
  .catch(error => {
    console.error("Erro ao conectar com o MongoDB:", error);
  });

// Rota para listar todos os contatos
app.get("/contatos", async (req, res) => {
  try {
    console.log("GET /contatos called");
    const contatos = await ContatoModel.find();
    res.json(contatos);
  } catch (error) {
    console.error("Erro ao listar contatos:", error);
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
    await novoContato.save();

    // Enviar email após salvar o contato
    try {
      const infoEmail = await sendMail(
        "rafasennin@hotmail.com",
        "Novo usuário cadastrado",
        `Olá ${novoContato.name}, bem-vindo!`,
        `<p>O usuário ${novoContato.name}, enviou uma mensagem!</p>
        <b>Email:</b> <p>${novoContato.email}</p>
        <b>Mensagem:</b> <p>${novoContato.message}</p>
        `
      );
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
    }

    res.status(201).json("contatoSalvo");
  } catch (error) {
    console.error("Erro ao salvar contato:", error);
    res.status(400).json({ message: error.message });
  }
});

// Rota para buscar um contato pelo ID
app.get("/contatos/:id", async (req, res) => {
  console.log("GET /contatos/:id called with id:", req.params.id);
  try {
    const contato = await ContatoModel.findById(req.params.id);
    if (contato === null) {
      console.log("Contato não encontrado com o id:", req.params.id);
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    res.json(contato);
  } catch (error) {
    console.error("Erro ao buscar contato:", error);
    res.status(500).json({ message: error.message });
  }
});

// Rota para deletar um contato pelo ID
app.delete("/contatos/:id", async (req, res) => {
  console.log("DELETE /contatos/:id called with id:", req.params.id);
  try {
    const contato = await ContatoModel.findById(req.params.id);
    if (!contato) {
      console.log("Contato não encontrado com o id:", req.params.id);
      return res.status(404).json({ message: "Contato não encontrado" });
    }
    await ContatoModel.deleteOne({ _id: req.params.id }); // Remover o contato do banco de dados
    console.log("Contato deletado com sucesso com o id:", req.params.id);
    res.json({ message: "Contato deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar contato:", error);
    res.status(500).json({ message: error.message });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
