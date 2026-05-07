import mysql.connector 
from mysql.connector import Error
from datetime import datetime


# ─────────────────────────────────────────────
#  CONFIGURACAO DE CONEXAO — altere conforme seu ambiente
# ─────────────────────────────────────────────
DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",       
    "password": "12345678",  
    "database": "Formula1_DB",
    "charset":  "utf8mb4"
}


# ─────────────────────────────────────────────
#  CLASSE DE CONEXAO
# ─────────────────────────────────────────────
class F1Database:
    def __init__(self, config: dict):
        self.config = config
        self.conn   = None
        self.cursor = None

    def conectar(self):
        """Abre conexao com o MySQL."""
        try:
            self.conn   = mysql.connector.connect(**self.config)
            self.cursor = self.conn.cursor(dictionary=True)
            print(f"\n  [OK] Conectado a '{self.config['database']}' em {self.config['host']}")
        except Error as e:
            print(f"\n  [ERRO] Falha na conexao: {e}")
            raise

    def desconectar(self):
        """Fecha cursor e conexao."""
        if self.cursor:
            self.cursor.close()
        if self.conn and self.conn.is_connected():
            self.conn.close()
            print("\n  [OK] Conexao encerrada.")

    def executar_query(self, sql: str, params=None):
        """Executa SELECT e retorna lista de dicts."""
        self.cursor.execute(sql, params or ())
        return self.cursor.fetchall()

    def executar_dml(self, sql: str, params=None):
        """Executa INSERT / UPDATE / DELETE e comita."""
        self.cursor.execute(sql, params or ())
        self.conn.commit()
        return self.cursor.rowcount


# ─────────────────────────────────────────────
#  FUNCOES DE EXIBICAO
# ─────────────────────────────────────────────
def linha(char="─", tamanho=64):
    print(char * tamanho)

def cabecalho(titulo: str):
    print()
    linha("═")
    print(f"  {titulo}")
    linha("═")

def exibir_tabela(rows: list, colunas: list):
    """Imprime resultado formatado no console."""
    if not rows:
        print("  Nenhum registro encontrado.")
        return
    larguras = {col: len(col) for col in colunas}
    for row in rows:
        for col in colunas:
            val = str(row.get(col, ""))
            if len(val) > larguras[col]:
                larguras[col] = len(val)
    linha()
    cabecalho_linha = "  " + "  |  ".join(col.upper().ljust(larguras[col]) for col in colunas)
    print(cabecalho_linha)
    linha()
    for row in rows:
        valores = "  " + "  |  ".join(str(row.get(col, "")).ljust(larguras[col]) for col in colunas)
        print(valores)
    linha()
    print(f"  {len(rows)} registro(s) retornado(s).")


# ─────────────────────────────────────────────
#  FUNCOES DE CONSULTA
# ─────────────────────────────────────────────
def classificacao_pilotos(db: F1Database):
    cabecalho("CLASSIFICACAO DE PILOTOS - TEMPORADA")
    sql = """
        SELECT p.nome AS Piloto,
               p.numero_carro AS Num,
               e.nome_equipe  AS Equipe,
               p.pontos_temporada AS Pontos
        FROM pilotos p
        INNER JOIN equipes e ON p.id_equipe = e.id_equipe
        ORDER BY p.pontos_temporada DESC
    """
    rows = db.executar_query(sql)
    exibir_tabela(rows, ["Piloto", "Num", "Equipe", "Pontos"])


def classificacao_construtores(db: F1Database):
    cabecalho("CLASSIFICACAO DE CONSTRUTORES")
    sql = """
        SELECT nome_equipe AS Equipe,
               pais_origem AS Pais,
               motor       AS Motor,
               pontos_construtores AS Pontos
        FROM equipes
        ORDER BY pontos_construtores DESC
    """
    rows = db.executar_query(sql)
    exibir_tabela(rows, ["Equipe", "Pais", "Motor", "Pontos"])


def resultados_gp(db: F1Database):
    cabecalho("RESULTADOS POR GRANDE PREMIO")
    # Lista GPs disponiveis
    gps = db.executar_query("SELECT id_corrida, nome_gp FROM corridas ORDER BY data_corrida")
    for gp in gps:
        print(f"  [{gp['id_corrida']}] {gp['nome_gp']}")
    linha()
    try:
        escolha = int(input("  Digite o ID do GP: "))
    except ValueError:
        print("  Entrada invalida.")
        return

    sql = """
        SELECT r.posicao_chegada AS Pos,
               p.nome            AS Piloto,
               e.nome_equipe     AS Equipe,
               r.pontos_obtidos  AS Pts,
               r.volta_rapida    AS VoltaRapida,
               r.status          AS Status
        FROM resultados r
        INNER JOIN pilotos p  ON r.id_piloto  = p.id_piloto
        INNER JOIN equipes e  ON p.id_equipe  = e.id_equipe
        INNER JOIN corridas c ON r.id_corrida = c.id_corrida
        WHERE r.id_corrida = %s
        ORDER BY r.posicao_chegada
    """
    rows = db.executar_query(sql, (escolha,))
    exibir_tabela(rows, ["Pos", "Piloto", "Equipe", "Pts", "VoltaRapida", "Status"])


def circuitos_info(db: F1Database):
    cabecalho("CIRCUITOS DO CAMPEONATO")
    sql = """
        SELECT nome_circuito AS Circuito,
               pais          AS Pais,
               cidade        AS Cidade,
               comprimento_km AS `Km`,
               numero_curvas AS Curvas,
               recorde_volta AS Recorde
        FROM circuitos
        ORDER BY comprimento_km DESC
    """
    rows = db.executar_query(sql)
    exibir_tabela(rows, ["Circuito", "Pais", "Cidade", "Km", "Curvas", "Recorde"])


def inserir_resultado(db: F1Database):
    """Demonstra INSERT via Python."""
    cabecalho("INSERIR NOVO RESULTADO")
    try:
        id_corrida   = int(input("  ID da corrida  : "))
        id_piloto    = int(input("  ID do piloto   : "))
        pos_largada  = int(input("  Posicao largada: "))
        pos_chegada  = input("  Posicao chegada (Enter = abandonou): ").strip()
        pontos       = int(input("  Pontos obtidos : "))

        sql = """
            INSERT INTO resultados
                (id_corrida, id_piloto, posicao_largada, posicao_chegada, pontos_obtidos, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        pos_chegada_val = int(pos_chegada) if pos_chegada else None
        status_val = "Finalizado" if pos_chegada_val else "Abandonou"
        afetados = db.executar_dml(sql, (id_corrida, id_piloto, pos_largada, pos_chegada_val, pontos, status_val))
        print(f"\n  [OK] {afetados} registro(s) inserido(s) com sucesso!")
    except (ValueError, Error) as e:
        print(f"\n  [ERRO] {e}")


def atualizar_pontos_piloto(db: F1Database):
    """Demonstra UPDATE via Python."""
    cabecalho("ATUALIZAR PONTOS DE PILOTO")
    pilotos = db.executar_query("SELECT id_piloto, nome, pontos_temporada FROM pilotos ORDER BY nome")
    for p in pilotos:
        print(f"  [{p['id_piloto']}] {p['nome']} — {p['pontos_temporada']} pts")
    linha()
    try:
        id_p   = int(input("  ID do piloto: "))
        novos  = int(input("  Novos pontos a adicionar: "))
        sql = "UPDATE pilotos SET pontos_temporada = pontos_temporada + %s WHERE id_piloto = %s"
        afetados = db.executar_dml(sql, (novos, id_p))
        if afetados:
            print(f"\n  [OK] Pontos atualizados com sucesso!")
        else:
            print(f"\n  [AVISO] Piloto nao encontrado.")
    except (ValueError, Error) as e:
        print(f"\n  [ERRO] {e}")


def estatisticas_gerais(db: F1Database):
    """Mostra estatisticas consolidadas."""
    cabecalho("ESTATISTICAS GERAIS")
    sql_total_pilotos   = "SELECT COUNT(*) AS total FROM pilotos"
    sql_total_equipes   = "SELECT COUNT(*) AS total FROM equipes"
    sql_total_corridas  = "SELECT COUNT(*) AS total FROM corridas"
    sql_total_resultados= "SELECT COUNT(*) AS total FROM resultados"
    sql_lider           = """
        SELECT nome, pontos_temporada FROM pilotos ORDER BY pontos_temporada DESC LIMIT 1
    """
    sql_melhor_const    = """
        SELECT nome_equipe, pontos_construtores FROM equipes ORDER BY pontos_construtores DESC LIMIT 1
    """

    r_p  = db.executar_query(sql_total_pilotos)[0]["total"]
    r_e  = db.executar_query(sql_total_equipes)[0]["total"]
    r_c  = db.executar_query(sql_total_corridas)[0]["total"]
    r_r  = db.executar_query(sql_total_resultados)[0]["total"]
    lider= db.executar_query(sql_lider)[0]
    const= db.executar_query(sql_melhor_const)[0]

    print(f"  Pilotos cadastrados  : {r_p}")
    print(f"  Equipes cadastradas  : {r_e}")
    print(f"  Corridas registradas : {r_c}")
    print(f"  Resultados inseridos : {r_r}")
    print()
    print(f"  Lider do campeonato  : {lider['nome']} ({lider['pontos_temporada']} pts)")
    print(f"  Melhor construtor    : {const['nome_equipe']} ({const['pontos_construtores']} pts)")
    linha()


# ─────────────────────────────────────────────
#  MENU PRINCIPAL
# ─────────────────────────────────────────────
MENU = """
  ╔══════════════════════════════════════════╗
  ║   SISTEMA DE FORMULA 1  — Formula1_DB   ║
  ╠══════════════════════════════════════════╣
  ║  [1] Classificacao de Pilotos           ║
  ║  [2] Classificacao de Construtores      ║
  ║  [3] Resultados de GP                   ║
  ║  [4] Informacoes de Circuitos           ║
  ║  [5] Estatisticas Gerais                ║
  ║  [6] Inserir Resultado (INSERT)         ║
  ║  [7] Atualizar Pontos de Piloto (UPDATE)║
  ║  [0] Sair                               ║
  ╚══════════════════════════════════════════╝
"""

OPCOES = {
    "1": classificacao_pilotos,
    "2": classificacao_construtores,
    "3": resultados_gp,
    "4": circuitos_info,
    "5": estatisticas_gerais,
    "6": inserir_resultado,
    "7": atualizar_pontos_piloto,
}

def main():
    db = F1Database(DB_CONFIG)
    try:
        db.conectar()
        while True:
            print(MENU)
            opcao = input("  Escolha uma opcao: ").strip()
            if opcao == "0":
                break
            elif opcao in OPCOES:
                OPCOES[opcao](db)
            else:
                print("  Opcao invalida. Tente novamente.")
            input("\n  Pressione Enter para continuar...")
    except Error:
        print("\n  Verifique as configuracoes de conexao no DB_CONFIG.")
    finally:
        db.desconectar()

if __name__ == "__main__":
    main()
