import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { API_FORBIDDEN_EVENT } from "../service/api";

export default function ForbiddenRedirector() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        function handleForbidden(event: Event) {
            if (location.pathname === "/acesso-negado") return;
            const detail = (event as CustomEvent<{ endpoint?: string }>).detail;
            navigate("/acesso-negado", {
                replace: true,
                state: { from: location.pathname, endpoint: detail?.endpoint ?? "" },
            });
        }

        window.addEventListener(API_FORBIDDEN_EVENT, handleForbidden);
        return () => window.removeEventListener(API_FORBIDDEN_EVENT, handleForbidden);
    }, [location.pathname, navigate]);

    return null;
}
