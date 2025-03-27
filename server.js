// Aqui eu importo os pacotes que vou utilizar
const WebSocket = require('ws');
const mysql = require('mysql2');
const express = require('express');
const http = require('http'); // Importar o módulo HTTP para unir o WebSocket e o Express

// BASICAMENTE, O QUE TEM DE NOVO É ESSA PARTE DO HTTP, PARA RODA O EXPRESS E O WEBSOCKET NA MESMA PORTA
// E UM FOREACH PARA MANDAR MENSAGEM DE LIGAR OU DESLIGAR A BOMBA PARA TODOS OS CLIENTES CONECTADOS


// Cria a aplicação Express
const app = express();
const server = http.createServer(app); // Cria o servidor HTTP usando o Express

// Configurando o WebSocket no mesmo servidor HTTP, mas com uma instância separada
const wss = new WebSocket.Server({ server }); // WebSocket e Express compartilhando o mesmo servidor

// Aqui eu crio uma conexão com o banco, assim como é feito em PHP também
// Este host, user e password são padrão do XAMPP
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bombex' // Este é o nome do banco que criei no phpMyAdmin
});

// Aqui eu crio uma verificação, onde no cmd quando eu iniciar o servidor, tem que mostrar se foi conectado ao banco
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL.');
});

// Aqui é a lógica de conexão de dispositivos, mensagens e insert do banco via WebSocket
wss.on('connection', function connection(ws) {
    console.log('Novo cliente conectado!'); // Sempre que um dispositivo conectar, esta mensagem aparecerá no cmd

    ws.send('Bem-vindo ao servidor WebSocket!'); // Esta aparecerá para o dispositivo (WebSocket Tester)

    // Aqui o código recebe a mensagem e tenta (try/catch) converter para JSON
    ws.on('message', function incoming(message) {
        console.log('Recebido: %s', message);

        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            console.error('Erro ao converter mensagem em JSON:', err);
            ws.send('Formato de mensagem inválido.');
            return;
        }

        // Se a conversão der certo, o código executa a query para inserir os dados no banco
        if (data.corrente) {
            const currentTime = new Date();

            const query = 'INSERT INTO corrente (corrente, timestamp) VALUES (?, ?)';
            db.query(query, [data.corrente, currentTime], (err, result) => {
                if (err) {
                    console.error('Erro ao salvar no banco de dados:', err);
                    ws.send('Erro ao salvar no banco de dados.');
                } else {
                    console.log('Dado inserido no banco de dados com sucesso.');
                    ws.send('OK'); // Esta mensagem aparece no WebSocket Tester
                }
            }); // AQUI EU APENAS ADICIONEI UM ELSE IF PARA CRIAR O SISTEMA DE LIGAR E DESLIGAR AS BOMBAS
        } else if (data.bomba && data.command) { // Para comandos de ligar/desligar
            const bomba = data.bomba;
            const estado = data.command === "ON" ? "ligada" : "desligada"; 
            const timestamp = new Date();

            // **Enviar a mensagem de status para o WebSocket Tester**
            const resposta = `Ligar Bomba ${bomba}`; // EU ARMAZENO O COMANDO DA BOMBA QUE FOI USADO EM UMA VARIÁVEL
                                                     // DEPOIS MOSTRO NO TERMINAL DO SERVIDOR
            console.log(resposta);  // Mostrar no terminal do servidor

            // Aqui garanti que a mensagem é enviada para todos os clientes conectados 
            wss.clients.forEach(function each(client) { // E AQUI SIM O CÓDIGO VAI MOSTAR O COMANDO PARA OS CLIENTES
                if (client.readyState === WebSocket.OPEN) {
                    client.send(resposta);  
                }
            });
            // E SÓ DEPOIS VAI INSERIR NO BANCO
            // Inserir no banco de dados a ação de ligar/desligar a bomba
            const query = 'INSERT INTO bombas (bomba, estado, timestamp) VALUES (?, ?, ?)';
            db.query(query, [bomba, estado, timestamp], (err, result) => {
                if (err) {
                    console.error('Erro ao registrar comando no banco de dados:', err);
                    ws.send('Erro ao registrar comando.');
                } else {
                    console.log(`Comando registrado: Bomba ${bomba} - ${estado} com sucesso.`);
                    ws.send('Comando registrado com sucesso!'); // ESSA MENSAGEM NÃO APARECE PARA OS CLIENTES!!!!
                }
            });
        } else {
            ws.send('Mensagem JSON deve conter o atributo "corrente" ou "bomba" e "command".');
        }
    }); // DE RESTO, NADA DE NOVO!!!!

    // Quando o dispositivo desconectar, aparece esta mensagem no cmd
    ws.on('close', function close() {
        console.log('Cliente desconectado');
    });
});

// Aqui você configura uma API com Express para pegar os dados do banco e mostrar em uma tela
app.get('/api/corrente', (req, res) => {
    const query = 'SELECT corrente, timestamp FROM corrente ORDER BY id DESC LIMIT 1'; // Query de SELECT
    db.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao buscar no banco de dados:', err);
            res.status(500).send({ message: 'Erro ao buscar os dados.' });
        } else {
            res.send(result[0]); // Enviar os dados mais recentes de corrente e timestamp
        }
    });
});

// Iniciar o servidor HTTP que combina WebSocket e Express
server.listen(4000, () => {
    console.log('Servidor rodando na porta 4000 (Express + WebSocket)');
});

console.log('Iniciando servidor!!');


//ACABEI DE LIGAR O WEBSOCKET TESTER!!!
//
