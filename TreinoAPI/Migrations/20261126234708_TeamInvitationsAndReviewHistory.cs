using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class TeamInvitationsAndReviewHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AnalisadaEm",
                table: "SolicitacoesCadastro",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AvaliadorUsuarioId",
                table: "SolicitacoesCadastro",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacaoAnalise",
                table: "SolicitacoesCadastro",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StatusAnalise",
                table: "SolicitacoesCadastro",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "AGUARDANDO_ANALISE");

            migrationBuilder.AddColumn<Guid>(
                name: "ConvidadoPorPersonalId",
                table: "Alunos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConvitePersonalId",
                table: "Alunos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConvitesPersonais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonalId = table.Column<Guid>(type: "uuid", nullable: false),
                    CriadoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Apelido = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevogadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Utilizacoes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConvitesPersonais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConvitesPersonais_Personais_PersonalId",
                        column: x => x.PersonalId,
                        principalTable: "Personais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConvitesPersonais_Usuarios_CriadoPorUsuarioId",
                        column: x => x.CriadoPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // Preserva a origem legada somente quando há exatamente um vínculo ativo.
            // Quando existem vários vínculos antigos, não há informação confiável para inferir quem convidou.
            migrationBuilder.Sql("""
                UPDATE "Alunos" AS a
                SET "ConvidadoPorPersonalId" = (
                    SELECT MIN(pa."PersonalId"::text)::uuid
                    FROM "PersonalAlunos" AS pa
                    WHERE pa."AlunoId" = a."Id" AND pa."Ativo" = TRUE
                    HAVING COUNT(DISTINCT pa."PersonalId") = 1
                )
                WHERE EXISTS (
                    SELECT 1
                    FROM "PersonalAlunos" AS pa
                    WHERE pa."AlunoId" = a."Id" AND pa."Ativo" = TRUE
                    GROUP BY pa."AlunoId"
                    HAVING COUNT(DISTINCT pa."PersonalId") = 1
                );
                """);

            migrationBuilder.CreateIndex(
                name: "IX_SolicitacoesCadastro_AvaliadorUsuarioId",
                table: "SolicitacoesCadastro",
                column: "AvaliadorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Alunos_ConvidadoPorPersonalId",
                table: "Alunos",
                column: "ConvidadoPorPersonalId");

            migrationBuilder.CreateIndex(
                name: "IX_Alunos_ConvitePersonalId",
                table: "Alunos",
                column: "ConvitePersonalId");

            migrationBuilder.CreateIndex(
                name: "IX_ConvitesPersonais_CriadoPorUsuarioId",
                table: "ConvitesPersonais",
                column: "CriadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ConvitesPersonais_PersonalId_CriadoEm",
                table: "ConvitesPersonais",
                columns: new[] { "PersonalId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_ConvitesPersonais_TokenHash",
                table: "ConvitesPersonais",
                column: "TokenHash",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Alunos_ConvitesPersonais_ConvitePersonalId",
                table: "Alunos",
                column: "ConvitePersonalId",
                principalTable: "ConvitesPersonais",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Alunos_Personais_ConvidadoPorPersonalId",
                table: "Alunos",
                column: "ConvidadoPorPersonalId",
                principalTable: "Personais",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitacoesCadastro_Usuarios_AvaliadorUsuarioId",
                table: "SolicitacoesCadastro",
                column: "AvaliadorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alunos_ConvitesPersonais_ConvitePersonalId",
                table: "Alunos");

            migrationBuilder.DropForeignKey(
                name: "FK_Alunos_Personais_ConvidadoPorPersonalId",
                table: "Alunos");

            migrationBuilder.DropForeignKey(
                name: "FK_SolicitacoesCadastro_Usuarios_AvaliadorUsuarioId",
                table: "SolicitacoesCadastro");

            migrationBuilder.DropTable(
                name: "ConvitesPersonais");

            migrationBuilder.DropIndex(
                name: "IX_SolicitacoesCadastro_AvaliadorUsuarioId",
                table: "SolicitacoesCadastro");

            migrationBuilder.DropIndex(
                name: "IX_Alunos_ConvidadoPorPersonalId",
                table: "Alunos");

            migrationBuilder.DropIndex(
                name: "IX_Alunos_ConvitePersonalId",
                table: "Alunos");

            migrationBuilder.DropColumn(
                name: "AnalisadaEm",
                table: "SolicitacoesCadastro");

            migrationBuilder.DropColumn(
                name: "AvaliadorUsuarioId",
                table: "SolicitacoesCadastro");

            migrationBuilder.DropColumn(
                name: "ObservacaoAnalise",
                table: "SolicitacoesCadastro");

            migrationBuilder.DropColumn(
                name: "StatusAnalise",
                table: "SolicitacoesCadastro");

            migrationBuilder.DropColumn(
                name: "ConvidadoPorPersonalId",
                table: "Alunos");

            migrationBuilder.DropColumn(
                name: "ConvitePersonalId",
                table: "Alunos");
        }
    }
}
