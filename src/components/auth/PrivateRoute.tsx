import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../providers/auth/useAuth.ts";

export default function PrivateRoute() {
    // @ts-ignore
    const { userInfo, userData, accessToken, refreshToken, isLoading } = useAuth();

    // console.log('user:', userInfo);
    console.log('userData:', userData);
    // console.log('isLoading:', isLoading);

    if (isLoading) {
        return <div>Chargement...</div>; // ou un loader sympa
    }

    if (!userInfo) {
        console.log("Not logged in");
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
}
