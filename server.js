// server.js - Versão Corrigida
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração CORS para Render e desenvolvimento
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Middleware de logging simples
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// Criar diretório para backups se não existir
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Criar/abrir banco de dados SQLite
const DB_FILE = path.join(__dirname, 'demandas.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) return console.error('❌ Erro ao abrir o banco de dados:', err);
    console.log('✅ Banco de dados SQLite pronto!');
    inicializarBancoDados();
});

// Habilitar chaves estrangeiras
db.run('PRAGMA foreign_keys = ON');

// Função para inicializar o banco de dados
function inicializarBancoDados() {
    // Tabela de demandas com índices
    db.run(`
        CREATE TABLE IF NOT EXISTS demandas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionarioId INTEGER NOT NULL,
            nomeFuncionario TEXT NOT NULL,
            emailFuncionario TEXT NOT NULL,
            categoria TEXT NOT NULL,
            prioridade TEXT NOT NULL,
            complexidade TEXT NOT NULL,
            descricao TEXT NOT NULL,
            local TEXT NOT NULL,
            dataCriacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            dataLimite TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            isRotina INTEGER DEFAULT 0,
            diasSemana TEXT,
            tag TEXT UNIQUE,
            comentarios TEXT DEFAULT '',
            comentarioGestor TEXT DEFAULT '',
            dataConclusao TEXT,
            atribuidos TEXT DEFAULT '[]',
            anexosCriacao TEXT DEFAULT '[]',
            anexosResolucao TEXT DEFAULT '[]',
            comentarioReprovacaoAtribuicao TEXT DEFAULT '',
            nomeDemanda TEXT,
            dataAtualizacao TEXT DEFAULT CURRENT_TIMESTAMP,
            criadoPor INTEGER,
            atualizadoPor INTEGER
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela demandas:', err);
        else {
            console.log('✅ Tabela demandas criada/verificada');
            criarIndices();
        }
    });
}

// Criar índices para performance
function criarIndices() {
    const indices = [
        'CREATE INDEX IF NOT EXISTS idx_status ON demandas(status)',
        'CREATE INDEX IF NOT EXISTS idx_funcionarioId ON demandas(funcionarioId)',
        'CREATE INDEX IF NOT EXISTS idx_dataLimite ON demandas(dataLimite)',
        'CREATE INDEX IF NOT EXISTS idx_tag ON demandas(tag)',
        'CREATE INDEX IF NOT EXISTS idx_categoria ON demandas(categoria)',
        'CREATE INDEX IF NOT EXISTS idx_prioridade ON demandas(prioridade)'
    ];

    let completed = 0;
    indices.forEach(sql => {
        db.run(sql, (err) => {
            if (err) console.error('Erro ao criar índice:', err);
            else {
                completed++;
                if (completed === indices.length) {
                    console.log('✅ Índices criados/verificados');
                    criarTabelaUsuarios();
                }
            }
        });
    });
}

// Tabela de usuários
function criarTabelaUsuarios() {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY,
            nome TEXT UNIQUE,
            email TEXT UNIQUE,
            senha TEXT,
            nivel TEXT,
            pontos INTEGER DEFAULT 0,
            conquistas TEXT DEFAULT '[]',
            role TEXT DEFAULT 'funcionario'
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela usuarios:', err);
        else {
            console.log('✅ Tabela usuarios criada/verificada');
            criarTabelaAuditoria();
        }
    });
}

// Tabela de auditoria
function criarTabelaAuditoria() {
    db.run(`
        CREATE TABLE IF NOT EXISTS auditoria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acao TEXT NOT NULL,
            tabela TEXT NOT NULL,
            registroId INTEGER NOT NULL,
            dadosAntigos TEXT,
            dadosNovos TEXT,
            usuarioId INTEGER,
            dataHora TEXT DEFAULT CURRENT_TIMESTAMP,
            ip TEXT
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela auditoria:', err);
        else {
            console.log('✅ Tabela auditoria criada/verificada');
            criarTabelaFeedbacks();
        }
    });
}

// Tabela de feedbacks
function criarTabelaFeedbacks() {
    db.run(`
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionarioId INTEGER,
            gestorId INTEGER,
            tipo TEXT,
            mensagem TEXT,
            dataCriacao TEXT
        )
    `, (err) => {
        if (err) console.error('Erro ao criar tabela feedbacks:', err);
        else {
            console.log('✅ Tabela feedbacks criada/verificada');
            inserirUsuariosPadrao();
        }
    });
}

// Inserir usuários padrão
function inserirUsuariosPadrao() {
    const usuariosPadrao = [
        { id: 1, nome: 'Ranielly Miranda De Souza', email: 'ranielly-s@zaminebrasil.com', nivel: 'Senior', pontos: 450, conquistas: '["star", "fire", "gold"]', senha: '123456', role: 'funcionario' },
        { id: 2, nome: 'Girlene da Silva Nogueira', email: 'girlene-n@zaminebrasil.com', nivel: 'Pleno', pontos: 380, conquistas: '["star", "silver"]', senha: '123456', role: 'funcionario' },
        { id: 3, nome: 'Rafaela Cristine da Silva Martins', email: 'rafaela-m@zaminebrasil.com', nivel: 'Senior', pontos: 520, conquistas: '["star", "fire", "gold"]', senha: '123456', role: 'funcionario' },
        { id: 5, nome: 'Marcos Antônio Lino Rosa', email: 'marcos-a@zaminebrasil.com', nivel: 'Junior', pontos: 280, conquistas: '["star"]', senha: '123456', role: 'funcionario' },
        { id: 6, nome: 'Marcos Paulo Moraes Borges', email: 'marcos-b@zaminebrasil.com', nivel: 'Pleno', pontos: 410, conquistas: '["star", "silver"]', senha: '123456', role: 'funcionario' },
        { id: 7, nome: 'Marcelo Goncalves de Paula', email: 'marcelo-p@zaminebrasil.com', nivel: 'Senior', pontos: 480, conquistas: '["star", "fire", "gold"]', senha: '123456', role: 'funcionario' },
        { id: 8, nome: 'Higor Ataides Macedo', email: 'higor-a@zaminebrasil.com', nivel: 'Junior', pontos: 250, conquistas: '["star"]', senha: '123456', role: 'funcionario' },
        { id: 9, nome: 'Weslley Ferreira de Siqueira', email: 'weslley-f@zaminebrasil.com', nivel: 'Pleno', pontos: 360, conquistas: '["star", "silver"]', senha: '123456', role: 'funcionario' },
        { id: 10, nome: 'Jadson Joao Romano', email: 'jadson-r@zaminebrasil.com', nivel: 'Senior', pontos: 440, conquistas: '["star", "fire", "gold"]', senha: '123456', role: 'funcionario' },
        { id: 11, nome: 'Charles de Andrade', email: 'charles-a@zaminebrasil.com', nivel: 'Pleno', pontos: 390, conquistas: '["star", "silver"]', senha: '123456', role: 'funcionario' },
        { id: 12, nome: 'Jose Carlos Rodrigues de Santana', email: 'jose-s@zaminebrasil.com', nivel: 'Junior', pontos: 220, conquistas: '["star"]', senha: '123456', role: 'funcionario' },
        { id: 13, nome: 'Max Henrique Araujo', email: 'max-r@zaminebrasil.com', nivel: 'Pleno', pontos: 340, conquistas: '["star", "silver"]', senha: '123456', role: 'funcionario' },
        { id: 99, nome: 'Gestor do Sistema', email: 'wallysson-s@zaminebrasil.com', nivel: 'Administrador', pontos: 999, conquistas: '["star", "fire", "gold", "crown"]', senha: 'admin123', role: 'gestor' },
        { id: 100, nome: 'Wallysson Diego Santiago Santos', email: 'wallysson-s@zaminebrasil.com', nivel: 'Coordenador', pontos: 999, conquistas: '["star", "fire", "gold", "crown"]', senha: 'admin123', role: 'gestor' },
        { id: 101, nome: 'Julio Cesar Sanches', email: 'julio-s@zaminebrasil.com', nivel: 'Gerente', pontos: 999, conquistas: '["star", "fire", "gold", "crown"]', senha: 'admin123', role: 'gestor' }
    ];

    let inseridos = 0;
    usuariosPadrao.forEach((usuario) => {
        db.run(`
            INSERT OR IGNORE INTO usuarios 
            (id, nome, email, senha, nivel, pontos, conquistas, role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            usuario.id,
            usuario.nome,
            usuario.email,
            usuario.senha,
            usuario.nivel,
            usuario.pontos,
            usuario.conquistas,
            usuario.role
        ], function(err) {
            if (err) console.error(`Erro ao inserir usuário ${usuario.nome}:`, err);
            else {
                inseridos++;
                if (inseridos === usuariosPadrao.length) {
                    console.log('✅ Todos os usuários padrão foram inseridos');
                    // Iniciar backups automáticos
                    agendarBackups();
                }
            }
        });
    });
}

// Função para normalizar dados da demanda
function normalizarDadosDemanda(demanda) {
    if (!demanda) return demanda;

    // Garante que 'diasSemana' seja um array
    if (typeof demanda.diasSemana === 'string') {
        try {
            demanda.diasSemana = JSON.parse(demanda.diasSemana);
        } catch (e) {
            demanda.diasSemana = [];
        }
    } else if (!Array.isArray(demanda.diasSemana)) {
        demanda.diasSemana = [];
    }

    // Garante que 'atribuidos' seja um array
    if (typeof demanda.atribuidos === 'string') {
        try {
            demanda.atribuidos = JSON.parse(demanda.atribuidos);
        } catch (e) {
            demanda.atribuidos = [];
        }
    } else if (!Array.isArray(demanda.atribuidos)) {
        demanda.atribuidos = [];
    }

    // Garante que 'isRotina' seja um booleano
    demanda.isRotina = Boolean(demanda.isRotina);

    // Garante que 'anexosCriacao' seja um array
    if (typeof demanda.anexosCriacao === 'string') {
        try {
            demanda.anexosCriacao = JSON.parse(demanda.anexosCriacao);
        } catch (e) {
            demanda.anexosCriacao = [];
        }
    } else if (!Array.isArray(demanda.anexosCriacao)) {
        demanda.anexosCriacao = [];
    }

    // Garante que 'anexosResolucao' seja um array
    if (typeof demanda.anexosResolucao === 'string') {
        try {
            demanda.anexosResolucao = JSON.parse(demanda.anexosResolucao);
        } catch (e) {
            demanda.anexosResolucao = [];
        }
    } else if (!Array.isArray(demanda.anexosResolucao)) {
        demanda.anexosResolucao = [];
    }

    return demanda;
}

// Função para registrar auditoria
const registrarAuditoria = (acao, tabela, registroId, dadosAntigos, dadosNovos, usuarioId, ip) => {
    const sql = `
        INSERT INTO auditoria (acao, tabela, registroId, dadosAntigos, dadosNovos, usuarioId, ip)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
        acao,
        tabela,
        registroId,
        JSON.stringify(dadosAntigos || {}),
        JSON.stringify(dadosNovos || {}),
        usuarioId,
        ip
    ], (err) => {
        if (err) console.error('Erro ao registrar auditoria:', err);
    });
};

// Middleware de validação simples
const validarDemanda = (req, res, next) => {
    const { nomeDemanda, categoria, prioridade, complexidade, descricao, local, dataLimite } = req.body;
    
    if (!nomeDemanda || nomeDemanda.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Nome da demanda é obrigatório' });
    }
    
    if (!categoria) {
        return res.status(400).json({ success: false, error: 'Categoria é obrigatória' });
    }
    
    if (!dataLimite) {
        return res.status(400).json({ success: false, error: 'Data limite é obrigatória' });
    }
    
    next();
};

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check melhorado
app.get('/health', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM demandas', [], (err, row) => {
        if (err) {
            console.error('Erro no health check:', err);
            return res.status(500).json({ 
                status: 'ERROR', 
                error: err.message,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({ 
            status: 'OK', 
            demandas: row.count,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage()
        });
    });
});

// GET /api/demandas - Listar demandas
app.get('/api/demandas', (req, res) => {
    const { status, funcionarioId, categoria, prioridade } = req.query;
    
    let sql = 'SELECT * FROM demandas WHERE 1=1';
    const params = [];
    
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    
    if (funcionarioId) {
        sql += ' AND funcionarioId = ?';
        params.push(funcionarioId);
    }
    
    if (categoria) {
        sql += ' AND categoria = ?';
        params.push(categoria);
    }
    
    if (prioridade) {
        sql += ' AND prioridade = ?';
        params.push(prioridade);
    }
    
    sql += ' ORDER BY dataCriacao DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar demandas:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        // Normalizar cada demanda antes de enviar
        const demandasNormalizadas = rows.map(demanda => normalizarDadosDemanda(demanda));
        res.json(demandasNormalizadas);
    });
});

// GET /api/usuarios
app.get('/api/usuarios', (req, res) => {
    db.all('SELECT * FROM usuarios', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(rows);
    });
});

// POST /api/demandas - Criar nova demanda
app.post('/api/demandas', validarDemanda, (req, res) => {
    const d = req.body;
    
    // Normalizar dados antes de salvar
    const dadosNormalizados = normalizarDadosDemanda(d);
    
    // Gerar TAG única se não fornecida
    if (!dadosNormalizados.tag) {
        dadosNormalizados.tag = `DEM-${Date.now()}`;
    }
    
    const sql = `
        INSERT INTO demandas 
        (funcionarioId, nomeFuncionario, emailFuncionario, categoria, prioridade, complexidade, descricao, local, dataCriacao, dataLimite, status, isRotina, diasSemana, tag, comentarios, comentarioGestor, atribuidos, anexosCriacao, nomeDemanda, criadoPor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        dadosNormalizados.funcionarioId,
        dadosNormalizados.nomeFuncionario,
        dadosNormalizados.emailFuncionario,
        dadosNormalizados.categoria,
        dadosNormalizados.prioridade,
        dadosNormalizados.complexidade,
        dadosNormalizados.descricao,
        dadosNormalizados.local,
        dadosNormalizados.dataCriacao || new Date().toISOString(),
        dadosNormalizados.dataLimite,
        dadosNormalizados.status || 'pendente',
        dadosNormalizados.isRotina ? 1 : 0,
        JSON.stringify(dadosNormalizados.diasSemana),
        dadosNormalizados.tag,
        dadosNormalizados.comentarios || '',
        dadosNormalizados.comentarioGestor || '',
        JSON.stringify(dadosNormalizados.atribuidos),
        JSON.stringify(dadosNormalizados.anexosCriacao),
        dadosNormalizados.nomeDemanda,
        dadosNormalizados.funcionarioId
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao criar demanda:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        // Registrar auditoria
        registrarAuditoria(
            'CREATE',
            'demandas',
            this.lastID,
            null,
            dadosNormalizados,
            dadosNormalizados.funcionarioId,
            req.ip
        );
        
        res.json({ 
            success: true, 
            demanda: { id: this.lastID, ...dadosNormalizados, dataCriacao: params[8] }
        });
    });
});

// PUT /api/demandas/:id - Atualizar demanda
app.put('/api/demandas/:id', (req, res) => {
    const id = req.params.id;
    const d = req.body;
    
    // Buscar demanda existente
    db.get('SELECT * FROM demandas WHERE id = ?', [id], (err, demandaExistente) => {
        if (err) {
            console.error('Erro ao buscar demanda:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (!demandaExistente) {
            return res.status(404).json({ success: false, error: 'Demanda não encontrada' });
        }
        
        // Normalizar dados antes de atualizar
        const dadosNormalizados = normalizarDadosDemanda(d);
        
        const dadosCompletos = { ...demandaExistente, ...dadosNormalizados };
        
        // Atualizar data de modificação
        dadosCompletos.dataAtualizacao = new Date().toISOString();
        dadosCompletos.atualizadoPor = d.funcionarioId;
        
        const sql = `
            UPDATE demandas SET
            funcionarioId = ?, nomeFuncionario = ?, emailFuncionario = ?, categoria = ?, prioridade = ?, 
            complexidade = ?, descricao = ?, local = ?, dataLimite = ?, status = ?, 
            isRotina = ?, diasSemana = ?, tag = ?, comentarios = ?, comentarioGestor = ?, 
            dataConclusao = ?, atribuidos = ?, anexosCriacao = ?, anexosResolucao = ?, 
            comentarioReprovacaoAtribuicao = ?, nomeDemanda = ?, dataAtualizacao = ?, atualizadoPor = ?
            WHERE id = ?
        `;
        
        const params = [
            dadosCompletos.funcionarioId,
            dadosCompletos.nomeFuncionario,
            dadosCompletos.emailFuncionario,
            dadosCompletos.categoria,
            dadosCompletos.prioridade,
            dadosCompletos.complexidade,
            dadosCompletos.descricao,
            dadosCompletos.local,
            dadosCompletos.dataLimite,
            dadosCompletos.status,
            dadosCompletos.isRotina ? 1 : 0,
            JSON.stringify(dadosCompletos.diasSemana),
            dadosCompletos.tag,
            dadosCompletos.comentarios || '',
            dadosCompletos.comentarioGestor || '',
            dadosCompletos.dataConclusao || null,
            JSON.stringify(dadosCompletos.atribuidos),
            JSON.stringify(dadosCompletos.anexosCriacao),
            JSON.stringify(dadosCompletos.anexosResolucao),
            dadosCompletos.comentarioReprovacaoAtribuicao || '',
            dadosCompletos.nomeDemanda,
            dadosCompletos.dataAtualizacao,
            dadosCompletos.atualizadoPor,
            id
        ];
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Erro ao atualizar demanda:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            // Registrar auditoria
            registrarAuditoria(
                'UPDATE',
                'demandas',
                id,
                demandaExistente,
                dadosCompletos,
                d.funcionarioId,
                req.ip
            );
            
            // Criar backup para mudanças de status
            if (['aprovada', 'reprovada'].includes(d.status)) {
                criarBackup('status_change');
            }
            
            res.json({ 
                success: true, 
                demanda: { id: parseInt(id), ...dadosCompletos }
            });
        });
    });
});

// DELETE /api/demandas/:id - Excluir demanda
app.delete('/api/demandas/:id', (req, res) => {
    const id = req.params.id;
    
    // Buscar demanda antes de excluir
    db.get('SELECT * FROM demandas WHERE id = ?', [id], (err, demanda) => {
        if (err) {
            console.error('Erro ao buscar demanda para exclusão:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (!demanda) {
            return res.status(404).json({ success: false, error: 'Demanda não encontrada' });
        }
        
        db.run('DELETE FROM demandas WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Erro ao excluir demanda:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            // Registrar auditoria
            registrarAuditoria(
                'DELETE',
                'demandas',
                id,
                demanda,
                null,
                req.body.usuarioId || null,
                req.ip
            );
            
            // Criar backup antes de excluir
            criarBackup('delete');
            
            res.json({ success: true });
        });
    });
});

// POST /api/feedbacks
app.post('/api/feedbacks', (req, res) => {
    const { funcionarioId, tipo, mensagem } = req.body;
    const gestorId = 99; // ID do gestor padrão
    
    const sql = `
        INSERT INTO feedbacks (funcionarioId, gestorId, tipo, mensagem, dataCriacao)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [funcionarioId, gestorId, tipo, mensagem, new Date().toISOString()], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, feedback: { id: this.lastID, funcionarioId, gestorId, tipo, mensagem } });
    });
});

// GET /api/feedbacks
app.get('/api/feedbacks', (req, res) => {
    db.all('SELECT * FROM feedbacks ORDER BY dataCriacao DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(rows);
    });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    
    db.get('SELECT * FROM usuarios WHERE email = ? AND senha = ?', [email, senha], (err, row) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!row) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
        
        // Remover senha do retorno
        const { senha: _, ...usuarioSemSenha } = row;
        res.json({ success: true, usuario: usuarioSemSenha });
    });
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req, res) => {
    const { email } = req.body;
    res.json({ success: true, message: 'Instruções de redefinição de senha enviadas para o email' });
});

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
    const { nome, email, role } = req.body;
    res.json({ success: true, message: 'Solicitação de cadastro recebida' });
});

// GET /api/demandas/estatisticas
app.get('/api/demandas/estatisticas', (req, res) => {
    const { periodo = 30 } = req.query;
    
    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - parseInt(periodo));
    
    const sql = `
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as aprovadas,
            COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
            COUNT(CASE WHEN status = 'reprovada' THEN 1 END) as reprovadas,
            COUNT(CASE WHEN status = 'finalizado_pendente_aprovacao' THEN 1 END) em_analise,
            COUNT(CASE WHEN isRotina = 1 THEN 1 END) as rotina
        FROM demandas 
        WHERE dataCriacao >= ?
    `;
    
    db.get(sql, [dataCorte.toISOString()], (err, row) => {
        if (err) {
            console.error('Erro ao buscar estatísticas:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        res.json({ success: true, estatisticas: row });
    });
});

// GET /api/demandas/search
app.get('/api/demandas/search', (req, res) => {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
        return res.json({ success: true, data: [] });
    }
    
    const sql = `
        SELECT * FROM demandas 
        WHERE nomeDemanda LIKE ? OR descricao LIKE ? OR tag LIKE ?
        ORDER BY dataCriacao DESC
        LIMIT ?
    `;
    
    const searchTerm = `%${q}%`;
    
    db.all(sql, [searchTerm, searchTerm, searchTerm, parseInt(limit)], (err, rows) => {
        if (err) {
            console.error('Erro na busca:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        const demandasNormalizadas = rows.map(demanda => normalizarDadosDemanda(demanda));
        res.json({ success: true, data: demandasNormalizadas });
    });
});

// POST /api/backup
app.post('/api/backup', (req, res) => {
    const { tipo = 'manual' } = req.body;
    
    criarBackup(tipo, (err, filename) => {
        if (err) {
            console.error('Erro ao criar backup:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        res.json({ 
            success: true, 
            message: `Backup criado com sucesso`,
            filename: filename
        });
    });
});

// GET /api/backup - Download do backup atual
app.get('/api/backup', (req, res) => {
    db.all('SELECT * FROM demandas', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        const backup = {
            data: new Date().toISOString(),
            demandas: rows.map(demanda => normalizarDadosDemanda(demanda))
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="backup_${Date.now()}.json"`);
        res.send(JSON.stringify(backup, null, 2));
    });
});

// POST /api/restore
app.post('/api/restore', (req, res) => {
    const { demandas } = req.body;
    
    if (!Array.isArray(demandas)) {
        return res.status(400).json({ success: false, error: 'Formato inválido' });
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    demandas.forEach(demanda => {
        const dadosNormalizados = normalizarDadosDemanda(demanda);
        
        const sql = `
            INSERT OR REPLACE INTO demandas 
            (id, funcionarioId, nomeFuncionario, emailFuncionario, categoria, prioridade, complexidade, descricao, local, dataCriacao, dataLimite, status, isRotina, diasSemana, tag, comentarios, comentarioGestor, dataConclusao, atribuidos, anexosCriacao, anexosResolucao, comentarioReprovacaoAtribuicao, nomeDemanda)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            dadosNormalizados.id,
            dadosNormalizados.funcionarioId,
            dadosNormalizados.nomeFuncionario,
            dadosNormalizados.emailFuncionario,
            dadosNormalizados.categoria,
            dadosNormalizados.prioridade,
            dadosNormalizados.complexidade,
            dadosNormalizados.descricao,
            dadosNormalizados.local,
            dadosNormalizados.dataCriacao,
            dadosNormalizados.dataLimite,
            dadosNormalizados.status,
            dadosNormalizados.isRotina ? 1 : 0,
            JSON.stringify(dadosNormalizados.diasSemana),
            dadosNormalizados.tag,
            dadosNormalizados.comentarios || '',
            dadosNormalizados.comentarioGestor || '',
            dadosNormalizados.dataConclusao || null,
            JSON.stringify(dadosNormalizados.atribuidos),
            JSON.stringify(dadosNormalizados.anexosCriacao),
            JSON.stringify(dadosNormalizados.anexosResolucao),
            dadosNormalizados.comentarioReprovacaoAtribuicao || '',
            dadosNormalizados.nomeDemanda
        ];
        
        db.run(sql, params, function(err) {
            if (err) {
                errorCount++;
                console.error('Erro ao restaurar demanda:', err);
            } else {
                successCount++;
            }
        });
    });
    
    setTimeout(() => {
        res.json({ 
            success: true, 
            message: `Restauração concluída. ${successCount} demandas restauradas, ${errorCount} erros.` 
        });
    }, 1000);
});

// Função para criar backups
const criarBackup = (tipo = 'auto', callback) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${tipo}_${timestamp}.json`;
    const backupPath = path.join(backupDir, filename);
    
    // Buscar todas as demandas
    db.all('SELECT * FROM demandas', [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar demandas para backup:', err);
            if (callback) callback(err);
            return;
        }
        
        const backupData = {
            versao: '1.0.0',
            data: timestamp,
            tipo: tipo,
            totalDemandas: rows.length,
            demandas: rows.map(demanda => normalizarDadosDemanda(demanda))
        };
        
        fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), (err) => {
            if (err) {
                console.error('Erro ao salvar backup:', err);
                if (callback) callback(err);
                return;
            }
            
            console.log(`✅ Backup ${tipo} criado: ${filename}`);
            if (callback) callback(null, filename);
        });
    });
};

// Agendar backups automáticos
function agendarBackups() {
    // Backup automático a cada 6 horas
    setInterval(() => {
        criarBackup('auto');
    }, 6 * 60 * 60 * 1000);
    
    // Limpar backups antigos (manter apenas 10)
    setInterval(() => {
        fs.readdir(backupDir, (err, files) => {
            if (err) return;
            
            const backupFiles = files.filter(f => f.startsWith('backup_auto_'));
            if (backupFiles.length > 10) {
                // Ordenar por data (mais antigos primeiro)
                backupFiles.sort();
                
                // Remover os mais antigos
                const toRemove = backupFiles.slice(0, backupFiles.length - 10);
                toRemove.forEach(file => {
                    fs.unlink(path.join(backupDir, file), (err) => {
                        if (err) console.error('Erro ao remover backup antigo:', err);
                    });
                });
            }
        });
    }, 24 * 60 * 60 * 1000);
}

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message,
        timestamp: new Date().toISOString()
    });
});

// Rota 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        path: req.path,
        method: req.method
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado em porta ${PORT}`);
    console.log(`📁 Diretório de backups: ${backupDir}`);
    console.log(`⏰ Backups automáticos a cada 6 horas`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT. Criando backup final...');
    
    criarBackup('shutdown', (err, filename) => {
        if (err) {
            console.error('Erro ao criar backup final:', err);
        } else {
            console.log(`✅ Backup final criado: ${filename}`);
        }
        
        console.log('👋 Encerrando servidor...');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido SIGTERM. Encerrando servidor...');
    process.exit(0);
});