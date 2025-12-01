import axios from "axios"
import { supabase } from "./supabase"

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
})

api.interceptors.request.use(async (config) => {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
        console.error("Error getting session:", error)
        if (error.message.includes("Refresh Token") || error.message.includes("refresh_token")) {
            console.warn("Invalid refresh token, signing out...")
            await supabase.auth.signOut()
            window.location.href = "/login"
            return config
        }
    }

    if (session?.access_token) {
        // console.log("Attaching token to request:", session.access_token.substring(0, 10) + "...")
        config.headers.Authorization = `Bearer ${session.access_token}`
    } else {
        console.warn("No active session found in API interceptor")
    }

    return config
})

export default api
