import { useEffect } from "react";
import navTool from "../components/navTool";

useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "Tem certeza que deseja sair?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
    };
}, []);

export default function periodizacao() {
    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5">
            <div>periodizacao</div>
            <div>{navTool()}</div>
        </main>
    )
}
