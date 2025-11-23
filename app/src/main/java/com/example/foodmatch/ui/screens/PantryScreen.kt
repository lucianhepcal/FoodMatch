package com.example.foodmatch.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.foodmatch.model.Ingredient
import com.example.foodmatch.ui.theme.FoodMatchTheme // Assuming you have a theme
import com.example.foodmatch.ui.viewmodel.IngredientsViewModel

/**
 * Main screen where the user selects the ingredients they have in their pantry.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PantryScreen(
    // Get the ViewModel instance
    viewModel: IngredientsViewModel = viewModel()
) {
    // Collect the UI state as a Compose State
    val state by viewModel.uiState.collectAsState()

    FoodMatchTheme {
        Scaffold(
            topBar = {
                TopAppBar(title = { Text("My Pantry: Select Ingredients") })
            },
            content = { paddingValues ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(horizontal = 16.dp)
                ) {

                    Text(
                        text = "You have ${state.selectedIngredientIds.size} ingredients selected.",
                        style = MaterialTheme.typography.bodyLarge,
                        modifier = Modifier.padding(vertical = 12.dp)
                    )

                    when {
                        state.isLoading -> {
                            // Show loading indicator while fetching from Supabase
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        }
                        state.errorMessage != null -> {
                            // Display error if fetching fails
                            ErrorMessageCard(state.errorMessage!!)
                        }
                        else -> {
                            // Display the list of ingredients
                            IngredientGrid(
                                ingredients = state.allIngredients,
                                selectedIds = state.selectedIngredientIds,
                                onToggle = viewModel::toggleIngredientSelection
                            )
                        }
                    }
                }
            }
        )
    }
}

@Composable
fun IngredientGrid(
    ingredients: List<Ingredient>,
    selectedIds: Set<Int>,
    onToggle: (Int?) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 100.dp),
        contentPadding = PaddingValues(bottom = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(ingredients) { ingredient ->
            IngredientItem(
                ingredient = ingredient,
                isSelected = selectedIds.contains(ingredient.id),
                onClick = { onToggle(ingredient.id) }
            )
        }
    }
}

@Composable
fun IngredientItem(
    ingredient: Ingredient,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.8f) else MaterialTheme.colorScheme.surfaceVariant
    val textColor = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = ingredient.icon,
                style = MaterialTheme.typography.headlineLarge,
                color = textColor,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = ingredient.name,
                style = MaterialTheme.typography.labelMedium,
                color = textColor
            )
        }
    }
}

@Composable
fun ErrorMessageCard(message: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFDD835)), // Yellow background
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Error",
                tint = Color.Black
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Database Error: $message",
                color = Color.Black,
                fontWeight = FontWeight.Bold
            )
        }
    }
}