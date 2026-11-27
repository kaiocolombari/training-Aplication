namespace TreinoAPI.DTOs.Convite;

public sealed class CriarConviteDTO
{
    public string? Apelido { get; set; }
    public string? NomePersonal { get; set; }
}

public sealed class ValidarConviteDTO
{
    public string Token { get; set; } = string.Empty;
}

public sealed class ConviteCriadoDTO
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Apelido { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime ExpiraEm { get; set; }
    public int Utilizacoes { get; set; }
}

public sealed class ConviteResumoDTO
{
    public Guid Id { get; set; }
    public string Apelido { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime ExpiraEm { get; set; }
    public DateTime? RevogadoEm { get; set; }
    public int Utilizacoes { get; set; }
    public bool Ativo { get; set; }
}

public sealed class ConvitePublicoDTO
{
    public bool Valido { get; set; }
    public string PersonalNome { get; set; } = string.Empty;
    public string Apelido { get; set; } = string.Empty;
}

public sealed class ConvitesPersonalResumoDTO
{
    public Guid PersonalId { get; set; }
    public string PersonalNome { get; set; } = string.Empty;
    public int ConvitesCriados { get; set; }
    public int PessoasRegistradas { get; set; }
    public int CadastrosPendentes { get; set; }
    public int CadastrosAprovados { get; set; }
    public int CadastrosReprovados { get; set; }
    public List<ConvidadoResumoDTO> Convidados { get; set; } = [];
}

public sealed class ConvidadoResumoDTO
{
    public Guid AlunoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string StatusCadastro { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public string? ConviteApelido { get; set; }
}
