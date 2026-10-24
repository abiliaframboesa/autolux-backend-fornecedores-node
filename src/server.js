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

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`API AutoLux disponível em http://localhost:${PORT}`);
});