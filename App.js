import React, { useState } from 'react';
import { supabase } from './supabase/supabaseClient';

import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// --- MOCK DATA (Replace this with Supabase calls later) ---
const MOCK_RECIPES = [
  {
    id: 1,
    title: "Classic Omelette",
    time: "10 min",
    difficulty: "Easy",
    icon: "egg",
    ingredients: ["eggs", "milk", "cheese", "butter"],
  },
  {
    id: 2,
    title: "Spaghetti Carbonara",
    time: "20 min",
    difficulty: "Medium",
    icon: "utensils",
    ingredients: ["pasta", "eggs", "bacon", "cheese", "pepper"],
  },
  {
    id: 3,
    title: "Grilled Cheese",
    time: "5 min",
    difficulty: "Easy",
    icon: "bread-slice",
    ingredients: ["bread", "cheese", "butter"],
  },
  {
    id: 4,
    title: "Chicken Salad",
    time: "15 min",
    difficulty: "Easy",
    icon: "leaf",
    ingredients: ["chicken", "lettuce", "tomato", "cucumber", "dressing"],
  },
  {
    id: 5,
    title: "Pancakes",
    time: "20 min",
    difficulty: "Medium",
    icon: "stroopwafel", // closest to pancake in FA5 free
    ingredients: ["flour", "milk", "eggs", "sugar", "butter"],
  }
];

export default function App() {
  // --- STATE ---
  const [myIngredients, setMyIngredients] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [matchedRecipes, setMatchedRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState("fridge"); // 'fridge' or 'recipes'
  const [isLoading, setIsLoading] = useState(false);

  // --- HANDLERS ---
  const addIngredient = () => {
    if (!inputValue.trim()) return;
    const newIng = inputValue.toLowerCase().trim();
    if (!myIngredients.includes(newIng)) {
      setMyIngredients([...myIngredients, newIng]);
    }
    setInputValue("");
  };

  const removeIngredient = (ing) => {
    setMyIngredients(myIngredients.filter(i => i !== ing));
  };

  const findRecipes = async () => {
    if (myIngredients.length === 0) return;
    setIsLoading(true);

    // 1) fetch recipes from Supabase
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, time, difficulty, image, ingredients');

    if (error) {
      console.log('Supabase error:', error);
      setIsLoading(false);
      return;
    }

    // 2) map to the shape your UI expects
    const results = data.map((recipe) => {
      // ensure ingredients is an array
      const ing = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : (recipe.ingredients ?? []);

      const have = ing.filter((i) => myIngredients.includes(i));
      const missing = ing.filter((i) => !myIngredients.includes(i));
      const matchPercentage = ing.length
        ? (have.length / ing.length) * 100
        : 0;

      return {
        id: recipe.id,
        title: recipe.name,
        time: recipe.time || '–',
        difficulty: recipe.difficulty || '–',
        icon: 'utensils',         // or store icon in DB later
        ingredients: ing,
        have,
        missing,
        matchPercentage,
      };
    })
      .filter((r) => r.have.length > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    setMatchedRecipes(results);
    setActiveTab('recipes');
    setIsLoading(false);
  };


  // --- RENDER HELPERS ---
  const renderFridge = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Food<Text style={styles.titleHighlight}>Match</Text></Text>
        <Text style={styles.subtitle}>What's in your kitchen?</Text>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <FontAwesome5 name="search" size={18} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput 
          style={styles.input}
          placeholder="Add ingredient (e.g. eggs)..."
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={addIngredient} // Handle 'Enter' on keyboard
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
          <FontAwesome5 name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Ingredients List */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Your Ingredients ({myIngredients.length})</Text>
        {myIngredients.length > 0 && (
          <TouchableOpacity onPress={() => setMyIngredients([])}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tagsContainer}>
        {myIngredients.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="lemon" size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>Your fridge is empty!</Text>
          </View>
        ) : (
          myIngredients.map(ing => (
            <View key={ing} style={styles.tag}>
              <Text style={styles.tagText}>{ing}</Text>
              <TouchableOpacity onPress={() => removeIngredient(ing)} style={styles.tagClose}>
                <FontAwesome5 name="times" size={12} color="#FB923C" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Main Action Button */}
      <TouchableOpacity 
        onPress={findRecipes}
        disabled={myIngredients.length === 0}
        style={[
          styles.mainButton, 
          myIngredients.length === 0 ? styles.buttonDisabled : styles.buttonActive
        ]}
      >
        {isLoading ? (
          <Text style={styles.buttonText}>Searching...</Text>
        ) : (
          <>
            <FontAwesome5 name="magic" size={18} color="white" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>Find Recipes</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRecipes = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Matches ({matchedRecipes.length})</Text>
        <TouchableOpacity onPress={() => setActiveTab("fridge")}>
          <Text style={styles.editLink}>Edit Fridge</Text>
        </TouchableOpacity>
      </View>

      {matchedRecipes.length === 0 ? (
        <View style={styles.emptyStateResults}>
          <FontAwesome5 name="cookie-bite" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No recipes found matching your ingredients.</Text>
          <TouchableOpacity onPress={() => setActiveTab("fridge")}>
            <Text style={styles.editLink}>Add more ingredients</Text>
          </TouchableOpacity>
        </View>
      ) : (
        matchedRecipes.map(recipe => (
          <View key={recipe.id} style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <FontAwesome5 name={recipe.icon} size={24} color="#F97316" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{recipe.title}</Text>
                <Text style={styles.cardMeta}>{recipe.time} • {recipe.difficulty}</Text>
              </View>
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>{Math.round(recipe.matchPercentage)}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${recipe.matchPercentage}%`, backgroundColor: recipe.matchPercentage === 100 ? '#22C55E' : '#FB923C' }
                ]} 
              />
            </View>

            {/* Details */}
            <View style={styles.cardBody}>
              <Text style={styles.haveText}>
                <FontAwesome5 name="check" size={12} /> You have: {recipe.have.join(", ")}
              </Text>
              {recipe.missing.length > 0 && (
                <Text style={styles.missingText}>
                  <FontAwesome5 name="shopping-cart" size={12} /> Missing: {recipe.missing.join(", ")}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Content Area */}
      <View style={{flex: 1}}>
        {activeTab === 'fridge' ? renderFridge() : renderRecipes()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab("fridge")}
        >
          <FontAwesome5 name="shopping-basket" size={20} color={activeTab === 'fridge' ? '#F97316' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'fridge' && styles.tabTextActive]}>My Fridge</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab("recipes")}
        >
          <FontAwesome5 name="utensils" size={20} color={activeTab === 'recipes' ? '#F97316' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>Recipes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <FontAwesome5 name="user" size={20} color="#9CA3AF" />
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  titleHighlight: {
    color: '#F97316',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#374151',
  },
  addButton: {
    backgroundColor: '#F97316',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  clearText: {
    fontSize: 12,
    color: '#F87171',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#C2410C',
    fontWeight: '500',
    marginRight: 6,
  },
  tagClose: {
    padding: 2,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  mainButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonActive: {
    backgroundColor: '#111827',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Recipe Results Styles
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editLink: {
    color: '#F97316',
    fontWeight: '500',
  },
  emptyStateResults: {
    alignItems: 'center',
    marginTop: 60,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#FFEDD5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  matchBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#374151',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardBody: {
    gap: 6,
  },
  haveText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  missingText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#F97316',
  }
});
