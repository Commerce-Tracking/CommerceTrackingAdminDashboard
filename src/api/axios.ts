import axios from "axios";

const baseURL = "https://sandbox.api.freetrade-ofr.com";

const axiosInstance = axios.create({ baseURL });

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;
