using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TreinoAPI.Data;

#nullable disable

namespace TreinoAPI.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261117080000_StatisticalAnalysisSnapshots")]
public partial class StatisticalAnalysisSnapshots : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "ControleAvancadoHabilitado",
            table: "ConfiguracoesAcompanhamento",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.CreateTable(
            name: "AnalisesEstatisticas",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                GeradoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                FerramentaId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                NomeFerramenta = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                PeriodoInicio = table.Column<DateOnly>(type: "date", nullable: true),
                PeriodoFim = table.Column<DateOnly>(type: "date", nullable: true),
                ParametrosJson = table.Column<string>(type: "jsonb", nullable: false),
                ResultadoJson = table.Column<string>(type: "jsonb", nullable: false),
                Resumo = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                QuantidadeRegistros = table.Column<int>(type: "integer", nullable: false),
                GeradoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AnalisesEstatisticas", x => x.Id);
                table.ForeignKey(
                    name: "FK_AnalisesEstatisticas_Alunos_AlunoId",
                    column: x => x.AlunoId,
                    principalTable: "Alunos",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_AnalisesEstatisticas_Usuarios_GeradoPorUsuarioId",
                    column: x => x.GeradoPorUsuarioId,
                    principalTable: "Usuarios",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AnalisesEstatisticas_AlunoId_GeradoEm",
            table: "AnalisesEstatisticas",
            columns: new[] { "AlunoId", "GeradoEm" });

        migrationBuilder.CreateIndex(
            name: "IX_AnalisesEstatisticas_GeradoPorUsuarioId",
            table: "AnalisesEstatisticas",
            column: "GeradoPorUsuarioId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AnalisesEstatisticas");
        migrationBuilder.DropColumn(name: "ControleAvancadoHabilitado", table: "ConfiguracoesAcompanhamento");
    }
}
