# 🧠 Memories

Uma aplicação full stack para registrar memórias marcantes com imagem, descrição e comentários — tudo salvo em banco de dados.

## 🔍 Visão Geral

Memories é um projeto MERN (MongoDB, Express, React, Node.js) desenvolvido para fins de aprendizado. Usuários podem:

- Criar memórias com título, descrição e imagem.
- Visualizar uma galeria com todas as memórias.
- Comentar em memórias específicas.

## 🚀 Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- MongoDB (via Mongoose)
- Multer (upload de imagem)
- CORS
- Dotenv

### Frontend
- React
- React Router DOM
- Axios
- React Toastify

## 📦 Instalação

### Pré-requisitos

- Node.js
- MongoDB local ou Atlas
- Git

### Clonando o repositório

```bash
git clone https://github.com/LuizMatt/memories.git
cd memories
```
## Rodando o projeto
### Backend
```bash
cd backend
npm install
# Crie um arquivo .env com as seguintes variáveis:
# DB_USER = Seu user no mongoDB
# DB_PASS = Sua senha no mongoDB
npm start

```

### Frontend
```bash
cd frontend
npm install
npm run dev

