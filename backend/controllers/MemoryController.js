const { get } = require('mongoose');
const Memory = require('../models/Memory');
const { route } = require('../routes');

const fs = require('fs');
const removeOldImage = (memory) => {
    const imagePath = path.join(__dirname, '../public', memory.image); 
    fs.unlink(imagePath, (err) => {
        if (err) {
            console.log("Erro ao remover imagem antiga:", err);
        } else {
            console.log("Imagem antiga removida com sucesso");
        }
    });
};
const createMemory = async (req, res) => {
    try {
        const { title, description } = req.body;
        const src = `images/${req.file.filename}`;

        if (!title || !description) {
            return res.status(400).json({ message: "Título e descrição são obrigatórios" });
        }

        const newMemory = new Memory({
            title,
            description,
            image: src
        });

        await newMemory.save();
        res.status(201).json({ message: "Memória criada com sucesso", memory: newMemory });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao criar memória", error });
    }


}

const getMemories = async (req, res) => {
    try {
        const memories = await Memory.find();
        res.status(200).json(memories);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao buscar memórias", error });
    }
}

const getMemoryById = async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);
        if (!memory) {
            return res.status(404).json({ message: "Memória não encontrada" });
        }
        res.status(200).json(memory);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar memória", error });
    }
}


const deleteMemory = async (req, res) => {
    try {
        const memory = await Memory.findByIdAndRemove(req.params.id);
        if (!memory) {
            return res.status(404).json({ message: "Memória não encontrada" });
        }
        removeOldImage(memory);
        res.status(200).json({ message: "Memória deletada com sucesso" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao deletar memória", error });

    }
}

module.exports = {
    createMemory, getMemories, getMemoryById, deleteMemory
}
