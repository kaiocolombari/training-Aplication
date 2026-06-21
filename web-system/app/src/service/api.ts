import { useState, useEffect } from "react";
import axios from "axios";

export default function Connection() {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const connectionChangeHandler =  async () => {
            try {
                const response = await axios.get("http://localhost:3000");
                setIsOnline(true);
            } catch (e) {
                console.error('API Error:', e);
                setIsOnline(false);
            } 
        };

        connectionChangeHandler();
    },[]);

    return isOnline
}