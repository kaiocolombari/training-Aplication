using Microsoft.EntityFrameworkCore;
using TreinoAPI.Model;

namespace TreinoAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Aluno> Alunos { get; set; }
    public DbSet<Personal> Personais { get; set; }
    public DbSet<PersonalAluno> PersonalAlunos { get; set; }
    public DbSet<Anamnese> Anamnese { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Personal>()
        .HasOne(p => p.Usuario)
        .WithOne(u => u.Personal)
        .HasForeignKey<Personal>(p => p.UsuarioId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Aluno>()
            .HasOne(a => a.Usuario)
            .WithOne(u => u.Aluno)
            .HasForeignKey<Aluno>(a => a.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PersonalAluno>()
            .HasOne(pa => pa.Personal)
            .WithMany(p => p.Alunos)
            .HasForeignKey(pa => pa.PersonalId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PersonalAluno>()
            .HasOne(pa => pa.Aluno)
            .WithMany(a => a.Personais)
            .HasForeignKey(pa => pa.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PersonalAluno>()
            .HasIndex(pa => new
            {
                pa.PersonalId,
                pa.AlunoId
            })
            .IsUnique();
            
        modelBuilder.Entity<Anamnese>()
            .HasOne(a => a.Aluno)
            .WithMany(a => a.Anamneses)
            .HasForeignKey(a => a.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}