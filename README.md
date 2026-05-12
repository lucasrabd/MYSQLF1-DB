# 🏎️ MYSQLF1-DB

Banco de dados relacional temático de **Fórmula 1**, desenvolvido como projeto acadêmico da disciplina de Banco de Dados — Engenharia de Computação · Mackenzie · 2026.

---

## 📦 Stack

![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat&logo=mysql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat&logo=flask&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-CSS3-E34F26?style=flat&logo=html5&logoColor=white)

---

## 🗄️ Estrutura do Banco

6 tabelas cobrindo equipes, pilotos, circuitos, corridas, resultados e pit stops da temporada 2024.

```
equipes ──< pilotos ──< resultados >── corridas >── circuitos
                              └──< pit_stops
```

---

## 🚀 Como Rodar

**1. Banco de dados**
```sql
source 01_SQL/f1_database.sql
```

**2. Backend**
```bash
cd 02_Backend
python -m pip install -r requirements.txt
python app.py
```

**3. Frontend**

Abra `03_Frontend/index.html` no navegador.

---

## 📁 Estrutura do Projeto

```
├── 01_SQL/           → Script DDL + DML completo
├── 02_Backend/       → API REST em Flask
├── 03_Frontend/      → Interface web (HTML/CSS/JS)
└── 04_Docs/          → Documentação e requisitos
```
