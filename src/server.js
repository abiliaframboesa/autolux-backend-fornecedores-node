const express = require('express');
const pool = require('./database');

const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rota inicial para confirmar que a API funciona
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API AutoLux a funcionar!',
        estado: 'OK'
    });
});

// Listar todos os fornecedores
app.get('/fornecedores', async (req, res) => {
    try {
        const [fornecedores] = await pool.query(
            'SELECT * FROM fornecedores'
        );

        res.json(fornecedores);
    } catch (erro) {
        console.error('Erro ao consultar fornecedores:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar os fornecedores.'
        });
    }
});


// Consultar um fornecedor pelo ID
app.get('/fornecedores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        const [fornecedores] = await pool.query(
            'SELECT * FROM fornecedores WHERE id = ?',
            [id]
        );

        if (fornecedores.length === 0) {
            return res.status(404).json({
                erro: 'Fornecedor não encontrado.'
            });
        }

        res.json(fornecedores[0]);
    } catch (erro) {
        console.error('Erro ao consultar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar o fornecedor.'
        });
    }
});


// Registar um novo fornecedor
app.post('/fornecedores', async (req, res) => {
    try {
        const { nome, email, telefone } = req.body;

        if (
            typeof nome !== 'string' || !nome.trim() ||
            typeof email !== 'string' || !email.trim() ||
            typeof telefone !== 'string' || !telefone.trim()
        ) {
            return res.status(400).json({
                erro: 'Nome, email e telefone são obrigatórios.'
            });
        }

        const [resultado] = await pool.query(
            'INSERT INTO fornecedores (nome, email, telefone, ativo) VALUES (?, ?, ?, ?)',
            [nome.trim(), email.trim(), telefone.trim(), 1]
        );

        res.status(201).json({
            mensagem: 'Fornecedor criado com sucesso!',
            id: resultado.insertId,
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
            ativo: 1
        });
    } catch (erro) {
        console.error('Erro ao criar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível criar o fornecedor.'
        });
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`API AutoLux disponível em http://localhost:${PORT}`);
});