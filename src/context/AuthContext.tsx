import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    ApiError,
    clearToken,
    fetchCurrentUser,
    getStoredToken,
    loginWithPassword,
    storeToken,
    type CurrentUser,
} from "../api/client";

interface AuthContextValue {
    user: CurrentUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [token, setToken] = useState<string | null>(() => getStoredToken());
    const [loading, setLoading] = useState<boolean>(true);

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setUser(null);
    }, []);

    // Hydrate current user on first load if we have a token
    useEffect(() => {
        let cancelled = false;

        async function hydrate() {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const me = await fetchCurrentUser(() => {
                    if (!cancelled) {
                        logout();
                    }
                });
                if (!cancelled) {
                    setUser(me);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to hydrate user", err);
                    logout();
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        hydrate();

        return () => {
            cancelled = true;
        };
    }, [token, logout]);

    const login = useCallback(
        async (email: string, password: string) => {
            setLoading(true);
            try {
                const { access_token } = await loginWithPassword(email, password);
                storeToken(access_token);
                setToken(access_token);
                const me = await fetchCurrentUser(() => {
                    logout();
                });
                setUser(me);
            } catch (err) {
                if (err instanceof ApiError) {
                    throw err;
                }
                throw new Error("Login failed");
            } finally {
                setLoading(false);
            }
        },
        [logout],
    );

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            loading,
            login,
            logout,
        }),
        [user, token, loading, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}
