import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../providers/auth/useAuth.ts";

export default function PrivateRoute() {
    // @ts-ignore
    const { userInfo, userData, accessToken, refreshToken, isLoading } = useAuth();

    if (isLoading) {
        return <div>Chargement...</div>; // ou un loader sympa
    }

    if (!userInfo) {
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
}
