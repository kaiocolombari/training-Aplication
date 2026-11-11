
import { Outlet } from "react-router";
import { useState } from "react";
import NavTool from "../components/navTool";

export default function AvaliacaoLayout() {
    const [tema] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";

        return localStorage.getItem("painel_tema") === "dark"
            ? "dark"
            : "light";
    });
    console.log("AVALIACAO LAYOUT RENDERIZADO");
    return (
        <div
            className="painel-theme"
            data-theme={tema}
        >
            <div className="flex min-h-screen w-full items-start">
                <NavTool />

                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>
            </div>

        </div>
    );
}
