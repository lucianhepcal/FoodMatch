package com.example.foodmatch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.example.foodmatch.ui.screens.PantryScreen
import com.example.foodmatch.ui.theme.FoodMatchTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppNavigation() // We'll put the navigation structure here later
        }
    }
}

@Composable
fun AppNavigation() {
    FoodMatchTheme {
        // A surface container using the 'background' color from the theme
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            // For the initial connectivity test, we display the PantryScreen directly.
            PantryScreen()
        }
    }
}

@Preview(showBackground = true)
@Composable
fun AppPreview() {
    FoodMatchTheme {
        AppNavigation()
    }
}