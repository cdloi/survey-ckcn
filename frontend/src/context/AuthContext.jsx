import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const { token: t, user: u } = JSON.parse(saved);
        setToken(t);
        setUser(u);
        fetch("/api/admin/me", { headers: { Authorization: `Bearer ${t}` } })
          .then((r) => r.json())
          .then((d) => {
            if (d.user) {
              setUser(d.user);
              localStorage.setItem("auth", JSON.stringify({ token: t, user: d.user }));
            } else {
              localStorage.removeItem("auth");
              setToken(null);
              setUser(null);
            }
          })
          .catch(() => {});
      } catch {
        localStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("auth", JSON.stringify({ token: data.token, user: data.user }));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
  };

  const isDean = user?.role === "admin";
  const isCoordinator = user?.role === "manager";
  const userMajor = user?.major || "";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isDean, isCoordinator, userMajor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
