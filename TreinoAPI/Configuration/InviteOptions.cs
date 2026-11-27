namespace TreinoAPI.Configuration;

public sealed class InviteOptions
{
    public int MaxRegistrationsPerHourPerInvite { get; set; } = 100;
    public int ValidityDays { get; set; } = 30;
}
