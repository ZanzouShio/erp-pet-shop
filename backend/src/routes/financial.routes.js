import { Router } from 'express';
import multer from 'multer';
import { uploadNfe } from '../controllers/financial.controller.js';
import fs from 'fs';

const router = Router();

// Configuração do Multer para upload temporário
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.xml')
    }
});

const upload = multer({ storage: storage });

router.post('/nfe/upload', upload.single('xml'), uploadNfe);
router.post('/nfe/confirm', async (req, res) => {
    // Import dinâmico para evitar dependência circular se houver, ou apenas para garantir
    const { confirmEntry } = await import('../controllers/financial.controller.js');
    confirmEntry(req, res);
});

export default router;
