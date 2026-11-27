import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
    render: (container: HTMLElement, options: {
        sitekey: string;
        action: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback": () => void;
        theme?: "light" | "dark";
    }) => string;
    remove: (widgetId: string) => void;
};

declare global {
    interface Window { turnstile?: TurnstileApi; }
}

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

export default function TurnstileWidget({
    action,
    onToken,
}: {
    action: "student_register" | "student_form";
    onToken: (token: string) => void;
}) {
    const container = useRef<HTMLDivElement>(null);
    const onTokenRef = useRef(onToken);
    const [status, setStatus] = useState<"loading" | "ready" | "error" | "local">("loading");

    useEffect(() => { onTokenRef.current = onToken; }, [onToken]);

    useEffect(() => {
        if (!siteKey) {
            if (import.meta.env.DEV) {
                onTokenRef.current("local-development-bypass");
                setStatus("local");
            } else {
                onTokenRef.current("");
                setStatus("error");
            }
            return;
        }

        let widgetId: string | null = null;
        let cancelled = false;
        const render = () => {
            if (cancelled || !container.current || !window.turnstile) return;
            widgetId = window.turnstile.render(container.current, {
                sitekey: siteKey,
                action,
                callback: token => { onTokenRef.current(token); setStatus("ready"); },
                "expired-callback": () => { onTokenRef.current(""); setStatus("loading"); },
                "error-callback": () => { onTokenRef.current(""); setStatus("error"); },
                theme: "light",
            });
        };

        const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile-script]");
        if (window.turnstile) {
            render();
        } else if (existing) {
            existing.addEventListener("load", render, { once: true });
            existing.addEventListener("error", () => setStatus("error"), { once: true });
        } else {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.dataset.turnstileScript = "true";
            script.onload = render;
            script.onerror = () => setStatus("error");
            document.head.appendChild(script);
        }

        return () => {
            cancelled = true;
            if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
        };
    }, [action]);

    return (
        <div className="min-h-[66px]">
            <div ref={container} />
            {status === "local" && <p className="text-[10px] text-zinc-400">Verificação de segurança desativada no ambiente local.</p>}
            {status === "error" && <p role="alert" className="text-[11px] text-red-600">Não foi possível carregar a verificação de segurança. Atualize a página ou tente novamente mais tarde.</p>}
        </div>
    );
}
