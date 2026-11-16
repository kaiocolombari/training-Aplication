using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class TeamCommunicationCenter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AvisosGlobais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AutorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    Conteudo = table.Column<string>(type: "text", nullable: false),
                    PublicadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvisosGlobais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvisosGlobais_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConversasEquipe",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioAId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioBId = table.Column<Guid>(type: "uuid", nullable: false),
                    CriadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversasEquipe", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConversasEquipe_Usuarios_UsuarioAId",
                        column: x => x.UsuarioAId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConversasEquipe_Usuarios_UsuarioBId",
                        column: x => x.UsuarioBId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NotificacoesUsuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    Mensagem = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    ReferenciaId = table.Column<Guid>(type: "uuid", nullable: true),
                    CriadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LidaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificacoesUsuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificacoesUsuarios_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MensagensEquipe",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversaId = table.Column<Guid>(type: "uuid", nullable: false),
                    RemetenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    Conteudo = table.Column<string>(type: "text", nullable: false),
                    EnviadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LidaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensagensEquipe", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MensagensEquipe_ConversasEquipe_ConversaId",
                        column: x => x.ConversaId,
                        principalTable: "ConversasEquipe",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MensagensEquipe_Usuarios_RemetenteId",
                        column: x => x.RemetenteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvisosGlobais_AutorId",
                table: "AvisosGlobais",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_ConversasEquipe_UsuarioAId_UsuarioBId",
                table: "ConversasEquipe",
                columns: new[] { "UsuarioAId", "UsuarioBId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConversasEquipe_UsuarioBId",
                table: "ConversasEquipe",
                column: "UsuarioBId");

            migrationBuilder.CreateIndex(
                name: "IX_MensagensEquipe_ConversaId_EnviadaEm",
                table: "MensagensEquipe",
                columns: new[] { "ConversaId", "EnviadaEm" });

            migrationBuilder.CreateIndex(
                name: "IX_MensagensEquipe_RemetenteId",
                table: "MensagensEquipe",
                column: "RemetenteId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificacoesUsuarios_UsuarioId_LidaEm_CriadaEm",
                table: "NotificacoesUsuarios",
                columns: new[] { "UsuarioId", "LidaEm", "CriadaEm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvisosGlobais");

            migrationBuilder.DropTable(
                name: "MensagensEquipe");

            migrationBuilder.DropTable(
                name: "NotificacoesUsuarios");

            migrationBuilder.DropTable(
                name: "ConversasEquipe");
        }
    }
}
