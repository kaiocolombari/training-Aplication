namespace TreinoAPI.Model
{
    public class GrupoMuscular
    {
        public Guid Id { get; set; }
        public string? Nome { get; set; }
        public ICollection<VolumeSemanal> VolumesSemanais { get; set; } = new List<VolumeSemanal>();
    }
}