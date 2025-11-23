package com.example.foodmatch.model

import kotlinx.serialization.Serializable

@Serializable
data class Ingredient(
    val id: Int? = null, // Matches the primary key in PostgreSQL
    val name: String,
    val icon: String // Stored as a simple emoji string
)
@Serializable
data class Recipe(
    val id: Int? = null,
    val name: String,
    val description: String,
    val time: String,
    val difficulty: String
)
@Serializable
data class RecipeMatch(
    val recipe: Recipe,
    val matchPercentage: Int, // Calculated value (0-100)
    val missingIngredients: List<Ingredient>, // Resolved Ingredient objects for display
    val totalRequiredCount: Int
)