using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class ExerciseCatalogAndVideos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ExercicioCatalogoId",
                table: "TreinosExercicios",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ExerciciosCatalogo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    NomeNormalizado = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    GrupoMuscular = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Equipamento = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Dificuldade = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Descricao = table.Column<string>(type: "text", nullable: true),
                    Instrucoes = table.Column<string>(type: "text", nullable: true),
                    CodigoFonte = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    FonteDados = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    LicencaDados = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExerciciosCatalogo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExerciciosSinonimos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExercicioCatalogoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    NomeNormalizado = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Origem = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExerciciosSinonimos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExerciciosSinonimos_ExerciciosCatalogo_ExercicioCatalogoId",
                        column: x => x.ExercicioCatalogoId,
                        principalTable: "ExerciciosCatalogo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VideosExercicios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExercicioCatalogoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    UrlExterna = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    ChaveArmazenamento = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    TipoConteudo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Origem = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Licenca = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Fonte = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DuracaoSegundos = table.Column<double>(type: "double precision", nullable: true),
                    Principal = table.Column<bool>(type: "boolean", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideosExercicios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideosExercicios_ExerciciosCatalogo_ExercicioCatalogoId",
                        column: x => x.ExercicioCatalogoId,
                        principalTable: "ExerciciosCatalogo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TreinosExercicios_ExercicioCatalogoId",
                table: "TreinosExercicios",
                column: "ExercicioCatalogoId");

            migrationBuilder.CreateIndex(
                name: "IX_ExerciciosCatalogo_CodigoFonte",
                table: "ExerciciosCatalogo",
                column: "CodigoFonte",
                unique: true,
                filter: "\"CodigoFonte\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ExerciciosCatalogo_NomeNormalizado",
                table: "ExerciciosCatalogo",
                column: "NomeNormalizado");

            migrationBuilder.CreateIndex(
                name: "IX_ExerciciosSinonimos_ExercicioCatalogoId_NomeNormalizado",
                table: "ExerciciosSinonimos",
                columns: new[] { "ExercicioCatalogoId", "NomeNormalizado" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideosExercicios_ExercicioCatalogoId_Ativo_Principal",
                table: "VideosExercicios",
                columns: new[] { "ExercicioCatalogoId", "Ativo", "Principal" });

            migrationBuilder.AddForeignKey(
                name: "FK_TreinosExercicios_ExerciciosCatalogo_ExercicioCatalogoId",
                table: "TreinosExercicios",
                column: "ExercicioCatalogoId",
                principalTable: "ExerciciosCatalogo",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TreinosExercicios_ExerciciosCatalogo_ExercicioCatalogoId",
                table: "TreinosExercicios");

            migrationBuilder.DropTable(
                name: "ExerciciosSinonimos");

            migrationBuilder.DropTable(
                name: "VideosExercicios");

            migrationBuilder.DropTable(
                name: "ExerciciosCatalogo");

            migrationBuilder.DropIndex(
                name: "IX_TreinosExercicios_ExercicioCatalogoId",
                table: "TreinosExercicios");

            migrationBuilder.DropColumn(
                name: "ExercicioCatalogoId",
                table: "TreinosExercicios");
        }
    }
}
