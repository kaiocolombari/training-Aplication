using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AtualizarVolumeESuportarVariacoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Series",
                table: "VolumesSemanais",
                newName: "SeriesDiretas");

            migrationBuilder.AddColumn<int>(
                name: "SeriesLivres",
                table: "VolumesSemanais",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TreinoExercicioVariacoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TreinoExercicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Exercicio = table.Column<string>(type: "text", nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: true),
                    Series = table.Column<int>(type: "integer", nullable: true),
                    Repeticoes = table.Column<int>(type: "integer", nullable: true),
                    Intervalo = table.Column<int>(type: "integer", nullable: true),
                    Carga = table.Column<double>(type: "double precision", nullable: true),
                    RiRMAX = table.Column<int>(type: "integer", nullable: true),
                    Observacoes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreinoExercicioVariacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreinoExercicioVariacoes_TreinosExercicios_TreinoExercicioId",
                        column: x => x.TreinoExercicioId,
                        principalTable: "TreinosExercicios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TreinoExercicioVariacoes_TreinoExercicioId",
                table: "TreinoExercicioVariacoes",
                column: "TreinoExercicioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TreinoExercicioVariacoes");

            migrationBuilder.DropColumn(
                name: "SeriesLivres",
                table: "VolumesSemanais");

            migrationBuilder.RenameColumn(
                name: "SeriesDiretas",
                table: "VolumesSemanais",
                newName: "Series");
        }
    }
}
