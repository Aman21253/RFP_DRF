import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
});

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");

        const publicRoutes = [
            "auth/login/",
            "auth/register/",
            "auth/verify-otp/",
            "auth/resend-otp/",
            "auth/forgot-password/",
            "auth/reset-password/",
            "auth/organization-register/",
            "public/categories/",
        ];

        const isPublicRoute = publicRoutes.some((route) =>
            config.url?.includes(route)
        );

        if (token && !isPublicRoute) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default API;