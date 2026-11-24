using System.Collections.Concurrent;

namespace TreinoAPI.Hubs;

public sealed class ChatPresenceTracker
{
    private readonly ConcurrentDictionary<Guid, int> _connections = new();

    public bool IsOnline(Guid usuarioId) => _connections.ContainsKey(usuarioId);

    public bool Connected(Guid usuarioId) => _connections.AddOrUpdate(usuarioId, 1, (_, total) => total + 1) == 1;

    public bool Disconnected(Guid usuarioId)
    {
        while (_connections.TryGetValue(usuarioId, out var total))
        {
            if (total > 1)
            {
                if (_connections.TryUpdate(usuarioId, total - 1, total)) return false;
            }
            else if (_connections.TryRemove(new KeyValuePair<Guid, int>(usuarioId, total)))
            {
                return true;
            }
        }

        return false;
    }
}
