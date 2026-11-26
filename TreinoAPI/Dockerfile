FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY TreinoAPI/TreinoAPI.csproj TreinoAPI/
RUN dotnet restore TreinoAPI/TreinoAPI.csproj

COPY TreinoAPI/ TreinoAPI/
WORKDIR /src/TreinoAPI
RUN dotnet publish TreinoAPI.csproj -c Release --no-restore -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN mkdir -p /data/arquivos-equipe /data/chat-anexos \
    && chown -R $APP_UID:$APP_UID /data

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=8080 \
    TEAM_FILES_STORAGE_PATH=/data/arquivos-equipe \
    CHAT_FILES_STORAGE_PATH=/data/chat-anexos

VOLUME ["/data"]
EXPOSE 8080

COPY --from=build /app/publish .
USER $APP_UID

ENTRYPOINT ["dotnet", "TreinoAPI.dll"]
