using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChatMessageAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MensagensAnexos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MensagemId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeOriginal = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    NomeArmazenado = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TipoConteudo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TamanhoBytes = table.Column<long>(type: "bigint", nullable: false),
                    VerificadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VerificadoPor = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensagensAnexos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MensagensAnexos_MensagensEquipe_MensagemId",
                        column: x => x.MensagemId,
                        principalTable: "MensagensEquipe",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MensagensAnexos_MensagemId",
                table: "MensagensAnexos",
                column: "MensagemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensagensAnexos");
        }
    }
}
