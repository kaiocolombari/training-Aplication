using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChatRealtimeAndTemporaryConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EntregueEm",
                table: "MensagensEquipe",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EhTemporaria",
                table: "ConversasEquipe",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiraEm",
                table: "ConversasEquipe",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UltimaAtividadeEm",
                table: "ConversasEquipe",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""ConversasEquipe"" AS conversa
                SET ""UltimaAtividadeEm"" = COALESCE((
                        SELECT MAX(mensagem.""EnviadaEm"") FROM ""MensagensEquipe"" AS mensagem
                        WHERE mensagem.""ConversaId"" = conversa.""Id""
                    ), conversa.""CriadaEm""),
                    ""EhTemporaria"" = (usuario_a.""Tipo"" = 2 AND usuario_b.""Tipo"" = 1)
                        OR (usuario_a.""Tipo"" = 1 AND usuario_b.""Tipo"" = 2),
                    ""ExpiraEm"" = CASE
                        WHEN (usuario_a.""Tipo"" = 2 AND usuario_b.""Tipo"" = 1)
                          OR (usuario_a.""Tipo"" = 1 AND usuario_b.""Tipo"" = 2)
                        THEN COALESCE((
                            SELECT MAX(mensagem.""EnviadaEm"") FROM ""MensagensEquipe"" AS mensagem
                            WHERE mensagem.""ConversaId"" = conversa.""Id""
                        ), conversa.""CriadaEm"") + INTERVAL '48 hours'
                        ELSE NULL
                    END
                FROM ""Usuarios"" AS usuario_a, ""Usuarios"" AS usuario_b
                WHERE usuario_a.""Id"" = conversa.""UsuarioAId""
                  AND usuario_b.""Id"" = conversa.""UsuarioBId"";
            ");

            migrationBuilder.CreateIndex(
                name: "IX_ConversasEquipe_ExpiraEm",
                table: "ConversasEquipe",
                column: "ExpiraEm");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ConversasEquipe_ExpiraEm",
                table: "ConversasEquipe");

            migrationBuilder.DropColumn(
                name: "EntregueEm",
                table: "MensagensEquipe");

            migrationBuilder.DropColumn(
                name: "EhTemporaria",
                table: "ConversasEquipe");

            migrationBuilder.DropColumn(
                name: "ExpiraEm",
                table: "ConversasEquipe");

            migrationBuilder.DropColumn(
                name: "UltimaAtividadeEm",
                table: "ConversasEquipe");
        }
    }
}
