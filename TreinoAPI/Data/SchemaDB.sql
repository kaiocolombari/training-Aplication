CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    telefone VARCHAR(20),
    tipo VARCHAR(20) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuario_tipo_check
        CHECK (tipo IN ('PERSONAL', 'ALUNO'))
);

CREATE TABLE personais (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nome VARCHAR(200) NOT NULL,

	usuario_id UUID NOT NULL UNIQUE,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL UNIQUE,

    nome_completo VARCHAR(200) NOT NULL,
    genero VARCHAR(50),
    data_nascimento DATE,

    etnia VARCHAR(50),

    massa DECIMAL(6,2),
    estatura DECIMAL(5,2),

    femur DECIMAL(6,2),
    tibia DECIMAL(6,2),
    una DECIMAL(6,2),
    umero DECIMAL(6,2),

    fc_repouso INTEGER,
    fc_reserva INTEGER,

    glicose DECIMAL(8,2),
    triglicerideos DECIMAL(8,2),
    ldl DECIMAL(8,2),
    hdl DECIMAL(8,2),

    sistolica INTEGER,
    diastolica INTEGER,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE personal_alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    personal_id UUID NOT NULL,
    aluno_id UUID NOT NULL,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (personal_id)
        REFERENCES personais(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE,

    UNIQUE (personal_id, aluno_id)
);

CREATE TABLE anamneses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    aluno_id UUID NOT NULL,

    tipo VARCHAR(30) NOT NULL,

    objetivo TEXT,
    observacoes TEXT,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE,

    CONSTRAINT anamnese_tipo_check
        CHECK (
            tipo IN (
                'INICIAL',
                'SEGUNDA',
                'COMPARACAO'
            )
        )
);

CREATE TABLE avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    aluno_id UUID NOT NULL,

    numero INTEGER NOT NULL,

    peso DECIMAL(6,2),
    altura DECIMAL(5,2),
    percentual_gordura DECIMAL(5,2),

    realizada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE,

    UNIQUE (aluno_id, numero)
);

CREATE TABLE perimetros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    avaliacao_id UUID NOT NULL UNIQUE,

    braco_d DECIMAL(6,2),
    braco_e DECIMAL(6,2),

    antebraco_d DECIMAL(6,2),
    antebraco_e DECIMAL(6,2),

    torax DECIMAL(6,2),
    cintura DECIMAL(6,2),
    abdomen DECIMAL(6,2),
    quadril DECIMAL(6,2),

    coxa_sup_d DECIMAL(6,2),
    coxa_sup_e DECIMAL(6,2),

    coxa_media_d DECIMAL(6,2),
    coxa_media_e DECIMAL(6,2),

    panturrilha_d DECIMAL(6,2),
    panturrilha_e DECIMAL(6,2),

    FOREIGN KEY (avaliacao_id)
        REFERENCES avaliacoes(id)
        ON DELETE CASCADE
);

CREATE TABLE dobras_cutaneas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    avaliacao_id UUID NOT NULL,

    medida INTEGER NOT NULL,

    triceps DECIMAL(6,2),
    subescapular DECIMAL(6,2),
    biceps DECIMAL(6,2),
    iliaca DECIMAL(6,2),
    supraespinhal DECIMAL(6,2),
    abdominal DECIMAL(6,2),
    coxa_media DECIMAL(6,2),
    panturrilha DECIMAL(6,2),

    FOREIGN KEY (avaliacao_id)
        REFERENCES avaliacoes(id)
        ON DELETE CASCADE,

    UNIQUE (avaliacao_id, medida),

    CHECK (medida IN (1, 2))
);

CREATE TABLE testes_carga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    aluno_id UUID NOT NULL,

    numero INTEGER NOT NULL,

    realizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE,

    UNIQUE (aluno_id, numero)
);

CREATE TABLE cargas_exercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    teste_carga_id UUID NOT NULL,

    exercicio VARCHAR(100) NOT NULL,

    carga DECIMAL(7,2),
    repeticoes INTEGER,

    FOREIGN KEY (teste_carga_id)
        REFERENCES testes_carga(id)
        ON DELETE CASCADE
);

CREATE TABLE treinos (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	aluno_id UUID NOT NULL,
	nome VARCHAR(100) NOT NULL,
	criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (aluno_id)
		REFERENCES alunos(id)
		ON DELETE CASCADE
);

CREATE TABLE treino_exercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    treino_id UUID NOT NULL,

    exercicio VARCHAR(150) NOT NULL,

    ordem INTEGER NOT NULL,

    series INTEGER,
    repeticoes INTEGER,

    intervalo INTEGER,

    carga DECIMAL(7,2),

    rir_max INTEGER,

    observacoes TEXT,

    FOREIGN KEY (treino_id)
        REFERENCES treinos(id)
        ON DELETE CASCADE
);

CREATE TABLE periodizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    aluno_id UUID NOT NULL,

    nome VARCHAR(100),

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE
);

CREATE TABLE periodizacao_semanas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    periodizacao_id UUID NOT NULL,

    numero INTEGER NOT NULL,

    FOREIGN KEY (periodizacao_id)
        REFERENCES periodizacoes(id)
        ON DELETE CASCADE,

    UNIQUE (periodizacao_id, numero)
);

CREATE TABLE periodizacao_dias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    semana_id UUID NOT NULL,

    data DATE,

    dia_semana INTEGER NOT NULL,

    FOREIGN KEY (semana_id)
        REFERENCES periodizacao_semanas(id)
        ON DELETE CASCADE,

    UNIQUE (semana_id, dia_semana),

    CHECK (dia_semana BETWEEN 1 AND 7)
);

CREATE TABLE dia_treinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dia_id UUID NOT NULL,

    treino_id UUID NOT NULL,

    ordem INTEGER NOT NULL,

    FOREIGN KEY (dia_id)
        REFERENCES periodizacao_dias(id)
        ON DELETE CASCADE,

    FOREIGN KEY (treino_id)
        REFERENCES treinos(id)
        ON DELETE CASCADE,

    UNIQUE (dia_id, ordem),

    CHECK (ordem BETWEEN 1 AND 3)
);

CREATE TABLE grupos_musculares (
    id SERIAL PRIMARY KEY,

    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE volume_semanal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    periodizacao_semana_id UUID NOT NULL,

    grupo_muscular_id INTEGER NOT NULL,

    series INTEGER DEFAULT 0,

    FOREIGN KEY (periodizacao_semana_id)
        REFERENCES periodizacao_semanas(id)
        ON DELETE CASCADE,

    FOREIGN KEY (grupo_muscular_id)
        REFERENCES grupos_musculares(id)
        ON DELETE CASCADE,

    UNIQUE (
        periodizacao_semana_id,
        grupo_muscular_id
    )
);

