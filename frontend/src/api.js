import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: email,
            password: password
        });

        if (response.data.token) {
            localStorage.setItem('userToken', response.data.token);
        }
        return response.data;

    } catch (error) {
        throw error.response?.data?.message || "Server unreachable. Please check your connection or CORS settings.";
    }
};