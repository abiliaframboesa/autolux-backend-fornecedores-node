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

//fase 1 - Trabalhar com fornecedores
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

//fase 2 - Trabalhar com encomendas
// Listar todas as encomendas a fornecedores
app.get('/encomendas', async (req, res) => {
    try {
        const [encomendas] = await pool.query(`
            SELECT
                e.id,
                e.fornecedor_id,
                f.nome AS nome_fornecedor,
                e.data_encomenda,
                e.estado,
                e.total
            FROM encomendas_fornecedor e
            INNER JOIN fornecedores f
                ON e.fornecedor_id = f.id
            ORDER BY e.data_encomenda DESC
        `);

        res.json(encomendas);
    } catch (erro) {
        console.error('Erro ao consultar encomendas:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar as encomendas.'
        });
    }
});

//fase 2

// Consultar uma encomenda pelo ID, incluindo as respetivas peças
app.get('/encomendas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        const [encomendas] = await pool.query(
            `SELECT
                e.id,
                e.fornecedor_id,
                f.nome AS nome_fornecedor,
                e.data_encomenda,
                e.estado,
                e.total
             FROM encomendas_fornecedor e
             INNER JOIN fornecedores f
                ON e.fornecedor_id = f.id
             WHERE e.id = ?`,
            [id]
        );

        if (encomendas.length === 0) {
            return res.status(404).json({
                erro: 'Encomenda não encontrada.'
            });
        }

        const [pecas] = await pool.query(
            `SELECT
                id,
                referencia_peca,
                nome_peca,
                quantidade,
                preco_unitario
             FROM encomenda_pecas
             WHERE encomenda_id = ?`,
            [id]
        );

        res.json({
            ...encomendas[0],
            pecas
        });
    } catch (erro) {
        console.error('Erro ao consultar encomenda:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível consultar a encomenda.'
        });
    }
});


//fase 1
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

// fase 1
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

// fase 1
// Atualizar um fornecedor
app.put('/fornecedores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, email, telefone } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

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
            `UPDATE fornecedores
             SET nome = ?, email = ?, telefone = ?
             WHERE id = ?`,
            [nome.trim(), email.trim(), telefone.trim(), id]
        );

        if (resultado.affectedRows === 0) {
            const [fornecedores] = await pool.query(
                'SELECT id FROM fornecedores WHERE id = ?',
                [id]
            );

            if (fornecedores.length === 0) {
                return res.status(404).json({
                    erro: 'Fornecedor não encontrado.'
                });
            }
        }

        res.json({
            mensagem: 'Fornecedor atualizado com sucesso!',
            id,
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim()
        });
    } catch (erro) {
        console.error('Erro ao atualizar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível atualizar o fornecedor.'
        });
    }
});

// fase 1
// Desativar um fornecedor
app.patch('/fornecedores/:id/desativar', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'O ID deve ser um número inteiro positivo.'
            });
        }

        const [resultado] = await pool.query(
            'UPDATE fornecedores SET ativo = 0 WHERE id = ? AND ativo = 1',
            [id]
        );

        if (resultado.affectedRows === 0) {
            const [fornecedores] = await pool.query(
                'SELECT id, ativo FROM fornecedores WHERE id = ?',
                [id]
            );

            if (fornecedores.length === 0) {
                return res.status(404).json({
                    erro: 'Fornecedor não encontrado.'
                });
            }

            return res.status(409).json({
                erro: 'O fornecedor já está desativado.'
            });
        }

        res.json({
            mensagem: 'Fornecedor desativado com sucesso!',
            id,
            ativo: 0
        });
    } catch (erro) {
        console.error('Erro ao desativar fornecedor:', erro.message);

        res.status(500).json({
            erro: 'Não foi possível desativar o fornecedor.'
        });
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`API AutoLux disponível em http://localhost:${PORT}`);
});