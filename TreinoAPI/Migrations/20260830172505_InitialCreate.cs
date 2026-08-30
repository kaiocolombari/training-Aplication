using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    SenhaHashed = table.Column<string>(type: "text", nullable: false),
                    Telefone = table.Column<string>(type: "text", nullable: true),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Alunos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeCompleto = table.Column<string>(type: "text", nullable: false),
                    Genero = table.Column<string>(type: "text", nullable: true),
                    DataNascimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Etnia = table.Column<string>(type: "text", nullable: true),
                    Massa = table.Column<decimal>(type: "numeric", nullable: true),
                    Estatura = table.Column<decimal>(type: "numeric", nullable: true),
                    Femur = table.Column<decimal>(type: "numeric", nullable: true),
                    Tibia = table.Column<decimal>(type: "numeric", nullable: true),
                    Una = table.Column<decimal>(type: "numeric", nullable: true),
                    Umero = table.Column<decimal>(type: "numeric", nullable: true),
                    FcRepouso = table.Column<int>(type: "integer", nullable: true),
                    FcReserva = table.Column<int>(type: "integer", nullable: true),
                    Glicose = table.Column<decimal>(type: "numeric", nullable: true),
                    Triglicerideos = table.Column<decimal>(type: "numeric", nullable: true),
                    Ldl = table.Column<decimal>(type: "numeric", nullable: true),
                    Hdl = table.Column<decimal>(type: "numeric", nullable: true),
                    Sistolica = table.Column<int>(type: "integer", nullable: true),
                    Diastolica = table.Column<int>(type: "integer", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alunos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Personais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Personais_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PersonalAlunos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonalId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonalAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PersonalAlunos_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PersonalAlunos_Personais_PersonalId",
                        column: x => x.PersonalId,
                        principalTable: "Personais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alunos_UsuarioId",
                table: "Alunos",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Personais_UsuarioId",
                table: "Personais",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PersonalAlunos_AlunoId",
                table: "PersonalAlunos",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonalAlunos_PersonalId_AlunoId",
                table: "PersonalAlunos",
                columns: new[] { "PersonalId", "AlunoId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PersonalAlunos");

            migrationBuilder.DropTable(
                name: "Alunos");

            migrationBuilder.DropTable(
                name: "Personais");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
