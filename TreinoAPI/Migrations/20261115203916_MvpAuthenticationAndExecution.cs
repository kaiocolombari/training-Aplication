using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class MvpAuthenticationAndExecution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Idade",
                table: "Avaliacoes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ExecucoesTreino",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TreinoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Data = table.Column<DateOnly>(type: "date", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExecucoesTreino", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExecucoesTreino_Treinos_TreinoId",
                        column: x => x.TreinoId,
                        principalTable: "Treinos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevogadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SubstituidoPorHash = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExecucoesExercicio",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExecucaoTreinoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TreinoExercicioId = table.Column<Guid>(type: "uuid", nullable: true),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    HardSets = table.Column<int>(type: "integer", nullable: false),
                    Intensidade = table.Column<double>(type: "double precision", nullable: false),
                    Tonelagem = table.Column<double>(type: "double precision", nullable: false),
                    Estimulo = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExecucoesExercicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExecucoesExercicio_ExecucoesTreino_ExecucaoTreinoId",
                        column: x => x.ExecucaoTreinoId,
                        principalTable: "ExecucoesTreino",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExecucoesExercicio_TreinosExercicios_TreinoExercicioId",
                        column: x => x.TreinoExercicioId,
                        principalTable: "TreinosExercicios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ExecucoesSerie",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExecucaoExercicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<int>(type: "integer", nullable: false),
                    Carga = table.Column<double>(type: "double precision", nullable: false),
                    Repeticoes = table.Column<double>(type: "double precision", nullable: false),
                    Rir = table.Column<double>(type: "double precision", nullable: true),
                    Descanso = table.Column<int>(type: "integer", nullable: true),
                    Velocidade = table.Column<double>(type: "double precision", nullable: true),
                    Rpe = table.Column<double>(type: "double precision", nullable: true),
                    ClusterAtivo = table.Column<bool>(type: "boolean", nullable: false),
                    ClusterBlocosJson = table.Column<string>(type: "text", nullable: true),
                    DropSet = table.Column<bool>(type: "boolean", nullable: false),
                    RestPause = table.Column<bool>(type: "boolean", nullable: false),
                    Falha = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExecucoesSerie", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExecucoesSerie_ExecucoesExercicio_ExecucaoExercicioId",
                        column: x => x.ExecucaoExercicioId,
                        principalTable: "ExecucoesExercicio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GruposMusculares_Nome",
                table: "GruposMusculares",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExecucoesExercicio_ExecucaoTreinoId",
                table: "ExecucoesExercicio",
                column: "ExecucaoTreinoId");

            migrationBuilder.CreateIndex(
                name: "IX_ExecucoesExercicio_TreinoExercicioId",
                table: "ExecucoesExercicio",
                column: "TreinoExercicioId");

            migrationBuilder.CreateIndex(
                name: "IX_ExecucoesSerie_ExecucaoExercicioId",
                table: "ExecucoesSerie",
                column: "ExecucaoExercicioId");

            migrationBuilder.CreateIndex(
                name: "IX_ExecucoesTreino_TreinoId_Data",
                table: "ExecucoesTreino",
                columns: new[] { "TreinoId", "Data" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UsuarioId",
                table: "RefreshTokens",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExecucoesSerie");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "ExecucoesExercicio");

            migrationBuilder.DropTable(
                name: "ExecucoesTreino");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_GruposMusculares_Nome",
                table: "GruposMusculares");

            migrationBuilder.DropColumn(
                name: "Idade",
                table: "Avaliacoes");
        }
    }
}
