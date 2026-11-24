using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class MobileWorkoutSessionIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExecucoesTreino_TreinoId_Data",
                table: "ExecucoesTreino");

            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "ExecucoesTreino",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExecucoesTreino_SessionId",
                table: "ExecucoesTreino",
                column: "SessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExecucoesTreino_TreinoId_Data",
                table: "ExecucoesTreino",
                columns: new[] { "TreinoId", "Data" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExecucoesTreino_SessionId",
                table: "ExecucoesTreino");

            migrationBuilder.DropIndex(
                name: "IX_ExecucoesTreino_TreinoId_Data",
                table: "ExecucoesTreino");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "ExecucoesTreino");

            migrationBuilder.CreateIndex(
                name: "IX_ExecucoesTreino_TreinoId_Data",
                table: "ExecucoesTreino",
                columns: new[] { "TreinoId", "Data" },
                unique: true);
        }
    }
}
