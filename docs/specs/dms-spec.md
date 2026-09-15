# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web para que usuários enviem, consultem e baixem seus documentos com metadados identificáveis, mantendo os arquivos no filesystem local e respeitando uma separação simples de responsabilidades entre as camadas do sistema.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Registro dos metadados do documento em memória.
- Listagem dos documentos pertencentes ao usuário identificado na requisição.
- Download de um documento pertencente ao usuário identificado na requisição.
- Identificação provisória do usuário pelo header `X-User-Id`.
- Geração de identificador público único para cada documento.
- Armazenamento físico local em `backend/storage` usando `multer` com `diskStorage`.
- Interface React para upload, listagem e download, integrada ao backend pelo prefixo `/api`.
- Tratamento padronizado de entradas inválidas, documentos inexistentes e falhas internas.

### Fora do escopo

- Autenticação, autorização baseada em sessão, OAuth ou gerenciamento de credenciais.
- Persistência de metadados em banco de dados ou arquivo.
- Armazenamento externo, serviços de nuvem ou terceiros.
- Versionamento, edição, exclusão ou restauração de documentos.
- Busca textual, filtros avançados, OCR, preview ou conversão de arquivos.
- Compartilhamento entre usuários.
- Rate limiting, auditoria, antivírus e validação do conteúdo além dos metadados multipart.
- CORS específico para produção e deploy da aplicação.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | Uma requisição `POST /upload` válida cria o arquivo no armazenamento local e retorna seus metadados com status `201`. |
| RF-02 | O sistema exige um proprietário para cada documento. | O header `X-User-Id` deve estar presente e conter um identificador não vazio; caso contrário, a requisição é rejeitada com status `400`. |
| RF-03 | O sistema valida o arquivo enviado. | O campo multipart `file` é obrigatório; ausência do arquivo resulta em `400`, e arquivo acima do limite resulta em `413`. |
| RF-04 | O sistema gera um identificador único para o documento. | Cada documento recebe um UUID público, independente do nome original do arquivo. |
| RF-05 | O sistema preserva os metadados básicos do upload. | A resposta registra nome original, tamanho em bytes, MIME type, data/hora ISO 8601 e proprietário. |
| RF-06 | O usuário pode listar seus documentos. | `GET /documents` retorna somente documentos cujo `owner` corresponde ao `X-User-Id` informado, ordenados por `uploadedAt` decrescente. |
| RF-07 | O usuário pode baixar um documento pelo identificador. | `GET /documents/:id/download` retorna o conteúdo binário somente quando o documento existe e pertence ao usuário informado. |
| RF-08 | O sistema impede acesso entre proprietários. | Um usuário não pode listar nem baixar documentos de outro proprietário; o download de documento não pertencente ao usuário responde `404`, sem revelar sua existência. |
| RF-09 | O sistema trata documentos inexistentes. | Um ID inválido ou ausente no repositório resulta em `404` com erro padronizado. |
| RF-10 | O sistema trata falhas de persistência local. | Falhas ao gravar, localizar ou ler o arquivo resultam em resposta `500` padronizada, sem expor stack trace ou caminho interno. |
| RF-11 | O frontend consome a API do backend. | As chamadas feitas pelo frontend usam o prefixo `/api`, conforme o proxy configurado no Vite, e exibem estados de carregamento e erro ao usuário. |
| RF-12 | O endpoint de saúde permanece disponível. | `GET /health` retorna `{ "status": "ok" }` com status `200`. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e CommonJS; o frontend deve usar React, Vite e ESM. |
| RNF-02 | O backend deve seguir Clean Architecture simples, com fluxo de dependência `routes -> controllers -> services -> repositories`. |
| RNF-03 | Os uploads devem ser tratados por `multer` e gravados com `diskStorage` em `backend/storage`. Nenhum provedor externo é permitido. |
| RNF-04 | Os metadados permanecem em memória nesta fase. Eles serão perdidos quando o processo for reiniciado, enquanto os arquivos físicos podem permanecer no disco. Essa limitação deve ser conhecida e documentada. |
| RNF-05 | O limite padrão de cada upload deve ser 10 MiB (`10485760` bytes) e deve ser configurável por variável de ambiente, sem alteração de código. |
| RNF-06 | O diretório de armazenamento deve ser configurável por ambiente, tendo `backend/storage` como valor padrão. O diretório deve ser criado quando não existir. |
| RNF-07 | O nome usado no filesystem deve ser gerado internamente, não deve depender do nome original e não deve permitir traversal de diretório. |
| RNF-08 | O sistema deve aceitar inicialmente arquivos cujo MIME type seja informado pelo cliente, sem tratar essa informação como validação de segurança do conteúdo. Restrições adicionais devem ser introduzidas por configuração ou requisito posterior. |
| RNF-09 | A identificação por `X-User-Id` é apenas um mecanismo provisório de escopo; ela não autentica o usuário e deve ser substituída por autenticação real em uma evolução futura. |
| RNF-10 | As respostas de erro devem usar o formato `{ "error": { "code": "...", "message": "..." } }`, com mensagens sem stack trace, dados sensíveis ou caminhos internos. |
| RNF-11 | Configurações operacionais, como porta, diretório e limite de upload, devem seguir o princípio 12-Factor e ser obtidas por variáveis de ambiente. |
| RNF-12 | O backend deve ser testado com o runner nativo `node:test`, cobrindo sucesso, validação, isolamento por usuário e falhas de arquivo. |
| RNF-13 | Funções e módulos devem ter responsabilidade única, nomes descritivos em inglês e mensagens ao usuário em português, mantendo SOLID, DRY, KISS e YAGNI. |
| RNF-14 | O frontend deve reutilizar componentes React e centralizar a comunicação HTTP em `src/services`, sem duplicar regras de integração nos componentes. |

## 5. Modelo de dados

### 5.1 Metadados do documento

O registro abaixo é mantido em memória pelo repository. Os campos públicos são retornados pela API; os campos internos são usados somente para localizar o arquivo físico.

| Campo | Tipo | Obrigatório | Exposição | Descrição |
| --- | --- | --- | --- | --- |
| `id` | `string` | Sim | Público | UUID v4 usado como identificador do documento nas rotas. |
| `originalName` | `string` | Sim | Público | Nome original informado pelo cliente, preservado apenas como metadado. |
| `size` | `number` | Sim | Público | Tamanho do arquivo em bytes. Deve ser um número inteiro maior ou igual a zero. |
| `mimeType` | `string` | Sim | Público | MIME type informado pelo multipart, sem representar validação de segurança do conteúdo. |
| `uploadedAt` | `string` | Sim | Público | Data/hora de criação em formato ISO 8601 UTC. |
| `owner` | `string` | Sim | Público | Valor normalizado do header `X-User-Id` que identifica o proprietário provisório. |
| `storedName` | `string` | Sim | Interno | Nome aleatório ou derivado do UUID usado no filesystem; nunca deve ser aceito diretamente pela API. |
| `storagePath` | `string` | Sim | Interno | Caminho controlado pelo repository para o arquivo local. Não deve aparecer em respostas HTTP. |

Regras do modelo:

- `id` não pode ser reutilizado durante a vida do processo.
- `originalName` não deve ser usado para montar caminhos nem sobrescrever arquivos.
- Uploads com o mesmo `originalName` são permitidos; cada arquivo recebe um `storedName` diferente.
- O documento só deve ser adicionado ao registro em memória depois que o arquivo for gravado com sucesso.
- Se o registro falhar depois da gravação, o arquivo recém-criado deve ser removido para evitar um órfão sempre que a limpeza for possível.

### 5.2 Configuração

| Variável | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `PORT` | `number` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `string` | `backend/storage` | Diretório raiz dos arquivos enviados. |
| `MAX_UPLOAD_SIZE` | `number` | `10485760` | Limite máximo do arquivo em bytes. |

## 6. Contratos de API

### 6.1 Convenções gerais

- As rotas do backend são `/upload`, `/documents` e `/documents/:id/download`.
- O frontend acessa essas rotas através do prefixo `/api`, fornecido pelo proxy do Vite. Por exemplo, o frontend chama `/api/documents`, enquanto o backend trata `/documents` quando o proxy remove o prefixo.
- As requisições protegidas por escopo devem enviar `X-User-Id` com valor não vazio.
- Erros usam `Content-Type: application/json` e o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

### 6.2 `POST /upload`

Envia um documento e cria seus metadados.

**Headers**

- `X-User-Id: string` obrigatório.
- `Content-Type: multipart/form-data; boundary=...` obrigatório.

**Body**

- Campo obrigatório `file` contendo exatamente um arquivo.
- O nome original e o MIME type são lidos do multipart.

**Resposta de sucesso: `201 Created`**

`Content-Type: application/json`

```json
{
  "document": {
    "id": "2f8d6f2e-3a3e-4a1b-8d6b-2d2cbf8f9f41",
    "originalName": "contrato.pdf",
    "size": 24576,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-09-15T12:00:00.000Z",
    "owner": "user-123"
  }
}
```

**Erros**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | Header `X-User-Id` ausente ou vazio. |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou sem arquivo. |
| `413` | `FILE_TOO_LARGE` | Arquivo excede `MAX_UPLOAD_SIZE`. |
| `500` | `UPLOAD_FAILED` | Falha inesperada ao gravar ou registrar o documento. |

### 6.3 `GET /documents`

Lista os documentos do proprietário identificado.

**Headers**

- `X-User-Id: string` obrigatório.

**Resposta de sucesso: `200 OK`**

`Content-Type: application/json`

```json
{
  "documents": [
    {
      "id": "2f8d6f2e-3a3e-4a1b-8d6b-2d2cbf8f9f41",
      "originalName": "contrato.pdf",
      "size": 24576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-09-15T12:00:00.000Z",
      "owner": "user-123"
    }
  ]
}
```

A lista vazia deve ser retornada como `{"documents": []}`. A ordenação é decrescente por `uploadedAt`.

**Erros**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | Header ausente ou vazio. |
| `500` | `DOCUMENT_LIST_FAILED` | Falha inesperada ao consultar os metadados em memória. |

### 6.4 `GET /documents/:id/download`

Baixa o conteúdo binário de um documento do proprietário identificado.

**Headers**

- `X-User-Id: string` obrigatório.
- `Accept: application/octet-stream` opcional.

**Parâmetros**

- `id`: UUID do documento, obrigatório no path.

**Resposta de sucesso: `200 OK`**

- Corpo: bytes do arquivo armazenado.
- `Content-Type`: MIME type registrado no upload, quando disponível.
- `Content-Disposition`: `attachment; filename="<originalName>"`, com o nome tratado para não permitir injeção de header.
- O caminho físico e `storedName` nunca são retornados.

**Erros**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | Header ausente ou vazio. |
| `404` | `DOCUMENT_NOT_FOUND` | ID inexistente ou documento pertencente a outro usuário. |
| `404` | `FILE_NOT_FOUND` | Metadado existe, mas o arquivo não está disponível no filesystem. |
| `500` | `DOWNLOAD_FAILED` | Falha inesperada ao ler ou transmitir o arquivo. |

### 6.5 `GET /health`

Endpoint sem escopo de usuário para verificação do processo.

**Resposta de sucesso: `200 OK`**

```json
{
  "status": "ok"
}
```

## 7. Decisões arquiteturais

### 7.1 Backend

O backend seguirá quatro camadas, com dependências apontando para dentro:

1. `routes/`: registra métodos, caminhos, middleware de upload e encaminha a requisição ao controller.
2. `controllers/`: lê headers, parâmetros e multipart, valida a entrada HTTP, chama o service e converte o resultado em status e resposta HTTP.
3. `services/`: implementa as regras de negócio, como geração de ID, associação ao proprietário, filtragem e autorização por dono; não conhece Express.
4. `repositories/`: encapsula o armazenamento local e a coleção de metadados em memória; não conhece detalhes de rota ou interface React.

O fluxo esperado é `route -> controller -> service -> repository`. O controller não deve manipular caminhos físicos e o repository não deve decidir status HTTP.

### 7.2 Upload e armazenamento

- `multer` deve usar `diskStorage` e gerar um nome físico interno seguro.
- O diretório de destino deve ser configurado por `STORAGE_DIR` e criado na inicialização ou no primeiro uso.
- O nome original deve ser usado somente para exibição e para o header de download.
- O cadastro do metadado ocorre após a gravação do arquivo.
- Em erro posterior ao upload, o service/repository deve tentar remover o arquivo criado.
- O repository não deve aceitar um caminho arbitrário originado da requisição.

### 7.3 Identificação e isolamento

`X-User-Id` é uma convenção temporária para delimitar os documentos por usuário. A aplicação não deve interpretar esse header como prova de identidade. Até que exista autenticação real, a responsabilidade de fornecer esse valor confiável fica fora do sistema.

Listagem e download devem filtrar pelo proprietário antes de retornar dados. Para evitar vazamento de existência, um documento de outro usuário deve ser tratado como `404` no download.

### 7.4 Limitações conhecidas

Os arquivos são persistidos no disco, mas os metadados ficam somente em memória. Após reiniciar o processo, os arquivos podem continuar em `STORAGE_DIR`, porém não estarão disponíveis pela API até que uma estratégia futura de persistência ou reconstrução seja definida. Esta etapa não deve criar essa estratégia.

## 8. Plano de execução

Este plano orienta a implementação posterior. A entrega atual contém somente este documento e não executa nenhuma das etapas abaixo.

1. **Configuração e infraestrutura local:** definir leitura de `PORT`, `STORAGE_DIR` e `MAX_UPLOAD_SIZE`; criar o diretório de armazenamento sem sobrescrever arquivos existentes.
2. **Repository de documentos:** implementar a coleção em memória, gravação/leitura de arquivos, geração ou recebimento de referências internas e limpeza de arquivos órfãos.
3. **Service de documentos:** implementar upload, criação dos metadados, filtragem por proprietário e autorização para download.
4. **Controllers e validação:** criar validação de `X-User-Id`, arquivo, ID e limite; mapear resultados e erros para os contratos HTTP definidos.
5. **Rotas e multer:** registrar `POST /upload`, `GET /documents` e `GET /documents/:id/download`, configurando `diskStorage`, limite de tamanho e tratamento de erros do middleware.
6. **Integração do app:** preservar `GET /health`, conectar as rotas ao Express e garantir o formato uniforme das respostas de erro.
7. **Testes de backend:** adicionar testes com `node:test` para upload válido, ausência de usuário/arquivo, limite de tamanho, listagem isolada por usuário, download autorizado, acesso indevido, ID inexistente e arquivo ausente.
8. **Serviço do frontend:** centralizar chamadas `fetch` em `frontend/src/services`, incluindo `X-User-Id`, tratamento dos erros padronizados e download de respostas binárias.
9. **Componentes e páginas do frontend:** implementar formulário de upload, estado de progresso ou carregamento, listagem de metadados, ação de download, estado vazio e mensagens de erro em português.
10. **Integração ponta a ponta:** validar o proxy `/api`, executar backend e frontend juntos, testar os fluxos principais e verificar que os arquivos são criados somente em `backend/storage`.
11. **Revisão final:** conferir contratos, cobertura dos requisitos, segurança dos nomes/caminhos, documentação das limitações e ausência de dependência de armazenamento externo.