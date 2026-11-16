using System.Security.Cryptography;
using System.Text;

namespace TreinoAPI.Security;

public sealed class PasswordService
{
    private const int WorkFactor = 12;

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public (bool IsValid, bool NeedsRehash) Verify(string password, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(storedHash))
            return (false, false);

        if (storedHash.StartsWith("$2", StringComparison.Ordinal))
        {
            try
            {
                return (BCrypt.Net.BCrypt.Verify(password, storedHash), false);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return (false, false);
            }
        }

        // Migração gradual: contas antigas armazenavam a senha em texto puro.
        // Após o primeiro login válido, o valor é substituído por um hash BCrypt.
        var supplied = Encoding.UTF8.GetBytes(password);
        var legacy = Encoding.UTF8.GetBytes(storedHash);
        var valid = supplied.Length == legacy.Length &&
                    CryptographicOperations.FixedTimeEquals(supplied, legacy);

        return (valid, valid);
    }
}
