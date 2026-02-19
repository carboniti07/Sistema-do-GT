import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState(null);

  const toast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  return { toast, message };
}
