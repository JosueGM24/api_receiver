const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const uploadDir = 'uploads';

// Configuración de CORS
app.use(cors({ origin: '*' }));

// Middleware para manejar datos JSON
app.use(express.json());

// Configuración de multer para almacenamiento de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Ruta para listar archivos
app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al listar archivos' });
        }
        res.json({ files });
    });
});

// Ruta para subir archivos
app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ message: 'Archivo subido exitosamente' });
});

// Ruta para eliminar archivos
app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el archivo' });
        }
        res.json({ message: 'Archivo eliminado exitosamente' });
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
