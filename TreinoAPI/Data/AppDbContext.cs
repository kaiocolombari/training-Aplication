using Microsoft.EntityFrameworkCore;
using TreinoAPI.Model;

namespace TreinoAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<ExecucaoTreino> ExecucoesTreino { get; set; }
    public DbSet<AnaliseEstatistica> AnalisesEstatisticas { get; set; }
    public DbSet<ExecucaoExercicio> ExecucoesExercicio { get; set; }
    public DbSet<ExecucaoSerie> ExecucoesSerie { get; set; }
    public DbSet<TreinoVolumeCiclo> TreinoVolumeCiclos { get; set; }
    public DbSet<TreinoVolumeRegistroMensal> TreinoVolumeRegistrosMensais { get; set; }
    public DbSet<Aluno> Alunos { get; set; }
    public DbSet<SolicitacaoCadastro> SolicitacoesCadastro { get; set; }
    public DbSet<ConversaEquipe> ConversasEquipe { get; set; }
    public DbSet<MensagemEquipe> MensagensEquipe { get; set; }
    public DbSet<MensagemAnexo> MensagensAnexos { get; set; }
    public DbSet<NotificacaoUsuario> NotificacoesUsuarios { get; set; }
    public DbSet<TokenPushUsuario> TokensPushUsuarios { get; set; }
    public DbSet<AvisoGlobal> AvisosGlobais { get; set; }
    public DbSet<ArquivoEquipe> ArquivosEquipe { get; set; }
    public DbSet<ArquivoEquipeAnexo> ArquivosEquipeAnexos { get; set; }
    public DbSet<FeedbackAluno> FeedbacksAlunos { get; set; }
    public DbSet<TarefaPersonal> TarefasPersonais { get; set; }
    public DbSet<ConfiguracaoAcompanhamentoPersonal> ConfiguracoesAcompanhamento { get; set; }
    public DbSet<RegistroManutencao> RegistrosManutencao { get; set; }
    public DbSet<RegistroAuditoria> RegistrosAuditoria { get; set; }
    public DbSet<Personal> Personais { get; set; }
    public DbSet<PersonalAluno> PersonalAlunos { get; set; }
    public DbSet<Anamnese> Anamnese { get; set; }
    public DbSet<Avaliacao> Avaliacoes { get; set; }
    public DbSet<AvaliacaoHistorico> AvaliacoesHistorico { get; set; }
    public DbSet<SolicitacaoAvaliacao> SolicitacoesAvaliacoes { get; set; }
    public DbSet<Perimetro> Perimetros { get; set; }
    public DbSet<DobraCutanea> DobrasCutaneas { get; set; }
    public DbSet<TesteCarga> TestesCarga { get; set; }
    public DbSet<CargaExercicio> CargasExercicios { get; set; }
    public DbSet<Treino> Treinos { get; set; }
    public DbSet<TreinoExercicio> TreinosExercicios { get; set; }
    public DbSet<TreinoExercicioVariacao> TreinoExercicioVariacoes { get; set; }
    public DbSet<DiaTreino> DiaTreinos { get; set; }
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

        modelBuilder.Entity<Aluno>()
            .Property(a => a.StatusCadastro)
            .HasConversion<string>()
            .HasDefaultValue(StatusCadastroAluno.APROVADO);

        modelBuilder.Entity<SolicitacaoCadastro>()
            .HasOne(s => s.Aluno)
            .WithOne(a => a.SolicitacaoCadastro)
            .HasForeignKey<SolicitacaoCadastro>(s => s.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SolicitacaoCadastro>()
            .Property(s => s.RespostasJson)
            .HasColumnType("jsonb");

        modelBuilder.Entity<ConversaEquipe>()
            .HasIndex(c => new { c.UsuarioAId, c.UsuarioBId })
            .IsUnique();

        modelBuilder.Entity<ConversaEquipe>()
            .HasIndex(c => c.ExpiraEm);

        modelBuilder.Entity<ConversaEquipe>()
            .HasOne(c => c.UsuarioA)
            .WithMany()
            .HasForeignKey(c => c.UsuarioAId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ConversaEquipe>()
            .HasOne(c => c.UsuarioB)
            .WithMany()
            .HasForeignKey(c => c.UsuarioBId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MensagemEquipe>()
            .HasOne(m => m.Conversa)
            .WithMany(c => c.Mensagens)
            .HasForeignKey(m => m.ConversaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MensagemEquipe>()
            .HasOne(m => m.Remetente)
            .WithMany()
            .HasForeignKey(m => m.RemetenteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MensagemEquipe>()
            .HasIndex(m => new { m.ConversaId, m.EnviadaEm });

        modelBuilder.Entity<MensagemAnexo>()
            .Property(a => a.NomeOriginal).HasMaxLength(255);
        modelBuilder.Entity<MensagemAnexo>()
            .Property(a => a.NomeArmazenado).HasMaxLength(32);
        modelBuilder.Entity<MensagemAnexo>()
            .Property(a => a.TipoConteudo).HasMaxLength(100);
        modelBuilder.Entity<MensagemAnexo>()
            .Property(a => a.VerificadoPor).HasMaxLength(100);
        modelBuilder.Entity<MensagemAnexo>()
            .HasOne(a => a.Mensagem).WithMany(m => m.Anexos)
            .HasForeignKey(a => a.MensagemId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<MensagemAnexo>()
            .HasIndex(a => a.MensagemId);

        modelBuilder.Entity<NotificacaoUsuario>()
            .HasOne(n => n.Usuario)
            .WithMany()
            .HasForeignKey(n => n.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NotificacaoUsuario>()
            .HasIndex(n => new { n.UsuarioId, n.LidaEm, n.CriadaEm });

        modelBuilder.Entity<TokenPushUsuario>()
            .Property(t => t.Token).HasMaxLength(255);
        modelBuilder.Entity<TokenPushUsuario>()
            .Property(t => t.Plataforma).HasMaxLength(20);
        modelBuilder.Entity<TokenPushUsuario>()
            .HasIndex(t => t.Token).IsUnique();
        modelBuilder.Entity<TokenPushUsuario>()
            .HasOne(t => t.Usuario).WithMany().HasForeignKey(t => t.UsuarioId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ArquivoEquipe>()
            .Property(a => a.Nome).HasMaxLength(120);
        modelBuilder.Entity<ArquivoEquipe>()
            .Property(a => a.Descricao).HasMaxLength(2000);
        modelBuilder.Entity<ArquivoEquipe>()
            .Property(a => a.PrazoRetencao).HasMaxLength(10);
        modelBuilder.Entity<ArquivoEquipe>()
            .HasIndex(a => a.ExpiraEm);
        modelBuilder.Entity<ArquivoEquipe>()
            .HasOne(a => a.CriadoPorUsuario)
            .WithMany()
            .HasForeignKey(a => a.CriadoPorUsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ArquivoEquipeAnexo>()
            .Property(a => a.NomeOriginal).HasMaxLength(255);
        modelBuilder.Entity<ArquivoEquipeAnexo>()
            .Property(a => a.NomeArmazenado).HasMaxLength(32);
        modelBuilder.Entity<ArquivoEquipeAnexo>()
            .Property(a => a.TipoConteudo).HasMaxLength(255);
        modelBuilder.Entity<ArquivoEquipeAnexo>()
            .HasOne(a => a.ArquivoEquipe)
            .WithMany(a => a.Arquivos)
            .HasForeignKey(a => a.ArquivoEquipeId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ArquivoEquipeAnexo>()
            .HasIndex(a => new { a.ArquivoEquipeId, a.EnviadoEm });

        modelBuilder.Entity<FeedbackAluno>()
            .Property(f => f.Categoria).HasMaxLength(30);
        modelBuilder.Entity<FeedbackAluno>()
            .Property(f => f.Status).HasMaxLength(20);
        modelBuilder.Entity<FeedbackAluno>()
            .Property(f => f.Comentario).HasMaxLength(2000);
        modelBuilder.Entity<FeedbackAluno>()
            .Property(f => f.RespostaEquipe).HasMaxLength(2000);
        modelBuilder.Entity<FeedbackAluno>()
            .HasOne(f => f.Aluno).WithMany().HasForeignKey(f => f.AlunoId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<FeedbackAluno>()
            .HasOne(f => f.Personal).WithMany().HasForeignKey(f => f.PersonalId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<FeedbackAluno>()
            .HasIndex(f => new { f.PersonalId, f.CriadoEm });
        modelBuilder.Entity<FeedbackAluno>()
            .HasIndex(f => new { f.AlunoId, f.CriadoEm });

        modelBuilder.Entity<TarefaPersonal>()
            .Property(t => t.Titulo).HasMaxLength(140);
        modelBuilder.Entity<TarefaPersonal>()
            .Property(t => t.Descricao).HasMaxLength(3000);
        modelBuilder.Entity<TarefaPersonal>()
            .Property(t => t.DicaContexto).HasMaxLength(1500);
        modelBuilder.Entity<TarefaPersonal>()
            .Property(t => t.Categoria).HasMaxLength(30);
        modelBuilder.Entity<TarefaPersonal>()
            .Property(t => t.Prioridade).HasMaxLength(20);
        modelBuilder.Entity<TarefaPersonal>()
            .Property(t => t.Status).HasMaxLength(20);
        modelBuilder.Entity<TarefaPersonal>()
            .HasOne(t => t.Personal).WithMany().HasForeignKey(t => t.PersonalId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TarefaPersonal>()
            .HasOne(t => t.Aluno).WithMany().HasForeignKey(t => t.AlunoId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<TarefaPersonal>()
            .HasOne(t => t.CriadoPorUsuario).WithMany().HasForeignKey(t => t.CriadoPorUsuarioId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TarefaPersonal>()
            .HasIndex(t => new { t.PersonalId, t.Status, t.DataLimite });

        modelBuilder.Entity<ConfiguracaoAcompanhamentoPersonal>()
            .HasOne(c => c.Personal).WithMany().HasForeignKey(c => c.PersonalId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ConfiguracaoAcompanhamentoPersonal>()
            .HasIndex(c => c.PersonalId).IsUnique();

        modelBuilder.Entity<RegistroManutencao>()
            .Property(m => m.Titulo).HasMaxLength(140);
        modelBuilder.Entity<RegistroManutencao>()
            .Property(m => m.Descricao).HasMaxLength(3000);
        modelBuilder.Entity<RegistroManutencao>()
            .Property(m => m.Categoria).HasMaxLength(30);
        modelBuilder.Entity<RegistroManutencao>()
            .Property(m => m.Prioridade).HasMaxLength(20);
        modelBuilder.Entity<RegistroManutencao>()
            .Property(m => m.Status).HasMaxLength(20);
        modelBuilder.Entity<RegistroManutencao>()
            .Property(m => m.Resolucao).HasMaxLength(3000);
        modelBuilder.Entity<RegistroManutencao>()
            .HasOne(m => m.CriadoPorUsuario).WithMany().HasForeignKey(m => m.CriadoPorUsuarioId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RegistroManutencao>()
            .HasOne(m => m.ResponsavelUsuario).WithMany().HasForeignKey(m => m.ResponsavelUsuarioId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<RegistroManutencao>()
            .HasIndex(m => new { m.Status, m.CriadoEm });

        modelBuilder.Entity<AvisoGlobal>()
            .HasOne(a => a.Autor)
            .WithMany()
            .HasForeignKey(a => a.AutorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RegistroAuditoria>()
            .HasOne(r => r.Usuario)
            .WithMany()
            .HasForeignKey(r => r.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.UsuarioEmail).HasMaxLength(256);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.UsuarioTipo).HasMaxLength(30);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.Acao).HasMaxLength(30);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.MetodoHttp).HasMaxLength(10);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.Rota).HasMaxLength(300);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.RecursoId).HasMaxLength(36);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.Resumo).HasMaxLength(500);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.Resultado).HasMaxLength(20);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.EnderecoIp).HasMaxLength(64);
        modelBuilder.Entity<RegistroAuditoria>()
            .Property(r => r.UserAgent).HasMaxLength(500);
        modelBuilder.Entity<RegistroAuditoria>()
            .HasIndex(r => r.CriadoEm);
        modelBuilder.Entity<RegistroAuditoria>()
            .HasIndex(r => new { r.UsuarioId, r.CriadoEm });

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

        modelBuilder.Entity<Avaliacao>()
            .Property(a => a.Ativo)
            .HasDefaultValue(true);

        modelBuilder.Entity<Avaliacao>()
            .Property(a => a.CriadaEm)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<Avaliacao>()
            .HasOne(a => a.CriadaPorUsuario)
            .WithMany()
            .HasForeignKey(a => a.CriadaPorUsuarioId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Avaliacao>()
            .HasOne(a => a.AtualizadaPorUsuario)
            .WithMany()
            .HasForeignKey(a => a.AtualizadaPorUsuarioId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<AvaliacaoHistorico>()
            .HasOne(h => h.Avaliacao)
            .WithMany(a => a.Historico)
            .HasForeignKey(h => h.AvaliacaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AvaliacaoHistorico>()
            .HasOne(h => h.Usuario)
            .WithMany()
            .HasForeignKey(h => h.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<AvaliacaoHistorico>()
            .Property(h => h.UsuarioEmail)
            .HasMaxLength(256);

        modelBuilder.Entity<AvaliacaoHistorico>()
            .Property(h => h.UsuarioTipo)
            .HasMaxLength(30);

        modelBuilder.Entity<AvaliacaoHistorico>()
            .Property(h => h.Acao)
            .HasMaxLength(30);

        modelBuilder.Entity<AvaliacaoHistorico>()
            .Property(h => h.Resumo)
            .HasMaxLength(500);

        modelBuilder.Entity<AvaliacaoHistorico>()
            .Property(h => h.CriadoEm)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<AvaliacaoHistorico>()
            .HasIndex(h => new { h.AvaliacaoId, h.CriadoEm });

        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .Property(s => s.Origem).HasMaxLength(20);
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .Property(s => s.Status).HasMaxLength(20);
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .Property(s => s.Motivo).HasMaxLength(1000);
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .Property(s => s.DescricaoAgendamento).HasMaxLength(1000);
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .HasOne(s => s.Aluno).WithMany().HasForeignKey(s => s.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .HasOne(s => s.Solicitante).WithMany().HasForeignKey(s => s.SolicitanteUsuarioId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .HasOne(s => s.AnalisadaPor).WithMany().HasForeignKey(s => s.AnalisadaPorUsuarioId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .HasIndex(s => new { s.AlunoId, s.DataAgendada });
        modelBuilder.Entity<SolicitacaoAvaliacao>()
            .HasIndex(s => new { s.AlunoId, s.Status, s.Urgente, s.DataDesejada });

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

        modelBuilder.Entity<Treino>()
            .Property(t => t.Ativo)
            .HasDefaultValue(true);

        modelBuilder.Entity<TreinoExercicio>()
            .HasOne(te => te.Treino)
            .WithMany(t => t.TreinoExercicios)
            .HasForeignKey(te => te.TreinoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TreinoExercicioVariacao>()
            .HasOne(v => v.TreinoExercicio)
            .WithMany(te => te.Variacoes)
            .HasForeignKey(v => v.TreinoExercicioId)
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

        modelBuilder.Entity<VolumeSemanal>()
            .HasIndex(v => new
            {
                v.PeriodizacaoSemanaId,
                v.GrupoMuscularId
            })
            .IsUnique();

        modelBuilder.Entity<VolumeSemanal>()
            .HasOne(v => v.PeriodizacaoSemana)
            .WithMany()
            .HasForeignKey(v => v.PeriodizacaoSemanaId)
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
            .Property(u => u.Ativo)
            .HasDefaultValue(true);

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<GrupoMuscular>()
            .HasIndex(g => g.Nome)
            .IsUnique();

        modelBuilder.Entity<Avaliacao>()
            .Property(a => a.PercentualGordura)
            .HasColumnName("PerceltualGordura");

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(t => t.TokenHash)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasOne(t => t.Usuario)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(t => t.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExecucaoTreino>()
            .HasIndex(e => new { e.TreinoId, e.Data });

        modelBuilder.Entity<AnaliseEstatistica>()
            .Property(a => a.FerramentaId).HasMaxLength(60);
        modelBuilder.Entity<AnaliseEstatistica>()
            .Property(a => a.NomeFerramenta).HasMaxLength(120);
        modelBuilder.Entity<AnaliseEstatistica>()
            .Property(a => a.Resumo).HasMaxLength(1000);
        modelBuilder.Entity<AnaliseEstatistica>()
            .Property(a => a.ParametrosJson).HasColumnType("jsonb");
        modelBuilder.Entity<AnaliseEstatistica>()
            .Property(a => a.ResultadoJson).HasColumnType("jsonb");
        modelBuilder.Entity<AnaliseEstatistica>()
            .HasOne<Aluno>().WithMany().HasForeignKey(a => a.AlunoId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<AnaliseEstatistica>()
            .HasOne<Usuario>().WithMany().HasForeignKey(a => a.GeradoPorUsuarioId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<AnaliseEstatistica>()
            .HasIndex(a => new { a.AlunoId, a.GeradoEm });

        modelBuilder.Entity<ExecucaoTreino>()
            .HasOne(e => e.Treino)
            .WithMany()
            .HasForeignKey(e => e.TreinoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExecucaoTreino>()
            .Property(e => e.TipoTreino).HasMaxLength(20).HasDefaultValue("strength");
        modelBuilder.Entity<ExecucaoTreino>()
            .Property(e => e.SessionId).HasMaxLength(100);
        modelBuilder.Entity<ExecucaoTreino>()
            .HasIndex(e => e.SessionId).IsUnique();

        modelBuilder.Entity<ExecucaoExercicio>()
            .HasOne(e => e.ExecucaoTreino)
            .WithMany(e => e.Exercicios)
            .HasForeignKey(e => e.ExecucaoTreinoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExecucaoExercicio>()
            .HasOne(e => e.TreinoExercicio)
            .WithMany()
            .HasForeignKey(e => e.TreinoExercicioId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ExecucaoExercicio>()
            .Property(e => e.Musculo).HasMaxLength(100);
        modelBuilder.Entity<ExecucaoExercicio>()
            .Property(e => e.StatusDor).HasMaxLength(20).HasDefaultValue("none");
        modelBuilder.Entity<ExecucaoExercicio>()
            .Property(e => e.Feedback).HasMaxLength(2000);

        modelBuilder.Entity<ExecucaoSerie>()
            .HasOne(s => s.ExecucaoExercicio)
            .WithMany(e => e.Series)
            .HasForeignKey(s => s.ExecucaoExercicioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TreinoVolumeCiclo>()
            .Property(c => c.TreinoNomeSnapshot).HasMaxLength(140);
        modelBuilder.Entity<TreinoVolumeCiclo>()
            .Property(c => c.ExerciciosSnapshotJson).HasColumnType("jsonb");
        modelBuilder.Entity<TreinoVolumeCiclo>()
            .HasOne(c => c.Aluno).WithMany().HasForeignKey(c => c.AlunoId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TreinoVolumeCiclo>()
            .HasOne(c => c.Treino).WithMany().HasForeignKey(c => c.TreinoId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TreinoVolumeCiclo>()
            .HasOne(c => c.CriadoPorUsuario).WithMany().HasForeignKey(c => c.CriadoPorUsuarioId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<TreinoVolumeCiclo>()
            .HasIndex(c => c.TreinoId).IsUnique().HasFilter("\"EncerradoEm\" IS NULL");

        modelBuilder.Entity<TreinoVolumeRegistroMensal>()
            .Property(r => r.Observacao).HasMaxLength(500);
        modelBuilder.Entity<TreinoVolumeRegistroMensal>()
            .HasOne(r => r.Ciclo).WithMany(c => c.Registros).HasForeignKey(r => r.CicloId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TreinoVolumeRegistroMensal>()
            .HasOne(r => r.RegistradoPorUsuario).WithMany().HasForeignKey(r => r.RegistradoPorUsuarioId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<TreinoVolumeRegistroMensal>()
            .HasIndex(r => new { r.CicloId, r.MesCiclo }).IsUnique();

        modelBuilder.Entity<DiaTreino>()
            .HasOne(td => td.PeriodizacaoDia)
            .WithMany(d => d.TreinosDias)
            .HasForeignKey(td => td.DiaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DiaTreino>()
            .HasOne(td => td.Treino)
            .WithMany()
            .HasForeignKey(td => td.TreinoId)
            .OnDelete(DeleteBehavior.Restrict);

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
