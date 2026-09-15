function createNotFoundError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.status = 404;
  return error;
}

function createDocumentNotFoundError() {
  return createNotFoundError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
}

function createFileNotFoundError() {
  return createNotFoundError('FILE_NOT_FOUND', 'Arquivo não encontrado.');
}

module.exports = {
  createDocumentNotFoundError,
  createFileNotFoundError,
};
