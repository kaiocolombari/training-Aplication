using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AssessmentScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SolicitacoesAvaliacoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    SolicitanteUsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Origem = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataDesejada = table.Column<DateOnly>(type: "date", nullable: false),
                    DataAgendada = table.Column<DateOnly>(type: "date", nullable: true),
                    Motivo = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DescricaoAgendamento = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Urgente = table.Column<bool>(type: "boolean", nullable: false),
                    EnviadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CriadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AnalisadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnalisadaPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitacoesAvaliacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SolicitacoesAvaliacoes_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SolicitacoesAvaliacoes_Usuarios_AnalisadaPorUsuarioId",
                        column: x => x.AnalisadaPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SolicitacoesAvaliacoes_Usuarios_SolicitanteUsuarioId",
                        column: x => x.SolicitanteUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitacoesAvaliacoes_AlunoId_DataAgendada",
                table: "SolicitacoesAvaliacoes",
                columns: new[] { "AlunoId", "DataAgendada" });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitacoesAvaliacoes_AlunoId_Status_Urgente_DataDesejada",
                table: "SolicitacoesAvaliacoes",
                columns: new[] { "AlunoId", "Status", "Urgente", "DataDesejada" });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitacoesAvaliacoes_AnalisadaPorUsuarioId",
                table: "SolicitacoesAvaliacoes",
                column: "AnalisadaPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitacoesAvaliacoes_SolicitanteUsuarioId",
                table: "SolicitacoesAvaliacoes",
                column: "SolicitanteUsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SolicitacoesAvaliacoes");
        }
    }
}
