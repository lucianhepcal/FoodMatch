package com.example.foodmatch.data.remote
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest

object SupabaseClient {
    // Go to Supabase Dashboard -> Project Settings -> API to find these
    private const val SUPABASE_URL = "https://nkzvwpzqrtypmaxorxid.supabase.co"
    private const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5renZ3cHpxcnR5cG1heG9yeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODA1NDUsImV4cCI6MjA3NzE1NjU0NX0.1pqpqLWQ4YBK1gQIaC473lHbZgrQW1L26PXGisQeBTw"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Postgrest) // Installs the database module
    }
}