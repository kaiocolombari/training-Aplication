using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class PerimetroseDobras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Avaliacoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<int>(type: "integer", nullable: false),
                    Peso = table.Column<double>(type: "double precision", nullable: true),
                    Altura = table.Column<double>(type: "double precision", nullable: true),
                    PerceltualGordura = table.Column<double>(type: "double precision", nullable: true),
                    RealizadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avaliacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Avaliacoes_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DobrasCutaneas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AvaliacaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Medida = table.Column<int>(type: "integer", nullable: false),
                    Triceps = table.Column<double>(type: "double precision", nullable: true),
                    Subescapular = table.Column<double>(type: "double precision", nullable: true),
                    Biceps = table.Column<double>(type: "double precision", nullable: true),
                    Iliaca = table.Column<double>(type: "double precision", nullable: true),
                    Supraespinhal = table.Column<double>(type: "double precision", nullable: true),
                    Abdominal = table.Column<double>(type: "double precision", nullable: true),
                    CoxaMedia = table.Column<double>(type: "double precision", nullable: true),
                    Panturrilha = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DobrasCutaneas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DobrasCutaneas_Avaliacoes_AvaliacaoId",
                        column: x => x.AvaliacaoId,
                        principalTable: "Avaliacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Perimetros",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AvaliacaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Braco_D = table.Column<double>(type: "double precision", nullable: true),
                    Braco_E = table.Column<double>(type: "double precision", nullable: true),
                    Antebraco_D = table.Column<double>(type: "double precision", nullable: true),
                    Antebraco_E = table.Column<double>(type: "double precision", nullable: true),
                    Torax = table.Column<double>(type: "double precision", nullable: true),
                    Cintura = table.Column<double>(type: "double precision", nullable: true),
                    Abdomen = table.Column<double>(type: "double precision", nullable: true),
                    Quadril = table.Column<double>(type: "double precision", nullable: true),
                    Coxa_Sup_D = table.Column<double>(type: "double precision", nullable: true),
                    Coxa_Sup_E = table.Column<double>(type: "double precision", nullable: true),
                    Coxa_Med_D = table.Column<double>(type: "double precision", nullable: true),
                    Coxa_Med_E = table.Column<double>(type: "double precision", nullable: true),
                    Panturrilha_D = table.Column<double>(type: "double precision", nullable: true),
                    Panturrilha_E = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Perimetros", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Perimetros_Avaliacoes_AvaliacaoId",
                        column: x => x.AvaliacaoId,
                        principalTable: "Avaliacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avaliacoes_AlunoId",
                table: "Avaliacoes",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_DobrasCutaneas_AvaliacaoId",
                table: "DobrasCutaneas",
                column: "AvaliacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Perimetros_AvaliacaoId",
                table: "Perimetros",
                column: "AvaliacaoId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DobrasCutaneas");

            migrationBuilder.DropTable(
                name: "Perimetros");

            migrationBuilder.DropTable(
                name: "Avaliacoes");
        }
    }
}
