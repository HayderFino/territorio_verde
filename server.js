const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Sirve todos los archivos del sitio

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const section = req.query.section || req.body.section || 'global';
    const dir = path.join(__dirname, 'data', section); // Sin subcarpeta /img/
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- ENDPOINTS ---

// Obtener datos de una sección
app.get('/api/data/:section', (req, res) => {
    const section = req.params.section;
    const filePath = path.join(__dirname, 'data', section, 'config.json');
    console.log(`🔍 Cargando datos de sección: ${section}`);
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo no encontrado: ${filePath}`);
        return res.status(404).send('No encontrado');
    }
    
    try {
        const data = fs.readFileSync(filePath);
        res.json(JSON.parse(data));
    } catch (err) {
        console.error(`❌ Error al leer JSON en ${section}:`, err);
        res.status(500).send('Error interno');
    }
});

// Guardar datos de una sección
app.post('/api/data/:section', (req, res) => {
    const section = req.params.section;
    const filePath = path.join(__dirname, 'data', section, 'config.json');
    console.log(`💾 Guardando cambios en: ${section}`);

    try {
        const dataToWrite = JSON.stringify(req.body, null, 2);
        fs.writeFileSync(filePath, dataToWrite);
        console.log(`✅ ${section} guardado con éxito!`);
        res.send({ status: 'success', message: 'Guardado correctamente' });
    } catch (err) {
        console.error(`❌ Error al escribir en ${section}:`, err);
        res.status(500).send({ status: 'error', message: err.message });
    }
});

// Subir imagen
app.post('/api/upload', upload.single('image'), (req, res) => {
    const section = req.query.section || req.body.section || 'global';
    const relativePath = `data/${section}/${req.file.filename}`; // Sin /img/
    console.log(`📂 Imagen subida para ${section}: ${relativePath}`);
    res.send({ url: relativePath });
});

// Login simple
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    const authPath = path.join(__dirname, 'Administrador', 'auth.json');
    const auth = JSON.parse(fs.readFileSync(authPath));
    if (user === auth.user && pass === auth.pass) {
        res.send({ status: 'success', token: 'logged_in' });
    } else {
        res.status(401).send('Credenciales incorrectas');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
    console.log(`📂 Administrador en http://localhost:${PORT}/Administrador`);
});
