using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TreinoAPI.Migrations
{
    /// <inheritdoc />
    public partial class CorrigirNomeTabelaUsuarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alunos_usuarios_UsuarioId",
                table: "Alunos");

            migrationBuilder.DropForeignKey(
                name: "FK_Personais_usuarios_UsuarioId",
                table: "Personais");

            migrationBuilder.DropPrimaryKey(
                name: "PK_usuarios",
                table: "usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "usuario_tipo_check",
                table: "usuarios");

            migrationBuilder.RenameTable(
                name: "usuarios",
                newName: "Usuarios");

            migrationBuilder.RenameColumn(
                name: "tipo",
                table: "Usuarios",
                newName: "Tipo");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Usuarios",
                table: "Usuarios",
                column: "Id");

            migrationBuilder.AddCheckConstraint(
                name: "usuario_tipo_check",
                table: "Usuarios",
                sql: "\"Tipo\" IN ('PERSONAL', 'ALUNO', 'ADMIN')");

            migrationBuilder.AddForeignKey(
                name: "FK_Alunos_Usuarios_UsuarioId",
                table: "Alunos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Personais_Usuarios_UsuarioId",
                table: "Personais",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alunos_Usuarios_UsuarioId",
                table: "Alunos");

            migrationBuilder.DropForeignKey(
                name: "FK_Personais_Usuarios_UsuarioId",
                table: "Personais");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Usuarios",
                table: "Usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "usuario_tipo_check",
                table: "Usuarios");

            migrationBuilder.RenameTable(
                name: "Usuarios",
                newName: "usuarios");

            migrationBuilder.RenameColumn(
                name: "Tipo",
                table: "usuarios",
                newName: "tipo");

            migrationBuilder.AddPrimaryKey(
                name: "PK_usuarios",
                table: "usuarios",
                column: "Id");

            migrationBuilder.AddCheckConstraint(
                name: "usuario_tipo_check",
                table: "usuarios",
                sql: "tipo IN ('PERSONAL', 'ALUNO', 'ADMIN')");

            migrationBuilder.AddForeignKey(
                name: "FK_Alunos_usuarios_UsuarioId",
                table: "Alunos",
                column: "UsuarioId",
                principalTable: "usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Personais_usuarios_UsuarioId",
                table: "Personais",
                column: "UsuarioId",
                principalTable: "usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
