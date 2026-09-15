const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const DocumentRepository = require('../repositories/documentRepository');
const DocumentService = require('../services/documentService');
const DocumentController = require('../controllers/documentController');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const configuredUploadLimit = Number(process.env.MAX_UPLOAD_SIZE);
const maxUploadSize = Number.isFinite(configuredUploadLimit) && configuredUploadLimit > 0
  ? configuredUploadLimit
  : 10 * 1024 * 1024;

fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: maxUploadSize },
});

const documentRepository = new DocumentRepository(storageDirectory);
const documentService = new DocumentService(documentRepository);
const documentController = new DocumentController(documentService);
const router = express.Router();

function uploadSingleFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      error.status = 413;
      error.code = 'FILE_TOO_LARGE';
      error.message = 'O arquivo excede o tamanho máximo permitido.';
      return next(error);
    }

    if (error instanceof multer.MulterError) {
      error.status = 400;
      error.code = error.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'UNEXPECTED_FILE'
        : 'INVALID_MULTIPART';
      error.message = error.code === 'UNEXPECTED_FILE'
        ? 'Envie um único arquivo no campo file.'
        : 'A requisição multipart é inválida.';
      return next(error);
    }

    error.status = 500;
    error.code = 'UPLOAD_FAILED';
    error.message = 'Não foi possível enviar o documento.';
    return next(error);
  });
}

router.post(
  '/upload',
  documentController.requireUserId,
  uploadSingleFile,
  documentController.upload,
);
router.get('/documents', documentController.requireUserId, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireUserId,
  documentController.download,
);

module.exports = router;