using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class DynamicAssessmentsAndAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Ativo",
                table: "Avaliacoes",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AtualizadaEm",
                table: "Avaliacoes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AtualizadaPorUsuarioId",
                table: "Avaliacoes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CriadaEm",
                table: "Avaliacoes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<Guid>(
                name: "CriadaPorUsuarioId",
                table: "Avaliacoes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Objetivo",
                table: "Avaliacoes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Observacoes",
                table: "Avaliacoes",
                type: "text",
                nullable: true);

            // Preserva o parecer que antes ficava separado em Anamnese inicial/reavaliação.
            migrationBuilder.Sql(@"
                UPDATE ""Avaliacoes"" AS a
                SET ""Objetivo"" = COALESCE(a.""Objetivo"", (
                        SELECT n.""Objetivo""
                        FROM ""Anamnese"" AS n
                        WHERE n.""AlunoId"" = a.""AlunoId""
                          AND ((a.""Numero"" = 1 AND lower(n.""Tipo"") LIKE '%inicial%')
                            OR (a.""Numero"" = 2 AND lower(n.""Tipo"") LIKE '%reavali%'))
                        ORDER BY n.""CriadoEm"" DESC
                        LIMIT 1)),
                    ""Observacoes"" = COALESCE(a.""Observacoes"", (
                        SELECT n.""Observacoes""
                        FROM ""Anamnese"" AS n
                        WHERE n.""AlunoId"" = a.""AlunoId""
                          AND ((a.""Numero"" = 1 AND lower(n.""Tipo"") LIKE '%inicial%')
                            OR (a.""Numero"" = 2 AND lower(n.""Tipo"") LIKE '%reavali%'))
                        ORDER BY n.""CriadoEm"" DESC
                        LIMIT 1))
                WHERE a.""Numero"" IN (1, 2);
            ");

            migrationBuilder.CreateTable(
                name: "AvaliacoesHistorico",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AvaliacaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    UsuarioEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    UsuarioTipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Acao = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Resumo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DadosJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvaliacoesHistorico", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvaliacoesHistorico_Avaliacoes_AvaliacaoId",
                        column: x => x.AvaliacaoId,
                        principalTable: "Avaliacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AvaliacoesHistorico_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avaliacoes_AtualizadaPorUsuarioId",
                table: "Avaliacoes",
                column: "AtualizadaPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Avaliacoes_CriadaPorUsuarioId",
                table: "Avaliacoes",
                column: "CriadaPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_AvaliacoesHistorico_AvaliacaoId_CriadoEm",
                table: "AvaliacoesHistorico",
                columns: new[] { "AvaliacaoId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_AvaliacoesHistorico_UsuarioId",
                table: "AvaliacoesHistorico",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Avaliacoes_Usuarios_AtualizadaPorUsuarioId",
                table: "Avaliacoes",
                column: "AtualizadaPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Avaliacoes_Usuarios_CriadaPorUsuarioId",
                table: "Avaliacoes",
                column: "CriadaPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Avaliacoes_Usuarios_AtualizadaPorUsuarioId",
                table: "Avaliacoes");

            migrationBuilder.DropForeignKey(
                name: "FK_Avaliacoes_Usuarios_CriadaPorUsuarioId",
                table: "Avaliacoes");

            migrationBuilder.DropTable(
                name: "AvaliacoesHistorico");

            migrationBuilder.DropIndex(
                name: "IX_Avaliacoes_AtualizadaPorUsuarioId",
                table: "Avaliacoes");

            migrationBuilder.DropIndex(
                name: "IX_Avaliacoes_CriadaPorUsuarioId",
                table: "Avaliacoes");

            migrationBuilder.DropColumn(
                name: "Ativo",
                table: "Avaliacoes");

            migrationBuilder.DropColumn(
                name: "AtualizadaEm",
                table: "Avaliacoes");

            migrationBuilder.DropColumn(
                name: "AtualizadaPorUsuarioId",
                table: "Avaliacoes");

            migrationBuilder.DropColumn(
                name: "CriadaEm",
                table: "Avaliacoes");

            migrationBuilder.DropColumn(
                name: "CriadaPorUsuarioId",
                table: "Avaliacoes");

            migrationBuilder.DropColumn(
                name: "Objetivo",
                table: "Avaliacoes");

            migrationBuilder.DropColumn(
                name: "Observacoes",
                table: "Avaliacoes");
        }
    }
}
