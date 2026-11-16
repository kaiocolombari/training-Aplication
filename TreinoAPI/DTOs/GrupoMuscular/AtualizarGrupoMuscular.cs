using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.GrupoMuscular;

public class AtualizarGrupoMuscularDTO
{
    [Required, StringLength(80, MinimumLength = 2)]
    public string? Nome { get; set; }
}
