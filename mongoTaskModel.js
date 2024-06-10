const mongoose = require("mongoose") 

const mongoSchema = new mongoose.Schema({
    author: String,
    name: String,
    date: String,
    content: String,  
});

// Criação do model
const MongoTaskModel = mongoose.model('tasks', mongoSchema);

module.exports = MongoTaskModel;