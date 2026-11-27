import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();

  return {
    ...config,
    name: config.name ?? "Treino System",
    slug: config.slug ?? "treino-system-mobile",
    version: config.version ?? "1.0.0",
    plugins: [...(config.plugins ?? []), "expo-video"],
    extra: {
      ...config.extra,
      ...(projectId
        ? {
            eas: {
              ...config.extra?.eas,
              projectId,
            },
          }
        : {}),
    },
  };
};
