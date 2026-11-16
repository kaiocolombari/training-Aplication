using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class TeamFileCenter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ArquivosEquipe",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    PrazoRetencao = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CriadoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AvisoExpiracaoEnviadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArquivosEquipe", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ArquivosEquipe_Usuarios_CriadoPorUsuarioId",
                        column: x => x.CriadoPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ArquivosEquipeAnexos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ArquivoEquipeId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeOriginal = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    NomeArmazenado = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TipoConteudo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    TamanhoBytes = table.Column<long>(type: "bigint", nullable: false),
                    EnviadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArquivosEquipeAnexos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ArquivosEquipeAnexos_ArquivosEquipe_ArquivoEquipeId",
                        column: x => x.ArquivoEquipeId,
                        principalTable: "ArquivosEquipe",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArquivosEquipe_CriadoPorUsuarioId",
                table: "ArquivosEquipe",
                column: "CriadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ArquivosEquipe_ExpiraEm",
                table: "ArquivosEquipe",
                column: "ExpiraEm");

            migrationBuilder.CreateIndex(
                name: "IX_ArquivosEquipeAnexos_ArquivoEquipeId_EnviadoEm",
                table: "ArquivosEquipeAnexos",
                columns: new[] { "ArquivoEquipeId", "EnviadoEm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArquivosEquipeAnexos");

            migrationBuilder.DropTable(
                name: "ArquivosEquipe");
        }
    }
}
