import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

import { getApiBaseUrl, getFreshAccessToken } from "@/services/api";

export function ExerciseVideoPlayer({ url, title }: { url: string; title?: string | null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const apiBase = getApiBaseUrl();
        const videoUrl = url.startsWith("http")
          ? url
          : `${apiBase}${url.startsWith("/") ? url : `/${url}`}`;
        const isPrivateApiVideo = videoUrl.startsWith(apiBase);
        const token = isPrivateApiVideo && Platform.OS !== "web" ? await getFreshAccessToken() : "";
        if (isPrivateApiVideo && Platform.OS !== "web" && !token) {
          throw new Error("Sessão indisponível para carregar o vídeo.");
        }

        await player.replaceAsync({
          uri: videoUrl,
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
          ...(Platform.OS !== "web"
            ? {
                useCaching: true,
                metadata: { title: title ?? "Demonstração do exercício" },
              }
            : {}),
        });
        if (active) {
          setLoading(false);
          player.play();
        }
      } catch {
        if (active) {
          setLoading(false);
          setError(true);
        }
      }
    }

    void load();
    return () => {
      active = false;
      player.pause();
    };
  }, [player, title, url]);

  return (
    <View className="overflow-hidden rounded-[24px] border border-[#E7E4DC] bg-[#17211B]">
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
        crossOrigin={Platform.OS === "web" && url.includes("/api/exercicios/catalogo/videos/") ? "use-credentials" : undefined}
        onFirstFrameRender={() => setLoading(false)}
      />
      {loading ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center bg-[#17211B]/80">
          <ActivityIndicator color="#C8EF73" />
          <Text className="mt-2 text-[10px] font-semibold text-white/70">Carregando demonstração...</Text>
        </View>
      ) : null}
      {error ? (
        <View className="absolute inset-0 items-center justify-center bg-[#17211B] px-5">
          <Text className="text-[11px] font-bold text-white">Não foi possível carregar o vídeo</Text>
          <Text className="mt-1 text-center text-[9px] text-white/60">Confira sua conexão e tente novamente mais tarde.</Text>
        </View>
      ) : null}
      <View className="flex-row items-center justify-between px-3 py-2">
        <Text numberOfLines={1} className="flex-1 text-[9px] font-bold text-white/75">{title || "Demonstração do movimento"}</Text>
        <Text className="ml-2 text-[8px] font-semibold uppercase tracking-[0.8px] text-[#C8EF73]">Loop · sem áudio</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#101712",
  },
});
