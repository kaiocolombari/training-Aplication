using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class StudentTrainingVolumeTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TreinoVolumeCiclos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TreinoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TreinoNomeSnapshot = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    ReferenciaSeries = table.Column<int>(type: "integer", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    ExerciciosSnapshotJson = table.Column<string>(type: "jsonb", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    EncerradoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreinoVolumeCiclos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreinoVolumeCiclos_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TreinoVolumeCiclos_Treinos_TreinoId",
                        column: x => x.TreinoId,
                        principalTable: "Treinos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TreinoVolumeCiclos_Usuarios_CriadoPorUsuarioId",
                        column: x => x.CriadoPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TreinoVolumeRegistrosMensais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CicloId = table.Column<Guid>(type: "uuid", nullable: false),
                    MesCiclo = table.Column<int>(type: "integer", nullable: false),
                    SeriesInformadas = table.Column<int>(type: "integer", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RegistradoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RegistradoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreinoVolumeRegistrosMensais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreinoVolumeRegistrosMensais_TreinoVolumeCiclos_CicloId",
                        column: x => x.CicloId,
                        principalTable: "TreinoVolumeCiclos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TreinoVolumeRegistrosMensais_Usuarios_RegistradoPorUsuarioId",
                        column: x => x.RegistradoPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TreinoVolumeCiclos_AlunoId",
                table: "TreinoVolumeCiclos",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_TreinoVolumeCiclos_CriadoPorUsuarioId",
                table: "TreinoVolumeCiclos",
                column: "CriadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_TreinoVolumeCiclos_TreinoId",
                table: "TreinoVolumeCiclos",
                column: "TreinoId",
                unique: true,
                filter: "\"EncerradoEm\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TreinoVolumeRegistrosMensais_CicloId_MesCiclo",
                table: "TreinoVolumeRegistrosMensais",
                columns: new[] { "CicloId", "MesCiclo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TreinoVolumeRegistrosMensais_RegistradoPorUsuarioId",
                table: "TreinoVolumeRegistrosMensais",
                column: "RegistradoPorUsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TreinoVolumeRegistrosMensais");

            migrationBuilder.DropTable(
                name: "TreinoVolumeCiclos");
        }
    }
}
