using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class VolumeSemanal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VolumesSemanais_PeriodizacaoSemanaId",
                table: "VolumesSemanais");

            migrationBuilder.CreateIndex(
                name: "IX_VolumesSemanais_PeriodizacaoSemanaId_GrupoMuscularId",
                table: "VolumesSemanais",
                columns: new[] { "PeriodizacaoSemanaId", "GrupoMuscularId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VolumesSemanais_PeriodizacaoSemanaId_GrupoMuscularId",
                table: "VolumesSemanais");

            migrationBuilder.CreateIndex(
                name: "IX_VolumesSemanais_PeriodizacaoSemanaId",
                table: "VolumesSemanais",
                column: "PeriodizacaoSemanaId");
        }
    }
}
