const express = require('express');

const router = express.Router();

const upload = require('./helpers/upload');

const {
    createMemory, getMemories, getMemoryById,
    deleteMemory
} = require('./controllers/MemoryController');
// Rota para criar uma nova memória

router.post("/", upload.single("image"), (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ msg: "Nenhuma imagem enviada!" });
    }
    next();
}, (req, res) => createMemory(req, res));
router.get("/", (req, res)=>getMemories(req, res)); 

router.get("/:id", (req, res) => getMemoryById(req, res));

router.delete("/:id", (req, res) => { deleteMemory(req, res) });

module.exports = router;