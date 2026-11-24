using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations;

public partial class MobileWorkoutSessionMetrics : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "DuracaoEsperadaMinutos",
            table: "ExecucoesTreino",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "DuracaoPlanejadaCardioSegundos",
            table: "ExecucoesTreino",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "DuracaoRealCardioSegundos",
            table: "ExecucoesTreino",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "DuracaoSegundos",
            table: "ExecucoesTreino",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "Fim",
            table: "ExecucoesTreino",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "Inicio",
            table: "ExecucoesTreino",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "TipoTreino",
            table: "ExecucoesTreino",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "strength");

        migrationBuilder.AddColumn<bool>(
            name: "Concluida",
            table: "ExecucoesSerie",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "DescansoPrescrito",
            table: "ExecucoesSerie",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "UsouPrescricao",
            table: "ExecucoesSerie",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "Feedback",
            table: "ExecucoesExercicio",
            type: "character varying(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Musculo",
            table: "ExecucoesExercicio",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "Ordem",
            table: "ExecucoesExercicio",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "StatusDor",
            table: "ExecucoesExercicio",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "none");

        migrationBuilder.AddColumn<Guid>(
            name: "VariacaoId",
            table: "ExecucoesExercicio",
            type: "uuid",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("DuracaoEsperadaMinutos", "ExecucoesTreino");
        migrationBuilder.DropColumn("DuracaoPlanejadaCardioSegundos", "ExecucoesTreino");
        migrationBuilder.DropColumn("DuracaoRealCardioSegundos", "ExecucoesTreino");
        migrationBuilder.DropColumn("DuracaoSegundos", "ExecucoesTreino");
        migrationBuilder.DropColumn("Fim", "ExecucoesTreino");
        migrationBuilder.DropColumn("Inicio", "ExecucoesTreino");
        migrationBuilder.DropColumn("TipoTreino", "ExecucoesTreino");
        migrationBuilder.DropColumn("Concluida", "ExecucoesSerie");
        migrationBuilder.DropColumn("DescansoPrescrito", "ExecucoesSerie");
        migrationBuilder.DropColumn("UsouPrescricao", "ExecucoesSerie");
        migrationBuilder.DropColumn("Feedback", "ExecucoesExercicio");
        migrationBuilder.DropColumn("Musculo", "ExecucoesExercicio");
        migrationBuilder.DropColumn("Ordem", "ExecucoesExercicio");
        migrationBuilder.DropColumn("StatusDor", "ExecucoesExercicio");
        migrationBuilder.DropColumn("VariacaoId", "ExecucoesExercicio");
    }
}
