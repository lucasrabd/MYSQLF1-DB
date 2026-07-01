-- =============================================================================
-- F1 DATABASE — Projeto de Banco de Dados 2026
-- Lucas Carabolad Bob · Engenharia de Computação · Mackenzie
-- Script DDL + dados de exemplo (temporada 2024) — MySQL 8.x
-- =============================================================================

-- =============================================================================
-- 1. CRIAÇÃO DO BANCO
-- =============================================================================
DROP DATABASE IF EXISTS Formula1_2026;

CREATE DATABASE Formula1_2026
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE Formula1_2026;

-- =============================================================================
-- 2. CRIAÇÃO DAS TABELAS (DDL)
-- =============================================================================

-- Tabela: equipes
CREATE TABLE equipes (
  id_equipe INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  pais VARCHAR(60) NOT NULL,
  motor VARCHAR(80) NOT NULL,
  pontos_construtor INT DEFAULT 0,
  fundacao YEAR
);

-- Tabela: pilotos
CREATE TABLE pilotos (
  id_piloto INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  nacionalidade VARCHAR(60) NOT NULL,
  numero TINYINT UNSIGNED NOT NULL UNIQUE,
  data_nascimento DATE,
  id_equipe INT NOT NULL,
  pontos_temporada INT DEFAULT 0,
  CONSTRAINT fk_piloto_equipe
    FOREIGN KEY (id_equipe) REFERENCES equipes(id_equipe)
);

-- Tabela: circuitos
CREATE TABLE circuitos (
  id_circuito INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  pais VARCHAR(60) NOT NULL,
  cidade VARCHAR(80) NOT NULL,
  extensao_km DECIMAL(5,3) NOT NULL,
  numero_voltas TINYINT UNSIGNED NOT NULL
);

-- Tabela: corridas
CREATE TABLE corridas (
  id_corrida INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  id_circuito INT NOT NULL,
  data_corrida DATE NOT NULL,
  temporada YEAR NOT NULL,
  CONSTRAINT fk_corrida_circuito
    FOREIGN KEY (id_circuito) REFERENCES circuitos(id_circuito)
);

-- Tabela: resultados
CREATE TABLE resultados (
  id_resultado INT AUTO_INCREMENT PRIMARY KEY,
  id_corrida INT NOT NULL,
  id_piloto INT NOT NULL,
  posicao TINYINT UNSIGNED,
  pontos TINYINT UNSIGNED DEFAULT 0,
  volta_rapida BOOLEAN DEFAULT FALSE,
  tempo_total VARCHAR(20),
  abandonou BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_res_corrida
    FOREIGN KEY (id_corrida) REFERENCES corridas(id_corrida),
  CONSTRAINT fk_res_piloto
    FOREIGN KEY (id_piloto) REFERENCES pilotos(id_piloto),
  CONSTRAINT uq_corrida_piloto UNIQUE (id_corrida, id_piloto)
);

-- Tabela: pit_stops
CREATE TABLE pit_stops (
  id_pitstop INT AUTO_INCREMENT PRIMARY KEY,
  id_resultado INT NOT NULL,
  numero_stop TINYINT UNSIGNED NOT NULL,
  volta TINYINT UNSIGNED NOT NULL,
  duracao_seg DECIMAL(5,2) NOT NULL,
  composto ENUM('Macio','Medio','Duro','Intermediario','Chuva') NOT NULL,
  CONSTRAINT fk_pitstop_resultado
    FOREIGN KEY (id_resultado) REFERENCES resultados(id_resultado)
);

-- =============================================================================
-- 3. DADOS DE EXEMPLO (DML) — Temporada 2024
-- =============================================================================

-- Equipes
INSERT INTO equipes (nome, pais, motor, pontos_construtor, fundacao) VALUES
  ('Red Bull Racing', 'Austria', 'Honda RBPT', 860, 2005),
  ('Ferrari', 'Italia', 'Ferrari', 652, 1950),
  ('McLaren', 'Reino Unido', 'Mercedes', 666, 1963);

-- Pilotos
INSERT INTO pilotos (nome, nacionalidade, numero, id_equipe, pontos_temporada) VALUES
  ('Max Verstappen', 'Holandes', 1, 1, 314),
  ('Sergio Perez', 'Mexicano', 11, 1, 175),
  ('Charles Leclerc', 'Monegasco', 16, 2, 206),
  ('Carlos Sainz', 'Espanhol', 55, 2, 190),
  ('Lando Norris', 'Britanico', 4, 3, 310),
  ('Oscar Piastri', 'Australiano', 81, 3, 262);

-- Circuitos
INSERT INTO circuitos (nome, pais, cidade, extensao_km, numero_voltas) VALUES
  ('Bahrain International Circuit', 'Bahrein', 'Sakhir', 5.412, 57),
  ('Jeddah Corniche Circuit', 'Arabia Saudita', 'Jeddah', 6.174, 50);

-- Corridas
INSERT INTO corridas (nome, id_circuito, data_corrida, temporada) VALUES
  ('GP do Bahrein', 1, '2024-03-02', 2024),
  ('GP da Arabia Saudita', 2, '2024-03-09', 2024);

-- Resultados — GP do Bahrein (id_corrida = 1)
INSERT INTO resultados (id_corrida, id_piloto, posicao, pontos, volta_rapida, tempo_total, abandonou) VALUES
  (1, 1, 1, 25, FALSE, '1:31:44.742', FALSE),
  (1, 2, 2, 18, FALSE, '+22.457',     FALSE),
  (1, 3, 3, 15, TRUE,  '+25.110',     FALSE),
  (1, 4, 4, 12, FALSE, '+39.669',     FALSE),
  (1, 5, 5, 10, FALSE, '+46.788',     FALSE),
  (1, 6, 6, 8,  FALSE, '+48.458',     FALSE);

-- Pit stops — GP do Bahrein
INSERT INTO pit_stops (id_resultado, numero_stop, volta, duracao_seg, composto) VALUES
  (1, 1, 15, 2.34, 'Medio'),
  (1, 2, 36, 2.28, 'Duro'),
  (2, 1, 14, 2.41, 'Medio'),
  (2, 2, 35, 2.31, 'Duro'),
  (3, 1, 16, 2.55, 'Medio');

-- =============================================================================
-- 4. CONSULTAS DE DEMONSTRAÇÃO (DML — SELECT / UPDATE / DELETE)
-- =============================================================================

-- 4.1 Classificação de pilotos (SELECT + WHERE + ORDER BY)
SELECT p.nome AS Piloto, e.nome AS Equipe,
       p.pontos_temporada AS Pontos
FROM pilotos p
INNER JOIN equipes e ON p.id_equipe = e.id_equipe
WHERE p.pontos_temporada > 0
ORDER BY p.pontos_temporada DESC
LIMIT 10;

-- 4.2 Resultado de uma corrida (INNER JOIN múltiplo)
SELECT r.posicao, p.nome AS Piloto,
       eq.nome AS Equipe, r.pontos,
       r.volta_rapida, r.tempo_total
FROM resultados r
INNER JOIN pilotos p ON r.id_piloto = p.id_piloto
INNER JOIN equipes eq ON p.id_equipe = eq.id_equipe
WHERE r.id_corrida = 1
ORDER BY r.posicao;

-- 4.3 Total de vitórias por piloto (GROUP BY + COUNT)
SELECT p.nome AS Piloto, COUNT(*) AS Vitorias
FROM resultados r
INNER JOIN pilotos p ON r.id_piloto = p.id_piloto
WHERE r.posicao = 1
GROUP BY p.id_piloto
ORDER BY Vitorias DESC;

-- 4.4 Média de pit stops por equipe (AVG + 4 JOINs)
SELECT e.nome AS Equipe,
       ROUND(AVG(ps.duracao_seg), 3) AS Media_seg,
       COUNT(*) AS Total_Stops
FROM pit_stops ps
INNER JOIN resultados r ON ps.id_resultado = r.id_resultado
INNER JOIN pilotos p ON r.id_piloto = p.id_piloto
INNER JOIN equipes e ON p.id_equipe = e.id_equipe
GROUP BY e.id_equipe
ORDER BY Media_seg;

-- 4.5 Pilotos com volta rápida no Top 5 (AND composto)
SELECT p.nome AS Piloto, c.nome AS Corrida
FROM resultados r
INNER JOIN pilotos p ON r.id_piloto = p.id_piloto
INNER JOIN corridas c ON r.id_corrida = c.id_corrida
WHERE r.volta_rapida = TRUE
AND r.posicao <= 5
ORDER BY c.data_corrida;

-- 4.6 Atualizar pontos dos construtores com base nos resultados (UPDATE + Subquery)
UPDATE equipes e
SET pontos_construtor = (
  SELECT COALESCE(SUM(r.pontos), 0)
  FROM resultados r
  INNER JOIN pilotos p ON r.id_piloto = p.id_piloto
  WHERE p.id_equipe = e.id_equipe
);

-- 4.7 Remoção controlada de registros (DELETE + verificação)
DELETE FROM resultados
WHERE abandonou = TRUE
AND id_corrida = 1;

SELECT COUNT(*) FROM resultados WHERE id_corrida = 1;
