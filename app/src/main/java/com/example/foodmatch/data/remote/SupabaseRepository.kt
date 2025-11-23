package com.example.foodmatch.data.remote
import android.util.Log
import com.example.foodmatch.model.Ingredient
import com.example.foodmatch.model.Recipe

import com.example.foodmatch.model.RecipeMatch
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.withContext
import io.github.jan.supabase.postgrest.rpc


/**
 * Handles all data operations with the Supabase PostgreSQL database.
 */
class SupabaseRepository {

    private val client = SupabaseClient.client


    /** Fetches all ingredients for the Pantry Screen. */
    suspend fun getIngredients(): List<Ingredient> {
        return try {
            client.from("ingredients").select {
                order("name", Order.ASCENDING)
            }.decodeList<Ingredient>()
        } catch (e: Exception) {
            Log.e("SupabaseRepo", "Error fetching ingredients: ${e.message}", e)
            emptyList()
        }
    }
    /**
     * Finds recipes that match the user's available ingredients.
     * Fetches all necessary data and performs client-side filtering.
     */
    suspend fun findMatchingRecipes(myPantryIds: Set<Int>): List<RecipeMatch> {
        if (myPantryIds.isEmpty()) return emptyList()

        return try {
            client.postgrest.rpc(
                funtion = "find_matching_recipes",
                parameters = mapOf("pantry_ids" to myPantryIds.toList())
            ).decodeList<RecipeMatch>()
        }catch (e: Exception) {
            Log.e("SupabaseRepo", "Error calling RPC: ${e.message}", e)
            emptyList()
        }
    }
}