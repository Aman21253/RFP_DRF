import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    const noAuthRoutes = [
        "auth/login/",
        "auth/register/",
        "auth/verify-otp/",
        "auth/resend-otp/",
        "auth/forgot-password/",
        "auth/reset-password/",
    ];

    const shouldSkipToken = noAuthRoutes.some((route) =>
        config.url?.includes(route)
    );

    if (token && !shouldSkipToken) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default API;