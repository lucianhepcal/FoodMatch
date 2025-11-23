package com.example.foodmatch.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foodmatch.data.remote.SupabaseRepository
import com.example.foodmatch.model.Ingredient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

// Data class representing the state of the UI
data class PantryUiState(
    val allIngredients: List<Ingredient> = emptyList(),
    val selectedIngredientIds: Set<Int> = emptySet(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

/**
 * Manages the list of available and selected ingredients (the user's "Pantry").
 */
class IngredientsViewModel : ViewModel() {

    // The Supabase Repository handles the data fetching
    private val repository = SupabaseRepository()

    // MutableStateFlow holds the current state, which the UI observes
    private val _uiState = MutableStateFlow(PantryUiState(isLoading = true))
    val uiState: StateFlow<PantryUiState> = _uiState

    init {
        fetchIngredients()
    }

    /**
     * Fetches all ingredients from the Supabase database.
     */
    private fun fetchIngredients() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val ingredients = repository.getIngredients()
                _uiState.update {
                    it.copy(
                        allIngredients = ingredients,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                // If the Supabase key/URL is wrong or the network fails
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Error fetching ingredients: ${e.message}. Check Supabase credentials/network."
                    )
                }
            }
        }
    }

    /**
     * Toggles the selection state of an ingredient.
     */
    fun toggleIngredientSelection(ingredientId: Int?) {
        if (ingredientId == null) return

        _uiState.update { currentState ->
            val currentSelected = currentState.selectedIngredientIds
            val newSelected = if (currentSelected.contains(ingredientId)) {
                currentSelected - ingredientId // Deselect
            } else {
                currentSelected + ingredientId // Select
            }
            currentState.copy(selectedIngredientIds = newSelected)
        }
    }

    /**
     * Helper function to expose the currently selected IDs.
     * This set is what you'll pass to the Recipe search function later.
     */
    fun getSelectedIds(): Set<Int> {
        return uiState.value.selectedIngredientIds
    }
}