namespace TreinoAPI.Model
{
    public class Perimetro
    {
        public Guid Id {get;set;}
        public Guid AvaliacaoId { get; set; }
        public string Braco_D {get;set;} = string.Empty;
        public string Braco_E {get;set;} = string.Empty;
        public string Antebraco_D {get;set;} = string.Empty;
        public string Antebraco_E {get;set;} = string.Empty;
        public string Torax {get;set;} = string.Empty;
        public string Cintura {get;set;} = string.Empty;
        public string Abdomen{get;set;} = string.Empty;
        public string Quadril {get;set;} = string.Empty;
        public string Coxa_Sup_D {get;set;} = string.Empty;
        public string Coxa_Sup_E {get;set;} = string.Empty;
        public string Coxa_Med_D {get;set;} = string.Empty;
        public string Coxa_Med_E {get;set;} = string.Empty;
        public string Panturrilha_D {get;set;} = string.Empty;
        public string Panturrilha_E {get;set;} = string.Empty;
        public Avaliacao Avaliacao {get;set;} = null!;
    }
}