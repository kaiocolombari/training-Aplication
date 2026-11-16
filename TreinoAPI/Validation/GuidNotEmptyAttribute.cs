using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.Validation;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class GuidNotEmptyAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is null)
            return true;
        return value is Guid id && id != Guid.Empty;
    }
}
