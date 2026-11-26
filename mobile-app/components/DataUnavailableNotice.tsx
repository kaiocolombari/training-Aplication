import { AlertCircle, RefreshCw } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  detail: string;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
};

export function DataUnavailableNotice({ title, detail, onRetry, retrying = false, compact = false }: Props) {
  return (
    <View className={`rounded-2xl border border-[#E8D8CE] bg-[#FBF1EA] ${compact ? "p-3" : "p-4"}`}>
      <View className="flex-row items-start gap-2.5">
        <AlertCircle color="#A45F45" size={17} />
        <View className="flex-1">
          <Text className="text-[11px] font-extrabold text-[#8D4F3E]">{title}</Text>
          <Text className="mt-1 text-[10px] leading-4 text-[#8D6254]">{detail}</Text>
          {onRetry ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Tentar carregar novamente" onPress={onRetry} disabled={retrying} className="mt-3 min-h-9 flex-row items-center gap-2 self-start rounded-xl border border-[#DCC4B7] bg-white px-3 py-2 disabled:opacity-50">
              {retrying ? <ActivityIndicator size="small" color="#8D4F3E" /> : <RefreshCw color="#8D4F3E" size={13} />}
              <Text className="text-[9px] font-extrabold text-[#8D4F3E]">{retrying ? "Tentando..." : "Tentar novamente"}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
