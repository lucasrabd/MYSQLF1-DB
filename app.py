"""
F1 Database – Backend Flask
Projeto de Banco de Dados 2026 – Mackenzie
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import mysql.connector
import os

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",
    "password": "12345678",  
    "database": "Formula1_2026",
}


def get_conn():
    return mysql.connector.connect(**DB_CONFIG)


def query(sql, params=None, many=False):
    conn = get_conn()
    cur  = conn.cursor(dictionary=True)
    cur.execute(sql, params or ())
    if many:
        rows = cur.fetchall()
        cur.close(); conn.close()
        return rows
    row = cur.fetchall()
    conn.commit()
    cur.close(); conn.close()
    return row


# ── Serve frontend ───────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory("../frontend", "index.html")


# ══════════════════════════════════════════════════════════════════════════════
# PILOTOS
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/pilotos")
def get_pilotos():
    rows = query("""
        SELECT p.id_piloto, p.nome, p.nacionalidade, p.numero,
               p.data_nascimento, p.pontos_temporada,
               e.nome AS equipe, e.motor
        FROM pilotos p
        INNER JOIN equipes e ON p.id_equipe = e.id_equipe
        ORDER BY p.pontos_temporada DESC
    """, many=True)
    return jsonify(rows)


@app.route("/api/pilotos/<int:pid>")
def get_piloto(pid):
    row = query("""
        SELECT p.*, e.nome AS equipe, e.motor, e.pais AS pais_equipe
        FROM pilotos p INNER JOIN equipes e ON p.id_equipe = e.id_equipe
        WHERE p.id_piloto = %s
    """, (pid,), many=True)
    if not row:
        return jsonify({"error": "Piloto não encontrado"}), 404
    piloto = row[0]
    # resultados do piloto
    piloto["resultados"] = query("""
        SELECT c.nome AS corrida, cr.nome AS circuito, cr.pais,
               r.posicao, r.pontos, r.volta_rapida, r.tempo_total, r.abandonou
        FROM resultados r
        INNER JOIN corridas c   ON r.id_corrida  = c.id_corrida
        INNER JOIN circuitos cr ON c.id_circuito = cr.id_circuito
        WHERE r.id_piloto = %s
        ORDER BY c.data_corrida
    """, (pid,), many=True)
    return jsonify(piloto)


@app.route("/api/pilotos", methods=["POST"])
def add_piloto():
    d = request.json
    query("""
        INSERT INTO pilotos (nome, nacionalidade, numero, data_nascimento, id_equipe, pontos_temporada)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (d["nome"], d["nacionalidade"], d["numero"],
          d.get("data_nascimento"), d["id_equipe"], d.get("pontos_temporada", 0)))
    return jsonify({"ok": True}), 201


@app.route("/api/pilotos/<int:pid>", methods=["PUT"])
def update_piloto(pid):
    d = request.json
    query("""
        UPDATE pilotos SET nome=%s, nacionalidade=%s, numero=%s,
               id_equipe=%s, pontos_temporada=%s
        WHERE id_piloto=%s
    """, (d["nome"], d["nacionalidade"], d["numero"],
          d["id_equipe"], d["pontos_temporada"], pid))
    return jsonify({"ok": True})


@app.route("/api/pilotos/<int:pid>", methods=["DELETE"])
def delete_piloto(pid):
    query("DELETE FROM pilotos WHERE id_piloto=%s", (pid,))
    return jsonify({"ok": True})


# ══════════════════════════════════════════════════════════════════════════════
# EQUIPES
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/equipes")
def get_equipes():
    rows = query("""
        SELECT e.*,
               COUNT(DISTINCT p.id_piloto) AS num_pilotos,
               COALESCE(SUM(r.pontos),0) AS pontos_calculados
        FROM equipes e
        LEFT JOIN pilotos p  ON p.id_equipe = e.id_equipe
        LEFT JOIN resultados r ON r.id_piloto = p.id_piloto
        GROUP BY e.id_equipe
        ORDER BY pontos_calculados DESC
    """, many=True)
    return jsonify(rows)


# ══════════════════════════════════════════════════════════════════════════════
# CORRIDAS
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/corridas")
def get_corridas():
    rows = query("""
        SELECT c.id_corrida, c.nome, c.data_corrida, c.temporada,
               cr.nome AS circuito, cr.pais, cr.cidade, cr.extensao_km, cr.numero_voltas
        FROM corridas c
        INNER JOIN circuitos cr ON c.id_circuito = cr.id_circuito
        ORDER BY c.data_corrida
    """, many=True)
    return jsonify(rows)


@app.route("/api/corridas/<int:cid>")
def get_corrida(cid):
    info = query("""
        SELECT c.*, cr.nome AS circuito, cr.pais, cr.cidade,
               cr.extensao_km, cr.numero_voltas
        FROM corridas c INNER JOIN circuitos cr ON c.id_circuito = cr.id_circuito
        WHERE c.id_corrida = %s
    """, (cid,), many=True)
    if not info:
        return jsonify({"error": "Corrida não encontrada"}), 404
    corrida = info[0]
    corrida["resultados"] = query("""
        SELECT r.posicao, p.nome AS piloto, p.numero,
               e.nome AS equipe, r.pontos, r.volta_rapida, r.tempo_total, r.abandonou
        FROM resultados r
        INNER JOIN pilotos p ON r.id_piloto = p.id_piloto
        INNER JOIN equipes e ON p.id_equipe = e.id_equipe
        WHERE r.id_corrida = %s
        ORDER BY CASE WHEN r.posicao IS NULL THEN 1 ELSE 0 END, r.posicao
    """, (cid,), many=True)
    return jsonify(corrida)


# ══════════════════════════════════════════════════════════════════════════════
# CIRCUITOS
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/circuitos")
def get_circuitos():
    rows = query("SELECT * FROM circuitos ORDER BY nome", many=True)
    return jsonify(rows)


# ══════════════════════════════════════════════════════════════════════════════
# CLASSIFICAÇÕES
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/classificacao/pilotos")
def classificacao_pilotos():
    rows = query("""
        SELECT p.nome, p.numero, p.nacionalidade,
               e.nome AS equipe,
               COALESCE(SUM(r.pontos),0) AS total_pontos,
               COUNT(CASE WHEN r.posicao=1 THEN 1 END) AS vitorias,
               COUNT(CASE WHEN r.posicao<=3 THEN 1 END) AS podios,
               COUNT(CASE WHEN r.volta_rapida=1 THEN 1 END) AS voltas_rapidas
        FROM pilotos p
        INNER JOIN equipes e  ON p.id_equipe  = e.id_equipe
        LEFT JOIN resultados r ON r.id_piloto = p.id_piloto
        GROUP BY p.id_piloto
        ORDER BY total_pontos DESC
    """, many=True)
    return jsonify(rows)


@app.route("/api/classificacao/construtores")
def classificacao_construtores():
    rows = query("""
        SELECT e.nome, e.pais, e.motor,
               COALESCE(SUM(r.pontos),0) AS total_pontos,
               COUNT(CASE WHEN r.posicao=1 THEN 1 END) AS vitorias
        FROM equipes e
        LEFT JOIN pilotos p   ON p.id_equipe  = e.id_equipe
        LEFT JOIN resultados r ON r.id_piloto = p.id_piloto
        GROUP BY e.id_equipe
        ORDER BY total_pontos DESC
    """, many=True)
    return jsonify(rows)


# ══════════════════════════════════════════════════════════════════════════════
# PIT STOPS
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/pitstops/media")
def pitstops_media():
    rows = query("""
        SELECT e.nome AS equipe,
               ROUND(AVG(ps.duracao_seg),3) AS media_seg,
               COUNT(*) AS total_stops,
               MIN(ps.duracao_seg) AS min_seg
        FROM pit_stops ps
        INNER JOIN resultados r ON ps.id_resultado = r.id_resultado
        INNER JOIN pilotos p    ON r.id_piloto     = p.id_piloto
        INNER JOIN equipes e    ON p.id_equipe     = e.id_equipe
        GROUP BY e.id_equipe
        ORDER BY media_seg
    """, many=True)
    return jsonify(rows)


# ══════════════════════════════════════════════════════════════════════════════
# STATS GERAIS (dashboard)
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/stats")
def stats():
    def single(sql):
        r = query(sql, many=True)
        return r[0] if r else {}

    return jsonify({
        "total_corridas":  single("SELECT COUNT(*) AS v FROM corridas")["v"],
        "total_pilotos":   single("SELECT COUNT(*) AS v FROM pilotos")["v"],
        "total_equipes":   single("SELECT COUNT(*) AS v FROM equipes")["v"],
        "total_pitstops":  single("SELECT COUNT(*) AS v FROM pit_stops")["v"],
        "lider_pilotos":   single("""
            SELECT p.nome, COALESCE(SUM(r.pontos),0) AS pts
            FROM pilotos p LEFT JOIN resultados r ON r.id_piloto=p.id_piloto
            GROUP BY p.id_piloto ORDER BY pts DESC LIMIT 1
        """),
        "lider_construtores": single("""
            SELECT e.nome, COALESCE(SUM(r.pontos),0) AS pts
            FROM equipes e
            LEFT JOIN pilotos p  ON p.id_equipe =e.id_equipe
            LEFT JOIN resultados r ON r.id_piloto=p.id_piloto
            GROUP BY e.id_equipe ORDER BY pts DESC LIMIT 1
        """),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
