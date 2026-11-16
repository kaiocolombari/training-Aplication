using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class StudentOnboardingWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StatusCadastro",
                table: "Alunos",
                type: "text",
                nullable: false,
                defaultValue: "APROVADO");

            migrationBuilder.CreateTable(
                name: "SolicitacoesCadastro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    RespostasJson = table.Column<string>(type: "jsonb", nullable: false),
                    EnviadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitacoesCadastro", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SolicitacoesCadastro_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitacoesCadastro_AlunoId",
                table: "SolicitacoesCadastro",
                column: "AlunoId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SolicitacoesCadastro");

            migrationBuilder.DropColumn(
                name: "StatusCadastro",
                table: "Alunos");
        }
    }
}
