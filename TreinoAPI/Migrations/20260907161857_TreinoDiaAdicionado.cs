using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class TreinoDiaAdicionado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RiRMax",
                table: "TreinosExercicios",
                newName: "RiRMAX");

            migrationBuilder.AlterColumn<int>(
                name: "Ordem",
                table: "TreinosExercicios",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "DiaTreinos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DiaId = table.Column<Guid>(type: "uuid", nullable: false),
                    TreinoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiaTreinos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiaTreinos_PeriodizacaoDias_DiaId",
                        column: x => x.DiaId,
                        principalTable: "PeriodizacaoDias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiaTreinos_Treinos_TreinoId",
                        column: x => x.TreinoId,
                        principalTable: "Treinos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DiaTreinos_DiaId",
                table: "DiaTreinos",
                column: "DiaId");

            migrationBuilder.CreateIndex(
                name: "IX_DiaTreinos_TreinoId",
                table: "DiaTreinos",
                column: "TreinoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DiaTreinos");

            migrationBuilder.RenameColumn(
                name: "RiRMAX",
                table: "TreinosExercicios",
                newName: "RiRMax");

            migrationBuilder.AlterColumn<int>(
                name: "Ordem",
                table: "TreinosExercicios",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
