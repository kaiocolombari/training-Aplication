using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChatPushTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TokensPushUsuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Plataforma = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokensPushUsuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokensPushUsuarios_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TokensPushUsuarios_Token",
                table: "TokensPushUsuarios",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TokensPushUsuarios_UsuarioId",
                table: "TokensPushUsuarios",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TokensPushUsuarios");
        }
    }
}
