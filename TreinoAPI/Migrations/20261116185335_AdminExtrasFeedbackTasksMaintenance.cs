using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdminExtrasFeedbackTasksMaintenance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConfiguracoesAcompanhamento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonalId = table.Column<Guid>(type: "uuid", nullable: false),
                    IntervaloReavaliacaoDias = table.Column<int>(type: "integer", nullable: false),
                    IntervaloRevisaoTreinoDias = table.Column<int>(type: "integer", nullable: false),
                    AntecedenciaSugestaoDias = table.Column<int>(type: "integer", nullable: false),
                    AtualizadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracoesAcompanhamento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConfiguracoesAcompanhamento_Personais_PersonalId",
                        column: x => x.PersonalId,
                        principalTable: "Personais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FeedbacksAlunos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonalId = table.Column<Guid>(type: "uuid", nullable: true),
                    Categoria = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nota = table.Column<int>(type: "integer", nullable: false),
                    Comentario = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RespostaEquipe = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbacksAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbacksAlunos_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeedbacksAlunos_Personais_PersonalId",
                        column: x => x.PersonalId,
                        principalTable: "Personais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RegistrosManutencao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CriadoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResponsavelUsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    Titulo = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    Categoria = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Prioridade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Resolucao = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvidoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegistrosManutencao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RegistrosManutencao_Usuarios_CriadoPorUsuarioId",
                        column: x => x.CriadoPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RegistrosManutencao_Usuarios_ResponsavelUsuarioId",
                        column: x => x.ResponsavelUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TarefasPersonais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonalId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlunoId = table.Column<Guid>(type: "uuid", nullable: true),
                    CriadoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    DicaContexto = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    Categoria = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Prioridade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataLimite = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CriadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcluidaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarefasPersonais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarefasPersonais_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TarefasPersonais_Personais_PersonalId",
                        column: x => x.PersonalId,
                        principalTable: "Personais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TarefasPersonais_Usuarios_CriadoPorUsuarioId",
                        column: x => x.CriadoPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracoesAcompanhamento_PersonalId",
                table: "ConfiguracoesAcompanhamento",
                column: "PersonalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeedbacksAlunos_AlunoId_CriadoEm",
                table: "FeedbacksAlunos",
                columns: new[] { "AlunoId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_FeedbacksAlunos_PersonalId_CriadoEm",
                table: "FeedbacksAlunos",
                columns: new[] { "PersonalId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosManutencao_CriadoPorUsuarioId",
                table: "RegistrosManutencao",
                column: "CriadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosManutencao_ResponsavelUsuarioId",
                table: "RegistrosManutencao",
                column: "ResponsavelUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosManutencao_Status_CriadoEm",
                table: "RegistrosManutencao",
                columns: new[] { "Status", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_TarefasPersonais_AlunoId",
                table: "TarefasPersonais",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_TarefasPersonais_CriadoPorUsuarioId",
                table: "TarefasPersonais",
                column: "CriadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_TarefasPersonais_PersonalId_Status_DataLimite",
                table: "TarefasPersonais",
                columns: new[] { "PersonalId", "Status", "DataLimite" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfiguracoesAcompanhamento");

            migrationBuilder.DropTable(
                name: "FeedbacksAlunos");

            migrationBuilder.DropTable(
                name: "RegistrosManutencao");

            migrationBuilder.DropTable(
                name: "TarefasPersonais");
        }
    }
}
