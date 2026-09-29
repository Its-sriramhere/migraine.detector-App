import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetwork(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => {
      setOnline(s.isConnected ?? null);
    });
    NetInfo.fetch()
      .then((s) => setOnline(s.isConnected ?? null))
      .catch(() => setOnline(null));
    return () => sub();
  }, []);

  return online;
}
