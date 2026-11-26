using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class PersonalExecutionReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RevisadaEm",
                table: "ExecucoesTreino",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RevisadaPorUsuarioId",
                table: "ExecucoesTreino",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"ExecucoesTreino\" SET \"RevisadaEm\" = \"Fim\" WHERE \"Fim\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RevisadaEm",
                table: "ExecucoesTreino");

            migrationBuilder.DropColumn(
                name: "RevisadaPorUsuarioId",
                table: "ExecucoesTreino");
        }
    }
}
