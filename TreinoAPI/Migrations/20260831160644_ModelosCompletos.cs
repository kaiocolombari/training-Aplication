using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class ModelosCompletos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GruposMusculares",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GruposMusculares", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Periodizacoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: true),
                    DataInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Periodizacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Periodizacoes_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestesCarga",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<int>(type: "integer", nullable: false),
                    RealizadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestesCarga", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestesCarga_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Treinos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Treinos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Treinos_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PeriodizacaoSemanas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodizacaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeriodizacaoSemanas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PeriodizacaoSemanas_Periodizacoes_PeriodizacaoId",
                        column: x => x.PeriodizacaoId,
                        principalTable: "Periodizacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CargasExercicios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TesteCargaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Exercicio = table.Column<string>(type: "text", nullable: false),
                    Carga = table.Column<double>(type: "double precision", nullable: true),
                    Repeticoes = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CargasExercicios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CargasExercicios_TestesCarga_TesteCargaId",
                        column: x => x.TesteCargaId,
                        principalTable: "TestesCarga",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TreinosExercicios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TreinoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Exercicio = table.Column<string>(type: "text", nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    Series = table.Column<int>(type: "integer", nullable: true),
                    Repeticoes = table.Column<int>(type: "integer", nullable: true),
                    Intervalo = table.Column<int>(type: "integer", nullable: true),
                    Carga = table.Column<double>(type: "double precision", nullable: true),
                    RiRMax = table.Column<int>(type: "integer", nullable: true),
                    Observacoes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreinosExercicios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreinosExercicios_Treinos_TreinoId",
                        column: x => x.TreinoId,
                        principalTable: "Treinos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PeriodizacaoDias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SemanaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DiaSemana = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeriodizacaoDias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PeriodizacaoDias_PeriodizacaoSemanas_SemanaId",
                        column: x => x.SemanaId,
                        principalTable: "PeriodizacaoSemanas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VolumesSemanais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodizacaoSemanaId = table.Column<Guid>(type: "uuid", nullable: false),
                    GrupoMuscularId = table.Column<Guid>(type: "uuid", nullable: false),
                    Series = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VolumesSemanais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VolumesSemanais_GruposMusculares_GrupoMuscularId",
                        column: x => x.GrupoMuscularId,
                        principalTable: "GruposMusculares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VolumesSemanais_PeriodizacaoSemanas_PeriodizacaoSemanaId",
                        column: x => x.PeriodizacaoSemanaId,
                        principalTable: "PeriodizacaoSemanas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CargasExercicios_TesteCargaId",
                table: "CargasExercicios",
                column: "TesteCargaId");

            migrationBuilder.CreateIndex(
                name: "IX_PeriodizacaoDias_SemanaId",
                table: "PeriodizacaoDias",
                column: "SemanaId");

            migrationBuilder.CreateIndex(
                name: "IX_PeriodizacaoSemanas_PeriodizacaoId",
                table: "PeriodizacaoSemanas",
                column: "PeriodizacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Periodizacoes_AlunoId",
                table: "Periodizacoes",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_TestesCarga_AlunoId",
                table: "TestesCarga",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_Treinos_AlunoId",
                table: "Treinos",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_TreinosExercicios_TreinoId",
                table: "TreinosExercicios",
                column: "TreinoId");

            migrationBuilder.CreateIndex(
                name: "IX_VolumesSemanais_GrupoMuscularId",
                table: "VolumesSemanais",
                column: "GrupoMuscularId");

            migrationBuilder.CreateIndex(
                name: "IX_VolumesSemanais_PeriodizacaoSemanaId",
                table: "VolumesSemanais",
                column: "PeriodizacaoSemanaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CargasExercicios");

            migrationBuilder.DropTable(
                name: "PeriodizacaoDias");

            migrationBuilder.DropTable(
                name: "TreinosExercicios");

            migrationBuilder.DropTable(
                name: "VolumesSemanais");

            migrationBuilder.DropTable(
                name: "TestesCarga");

            migrationBuilder.DropTable(
                name: "Treinos");

            migrationBuilder.DropTable(
                name: "GruposMusculares");

            migrationBuilder.DropTable(
                name: "PeriodizacaoSemanas");

            migrationBuilder.DropTable(
                name: "Periodizacoes");
        }
    }
}
