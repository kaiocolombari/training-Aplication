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
    public DbSet<Avaliacao> Avaliacoes { get; set; }
    public DbSet<Perimetro> Perimetros { get; set; }
    public DbSet<DobraCutanea> DobrasCutaneas { get; set; }
    public DbSet<TesteCarga> TestesCarga { get; set; }
    public DbSet<CargaExercicio> CargasExercicios { get; set; }
    public DbSet<Treino> Treinos { get; set; }
    public DbSet<TreinoExercicio> TreinosExercicios { get; set; }
    public DbSet<Periodizacao> Periodizacoes { get; set; }
    public DbSet<PeriodizacaoSemana> PeriodizacaoSemanas { get; set; }
    public DbSet<PeriodizacaoDia> PeriodizacaoDias { get; set; }
    public DbSet<GrupoMuscular> GruposMusculares { get; set; }
    public DbSet<VolumeSemanal> VolumesSemanais { get; set; }


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

        modelBuilder.Entity<Avaliacao>()
            .HasOne(a => a.Aluno)
            .WithMany(a => a.Avaliacoes)
            .HasForeignKey(a => a.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DobraCutanea>()
            .HasOne(d => d.Avaliacao)
            .WithMany(a => a.DobrasCutaneas)
            .HasForeignKey(d => d.AvaliacaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Perimetro>()
            .HasOne(p => p.Avaliacao)
            .WithOne(a => a.Perimetro)
            .HasForeignKey<Perimetro>(p => p.AvaliacaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TesteCarga>()
            .HasOne(t => t.Aluno)
            .WithMany(a => a.TestesCarga)
            .HasForeignKey(t => t.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CargaExercicio>()
            .HasOne(c => c.TesteCarga)
            .WithMany(t => t.CargasExercicios)
            .HasForeignKey(c => c.TesteCargaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Treino>()
            .HasOne(t => t.Aluno)
            .WithMany(a => a.Treinos)
            .HasForeignKey(t => t.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TreinoExercicio>()
            .HasOne(te => te.Treino)
            .WithMany(t => t.TreinoExercicios)
            .HasForeignKey(te => te.TreinoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Periodizacao>()
            .HasOne(p => p.Aluno)
            .WithMany(a => a.Periodizacoes)
            .HasForeignKey(p => p.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PeriodizacaoSemana>()
            .HasOne(ps => ps.Periodizacao)
            .WithMany(p => p.PeriodizacaoSemanas)
            .HasForeignKey(ps => ps.PeriodizacaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PeriodizacaoDia>()
            .HasOne(pd => pd.Semana)
            .WithMany(ps => ps.PeriodizacaoDias)
            .HasForeignKey(pd => pd.SemanaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VolumeSemanal>()
            .HasOne(v => v.GrupoMuscular)
            .WithMany(g => g.VolumesSemanais)
            .HasForeignKey(v => v.GrupoMuscularId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GrupoMuscular>()
            .HasMany(g => g.VolumesSemanais)
            .WithOne(v => v.GrupoMuscular)
            .HasForeignKey(v => v.GrupoMuscularId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Usuario>()
            .Property(u => u.Tipo)
            .HasConversion<string>();

        modelBuilder.Entity<Usuario>()
            .ToTable("Usuarios", t =>
            {
                t.HasCheckConstraint(
                    "usuario_tipo_check",
                    "\"Tipo\" IN ('PERSONAL', 'ALUNO', 'ADMIN')"
                );
            });


    }
}