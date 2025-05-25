const multer = require('multer');

const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/images")); // Define o diretório de destino para os arquivos enviados
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Define o nome do arquivo como a data atual + extensão original
    }

})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true); 
    } else {
        cb(new Error('Tipo de arquivo não suportado'), false); 
    }
}

const upload = multer({
    storage, 
    fileFilter
})

module.exports = upload; 