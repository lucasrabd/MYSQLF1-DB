# 🏎️ F1 Database

Sistema de gerenciamento temático de Fórmula 1 com banco relacional MySQL, API Flask e interface web — projeto acadêmico da disciplina de **Banco de Dados**, Engenharia de Computação, Universidade Presbiteriana Mackenzie · 2026.

**Autor:** Lucas Carabolad Bob

---

## 📦 Stack

![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat&logo=mysql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat&logo=flask&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-CSS3-E34F26?style=flat&logo=html5&logoColor=white)

---

## 🗄️ Modelo de Dados

6 tabelas cobrindo equipes, pilotos, circuitos, corridas, resultados e pit stops da temporada 2024.

```
equipes ──< pilotos ──< resultados >── corridas >── circuitos
                              └──< pit_stops
```

| Tabela | Atributos |
|---|---|
| `equipes` | id_equipe (PK), nome, pais, motor, pontos_construtor, fundacao |
| `pilotos` | id_piloto (PK), nome, nacionalidade, numero (UQ), data_nascimento, pontos_temporada, id_equipe (FK) |
| `circuitos` | id_circuito (PK), nome, pais, cidade, extensao_km, numero_voltas |
| `corridas` | id_corrida (PK), nome, data_corrida, temporada, id_circuito (FK) |
| `resultados` | id_resultado (PK), posicao, pontos, volta_rapida, tempo_total, abandonou, id_corrida (FK), id_piloto (FK) |
| `pit_stops` | id_pitstop (PK), numero_stop, volta, duracao_seg, composto, id_resultado (FK) |

---

## 📁 Estrutura do Projeto

```
MYSQLF1-DB-main/
├── database/
│   └── f1_database.sql   # Script DDL completo + dados de exemplo + consultas de demonstração
├── app.py                 # Backend Flask (API REST)
├── index.html              # Dashboard (Painel Geral, Pilotos, Equipes, Corridas, Circuitos, Classificação)
├── static/
│   ├── css/style.css       # Estilos do dashboard
│   └── js/main.js          # Consumo da API e renderização das views
├── requirements.txt         # Dependências Python
├── anotacoes.txt            # Referências usadas durante o desenvolvimento
└── LICENSE                   # MIT
```

---

## 🚀 Como Rodar

**1. Banco de dados**

```sql
source database/f1_database.sql
```

Isso cria o banco `Formula1_2026`, todas as tabelas com constraints e FKs nomeadas, popula com dados de exemplo da temporada 2024 e executa as consultas de demonstração.

**2. Configuração**

Edite as credenciais de conexão em `app.py` (`DB_CONFIG`) conforme seu ambiente:

```python
DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",
    "password": "sua_senha",
    "database": "Formula1_2026",
}
```

**3. Backend**

```bash
python -m pip install -r requirements.txt
python app.py
```

O servidor sobe em `http://localhost:5000`.

**4. Frontend**

Acesse `http://localhost:5000` no navegador.

---

## 🔌 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/pilotos` | Lista pilotos ordenados por pontos |
| GET | `/api/pilotos/<id>` | Perfil + histórico do piloto |
| POST | `/api/pilotos` | Cadastra novo piloto |
| PUT | `/api/pilotos/<id>` | Atualiza dados do piloto |
| DELETE | `/api/pilotos/<id>` | Remove piloto |
| GET | `/api/equipes` | Lista equipes com nº de pilotos e pontos calculados |
| GET | `/api/corridas` | Calendário de corridas |
| GET | `/api/corridas/<id>` | Resultado completo de uma corrida |
| GET | `/api/circuitos` | Lista circuitos |
| GET | `/api/classificacao/pilotos` | Campeonato de pilotos (vitórias, pódios, voltas rápidas) |
| GET | `/api/classificacao/construtores` | Campeonato de construtores |
| GET | `/api/pitstops/media` | Média e mínimo de pit stop por equipe |
| GET | `/api/stats` | Estatísticas gerais para o dashboard (líderes, totais) |

---

## 🖥️ Funcionalidades

- Dashboard com estatísticas gerais, líder de pilotos/construtores e média de pit stops.
- Grid de pilotos com CRUD completo (criar, editar, excluir, ver histórico de resultados).
- Calendário de corridas com resultado detalhado de cada GP.
- Ranking de construtores com pontos calculados dinamicamente a partir dos resultados.
- Classificação de pilotos e construtores (vitórias, pódios, voltas rápidas).

---

## 🧩 Consultas SQL demonstradas

O script `database/f1_database.sql` inclui exemplos comentados de:

- `INSERT` com integridade referencial (equipes → pilotos)
- `SELECT` com `WHERE` + `ORDER BY` (classificação de pilotos)
- `INNER JOIN` múltiplo (resultado de corrida com 3 tabelas)
- `GROUP BY` + `COUNT` (total de vitórias por piloto)
- `AVG` com 4 `JOIN`s encadeados (média de pit stop por equipe)
- Operadores lógicos compostos `AND` (voltas rápidas no Top 5)
- `UPDATE` com subquery (recalcular pontos de construtores)
- `DELETE` controlado com verificação posterior

---

## 📄 Licença

MIT — veja [LICENSE](LICENSE).
