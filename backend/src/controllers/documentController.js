class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
  }

  requireUserId = (req, res, next) => {
    const userId = req.get('X-User-Id')?.trim();

    if (!userId) {
      return res.status(400).json({
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'O identificador do usuário é obrigatório.',
        },
      });
    }

    req.userId = userId;
    next();
  };

  upload = async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'FILE_REQUIRED',
          message: 'O arquivo é obrigatório.',
        },
      });
    }

    try {
      const document = await this.documentService.createDocument(req.file, req.userId);
      return res.status(201).json({ document });
    } catch {
      return next(this.createError(500, 'UPLOAD_FAILED', 'Não foi possível enviar o documento.'));
    }
  };

  list = (req, res, next) => {
    try {
      const documents = this.documentService.listDocuments(req.userId);
      return res.json({ documents });
    } catch {
      return next(this.createError(500, 'DOCUMENT_LIST_FAILED', 'Não foi possível listar os documentos.'));
    }
  };

  download = async (req, res, next) => {
    try {
      const document = await this.documentService.getDocumentForDownload(
        req.params.id,
        req.userId,
      );

      return res.download(
        document.storagePath,
        this.getDownloadName(document.originalName),
        { headers: { 'Content-Type': document.mimeType } },
        (error) => {
          if (error && !res.headersSent) {
            next(this.createError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.'));
          }
        },
      );
    } catch (error) {
      if (error.status && error.code) {
        return next(error);
      }

      return next(this.createError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.'));
    }
  };

  createError(status, code, message) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
  }

  getDownloadName(originalName) {
    const safeName = String(originalName || '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/[\\/]/g, '_')
      .trim();

    return safeName || 'documento';
  }
}

module.exports = DocumentController;