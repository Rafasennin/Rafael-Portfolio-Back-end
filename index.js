require("dotenv").config(); // Para carregar variáveis de ambiente do arquivo .env
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const ContatoModel = require("./models/mongoModel");
const TaskModel = require("./models/mongoTaskModel");
const sendMail = require("./models/nodeMailer");
const FileModel = require('./models/FileModel');
const multer = require('multer');



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

//***********************Files route *********************/
// Configuração do multer para armazenar arquivos no diretório 'uploads'

const storage = multer.memoryStorage();
const upload = multer({ storage });


// Funções
const convertFileSize = (size) => {
  if (size >= 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (size >= 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else {
    return size + ' B';
  }
};

const getCurrentDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

//***********************Files route *********************/
//Rota para adicionar arquivo
app.post('/files', upload.array('files'), async (req, res) => {
  try {
    const files = req.files.map(file => ({
      originalName: file.originalname,
      fileType: file.mimetype.split('/')[1],
      fileLength: convertFileSize(file.size), 
      fileUploadDate: getCurrentDate(),
      data: file.buffer 
    }));

    await FileModel.insertMany(files);

    res.status(201).json({ message: 'Arquivos enviados com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar arquivos:', error);
    res.status(500).json({ message: error.message });
  }
});
// Rota para listar os arquivos
app.get('/files', async (req, res) => {
  try {
    const files = await FileModel.find();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Nenhum arquivo encontrado' });
    }
    res.json(files);
    console.log("Arquivos listados com sucesso")
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ message: error.message });
  }
});
// Rota para deletar um arquivos pelo ID
app.delete("/files/:id", async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.id);
    if (!file) {
      console.log("Arquivo não encontrado com o id:", req.params.id);
      return res.status(404).json({ message: "Arquivo não encontrado" });
    }
    await FileModel.deleteOne({ _id: req.params.id });
    console.log("Arquivo deletado com sucesso com o id:", req.params.id);
    res.json({ message: "Arquivo deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar o arquivo:", error);
    res.status(500).json({ message: error.message });
  }
});
//Rota para dowload
app.get('/files/:id', async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }
    res.set({
      'Content-Type': file.fileType,
      'Content-Disposition': `attachment; filename=${file.originalName}`
    });
    res.send(file.data); // Envia o arquivo como resposta
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error);
    res.status(500).json({ message: error.message });
  }
});


//***********************Contacts route *********************/
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

//***********************Tasks route *********************/
// Rota para listar todas as tarefas
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await TaskModel.find();
    res.json(tasks);
  } catch (error) {
    console.error("Erro ao listar tarefas:", error);
    res.status(500).json({ message: error.message });
  }
});
// Rota para adicionar uma nova tarefa
app.post("/tasks", async (req, res) => {
  const newTask = new TaskModel({
    author: req.body.author,
    name: req.body.name,
    date: req.body.date,
    content: req.body.content
  });

  try {
    await newTask.save();
    try {
      const infoEmail = await sendMail(
        "rafasennin@hotmail.com",
        "Aviso!",
        "Nova sugestão cadastrada",
        `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h1 style="color: #007bff;">${newTask.author} cadastrou uma nova tarefa!</h1>
            <p>Detalhes:</p>
            <ul>
              <li><strong>Título da  sugestão:</strong> ${newTask.name}</li>
              <li><strong>Data de Criação:</strong> ${newTask.date}</li>
            </ul>
            <p><strong>Descrição da sugestão:</strong></p>
            <p>${newTask.content}</p>
            <hr>
            <p style="font-size: 0.9em; color: #555;">Este é um email automático, por favor, não responda.</p>
          </div>
        `
      );

      console.log("Email enviado com sucesso:", infoEmail);
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
    }
    res.status(201).json("taskSaved");
  } catch (error) {
    console.error("Erro ao salvar tarefa:", error);
    res.status(400).json({ message: error.message });
  }
});
// Rota para buscar uma tarefa pelo ID
app.get("/tasks/:id", async (req, res) => {
  console.log("GET /tasks/:id called with id:", req.params.id);
  try {
    const task = await TaskModel.findById(req.params.id);
    if (task === null) {
      console.log("Tarefa não encontrada com o id:", req.params.id);
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    res.json(task);
  } catch (error) {
    console.error("Erro ao buscar tarefa:", error);
    res.status(500).json({ message: error.message });
  }
});
// Rota para editar uma tarefa pelo ID
app.put("/tasks/:id", async (req, res) => {
  console.log("PUT /tasks/:id called with id:", req.params.id);
  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedTask === null) {
      console.log("Tarefa não encontrada com o id:", req.params.id);
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    res.json(updatedTask);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    res.status(400).json({ message: error.message });
  }
});
// Rota para deletar uma tarefa pelo ID
app.delete("/tasks/:id", async (req, res) => {
  console.log("DELETE /tasks/:id called with id:", req.params.id);
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) {
      console.log("Tarefa não encontrada com o id:", req.params.id);
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    await TaskModel.deleteOne({ _id: req.params.id }); // Remover a tarefa do banco de dados
    console.log("Tarefa deletada com sucesso com o id:", req.params.id);
    res.json({ message: "Tarefa deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    res.status(500).json({ message: error.message });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
