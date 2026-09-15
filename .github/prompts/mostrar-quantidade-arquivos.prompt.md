---
description: Exibe a quantidade de arquivos carregados para o usuário atual.
name: mostrar-quantidade-arquivos
argument-hint: texto da contagem (opcional, ex. arquivos carregados)
agent: agent
---

Implemente a exibição da quantidade de arquivos já carregados no frontend do DMS.

Considere o usuário atualmente selecionado e use a lista de documentos já carregada pela aplicação como fonte da contagem. Não crie uma chamada adicional à API nem mantenha um contador separado: a quantidade deve ser derivada de `documents.length`.

Requisitos:

- Exiba a contagem na seção de documentos, próxima ao título `Documentos`.
- Use o texto `${input:rotulo:arquivos carregados}` seguido da quantidade atual.
- Atualize a contagem automaticamente quando os documentos forem carregados, quando o usuário mudar e após um upload bem-sucedido.
- Mostre `0` quando não houver documentos, sem remover a mensagem de estado vazio.
- Preserve o fluxo existente de listagem, upload, download, tratamento de erros e identificação do usuário.
- Siga os componentes, estilos e padrões já existentes no frontend.
- Faça alterações somente nos arquivos necessários e valide a aplicação com os testes ou comandos disponíveis no projeto.
