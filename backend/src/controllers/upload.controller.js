import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define uploads directory relative to the project root (backend/)
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class UploadController {
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            }

            // Construct the public URL for the file
            // Assuming the server serves 'uploads' folder at '/uploads' path
            const backendUrl = `${req.protocol}://${req.get('host')}`;
            const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

            res.status(201).json({
                message: 'Upload realizado com sucesso!',
                url: fileUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size
            });
        } catch (error) {
            console.error('Erro no upload:', error);
            res.status(500).json({ error: 'Erro ao processar upload.' });
        }
    }

    async deleteFile(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(UPLOADS_DIR, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Arquivo não encontrado.' });
            }

            fs.unlinkSync(filePath);
            res.status(200).json({ message: 'Arquivo removido com sucesso.' });
        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            res.status(500).json({ error: 'Erro ao deletar arquivo.' });
        }
    }

    async listFiles(req, res) {
        try {
            const files = fs.readdirSync(UPLOADS_DIR);

            const fileList = files.map(file => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = fs.statSync(filePath);
                const backendUrl = `${req.protocol}://${req.get('host')}`;

                return {
                    filename: file,
                    url: `${backendUrl}/uploads/${file}`,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            });

            // Sort by most recent
            fileList.sort((a, b) => b.createdAt - a.createdAt);

            res.json(fileList);
        } catch (error) {
            console.error('Erro ao listar arquivos:', error);
            res.status(500).json({ error: 'Erro ao listar arquivos.' });
        }
    }
}

export default new UploadController();
