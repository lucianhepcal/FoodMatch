import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert, // Am adaugat Alert pentru erori
  Animated,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// --- CONFIGURARE API ---
// Schimba aici in functie de unde rulezi aplicatia (vezi nota de mai sus)
const API_URL = Platform.OS === 'android' 
  ? "http://192.168.1.242:3000/api/recipes" 
  : "http://192.168.1.242:3000/api/recipes"; 

export default function App() {
  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [loggedInUserEmail, setLoggedInUserEmail] = useState("");
  const [myIngredients, setMyIngredients] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [matchedRecipes, setMatchedRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [recipeOfDay, setRecipeOfDay] = useState(null);
  const [activeTab, setActiveTab] = useState("fridge");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // --- ANIMATION ---
  const panRotation = useRef(new Animated.Value(0)).current;
  const foodRotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scale and fade-in animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate pan rotation
    Animated.loop(
      Animated.timing(panRotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Animate food rotation with delay
    Animated.loop(
      Animated.timing(foodRotation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [panRotation, foodRotation]);

  const panRotateInterpolate = panRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });

  const foodRotateInterpolate = foodRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // --- HANDLERS ---
  const handleLogin = () => {
    // Mock login - accepts any input
    if (email.trim() && password.trim()) {
      setLoggedInUserEmail(email);
      setLoggedInUserName("");
      setSuccessMessage("login");
      setEmail("");
      setPassword("");
    } else {
      Alert.alert("Login", "Please enter both email and password");
    }
  };

  const handleSignup = () => {
    // Mock signup - accepts any input
    if (signupName.trim() && signupEmail.trim() && signupPassword.trim() && signupConfirmPassword.trim()) {
      if (signupPassword !== signupConfirmPassword) {
        Alert.alert("Signup", "Passwords do not match");
        return;
      }
      setLoggedInUserName(signupName);
      setLoggedInUserEmail(signupEmail);
      setSuccessMessage("signup");
      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
    } else {
      Alert.alert("Signup", "Please fill in all fields");
    }
  };

  const handleChangePassword = () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert("Change Password", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Change Password", "New passwords do not match");
      return;
    }
    Alert.alert("Success", "Password changed successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowChangePassword(false);
  };

  // Transition to fridge after showing success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setIsLoggedIn(true);
        setSuccessMessage(null);
        setShowSignup(false);
      }, 2500); // Show success for 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  // --- MODIFICAREA PRINCIPALA ESTE AICI ---
  const findRecipes = async () => {
    if (myIngredients.length === 0) return;
    setIsLoading(true);

    try {
      // 1) Fetch recipes from Express API (REST)
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json(); // Array-ul de retete din Postgres

      // 2) Logica de filtrare (Map to UI shape)
      // Aceasta ramane pe frontend pentru a calcula procentele dinamic
      const results = data.map((recipe) => {
        // Parse ingredients - handle both array and JSON string formats
        let ing = [];
        if (Array.isArray(recipe.ingredients)) {
          ing = recipe.ingredients;
        } else if (typeof recipe.ingredients === 'string') {
          try {
            ing = JSON.parse(recipe.ingredients);
          } catch (e) {
            ing = [];
          }
        }

        const have = ing.filter((i) => myIngredients.includes(i));
        const missing = ing.filter((i) => !myIngredients.includes(i));
        const matchPercentage = ing.length
          ? (have.length / ing.length) * 100
          : 0;

        return {
          id: recipe.id,
          title: recipe.name, // Atentie: in DB am pus 'name', UI-ul tau vrea 'title'
          time: recipe.time || '–',
          difficulty: recipe.difficulty || '–',
          icon: recipe.image || 'utensils', // Folosim coloana image pentru icon
          ingredients: ing,
          have,
          missing,
          matchPercentage,
          steps: Array.isArray(recipe.steps) ? recipe.steps : (typeof recipe.steps === 'string' ? JSON.parse(recipe.steps) : []),
        };
      })
      .filter((r) => r.have.length > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

      setMatchedRecipes(results);
      setActiveTab('recipes');

    } catch (error) {
      console.error('API Error:', error);
      Alert.alert("Error", "Could not fetch recipes from server. Is it running?");
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipeOfDay = async () => {
    setActiveTab('recipe-of-day');
    setIsLoading(true);
    try {
      // If allRecipes not fetched yet, fetch all recipes
      let recipes = allRecipes;
      if (recipes.length === 0) {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        recipes = data;
        setAllRecipes(data);
      }

      if (recipes.length === 0) {
        Alert.alert("Error", "No recipes available");
        return;
      }

      // Select a random recipe
      const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];

      // Parse ingredients
      let ing = [];
      if (Array.isArray(randomRecipe.ingredients)) {
        ing = randomRecipe.ingredients;
      } else if (typeof randomRecipe.ingredients === 'string') {
        try {
          ing = JSON.parse(randomRecipe.ingredients);
        } catch (e) {
          ing = [];
        }
      }

      const formattedRecipe = {
        id: randomRecipe.id,
        title: randomRecipe.name,
        time: randomRecipe.time || '–',
        difficulty: randomRecipe.difficulty || '–',
        icon: randomRecipe.image || 'utensils',
        ingredients: ing,
        have: [],
        missing: ing,
        matchPercentage: 0,
        steps: Array.isArray(randomRecipe.steps) ? randomRecipe.steps : (typeof randomRecipe.steps === 'string' ? JSON.parse(randomRecipe.steps) : []),
      };

      setRecipeOfDay(formattedRecipe);
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert("Error", "Could not fetch recipe of the day");
    } finally {
      setIsLoading(false);
    }
  };

  // --- BACKGROUND DECORATION ---
  const BackgroundDecoration = () => (
    <View style={styles.backgroundDecoration}>
      {/* Top right pan */}
      <Animated.View
        style={[
          styles.panContainer,
          styles.panTopRight,
          { transform: [{ rotate: panRotateInterpolate }] },
        ]}
      >
        <FontAwesome5 name="frying-pan" size={80} color="#FEF3C7" />
      </Animated.View>

      {/* Bottom left food */}
      <Animated.View
        style={[
          styles.foodContainer,
          styles.foodBottomLeft,
          { transform: [{ rotate: foodRotateInterpolate }] },
        ]}
      >
        <FontAwesome5 name="egg" size={60} color="#FECACA" />
      </Animated.View>

      {/* Top left decorative fork */}
      <View style={[styles.decorContainer, styles.decorTopLeft]}>
        <FontAwesome5 name="utensils" size={50} color="#DDD6FE" />
      </View>

      {/* Bottom right decorative leaf */}
      <View style={[styles.decorContainer, styles.decorBottomRight]}>
        <FontAwesome5 name="leaf" size={45} color="#BBFBEE" />
      </View>
    </View>
  );

  // --- RENDERING ---
  const renderSuccess = () => (
    <LinearGradient colors={['#D1FAE5', '#DBEAFE', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <View style={styles.successContainer}>
        <Animated.View 
          style={[
            styles.successContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }
          ]}
        >
        <Animated.View style={[styles.successIconContainer, {transform: [{rotate: panRotation}]}]}>
          <FontAwesome5 name="check-circle" size={80} color="#10B981" />
        </Animated.View>
      
      <Text style={styles.successTitle}>
        {successMessage === "login" ? "Login Successful!" : "Account Created!"}
      </Text>
      
      <Text style={styles.successSubtitle}>
        {successMessage === "login" ? "Welcome back to FoodMatch" : "Welcome to FoodMatch"}
      </Text>

      {/* Display user details - only for signup */}
      {successMessage === "signup" && (
        <View style={styles.successDetailsCard}>
          <Text style={styles.successDetailsLabel}>Name:</Text>
          <Text style={styles.successDetailsValue}>{signupName}</Text>
          <Text style={[styles.successDetailsLabel, {marginTop: 12}]}>Email:</Text>
          <Text style={styles.successDetailsValue}>{signupEmail}</Text>
        </View>
      )}

      <View style={styles.successDotsContainer}>
        <View style={styles.successDot}></View>
        <View style={styles.successDot}></View>
        <View style={styles.successDot}></View>
      </View>

      <Text style={styles.successMessage}>
        {successMessage === "login" ? "Redirecting..." : "Creating your account..."}
      </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );

  const renderLogin = () => (
    <LinearGradient colors={['#FEF3C7', '#FECACA', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <ScrollView contentContainerStyle={styles.contentContainer} style={{backgroundColor: 'transparent'}}>
      <Animated.View 
        style={[
          styles.loginContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <View style={styles.loginBrand}>
          <FontAwesome5 name="utensils" size={56} color="#F97316" />
        </View>
        
        <Text style={styles.loginTitle}>Food<Text style={styles.loginTitleHighlight}>Match</Text></Text>
        <Text style={styles.loginSubtitle}>Find recipes with what you have</Text>

        {/* Email Input */}
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="envelope" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="lock" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
          <TextInput
            style={styles.loginInput}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          onPress={handleLogin}
          style={styles.loginButton}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.loginFooter}>
          <Text style={styles.loginFooterText}>No account? </Text>
          <TouchableOpacity onPress={() => setShowSignup(true)}>
            <Text style={styles.loginFooterLink}>Sign up here</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      </ScrollView>
    </LinearGradient>
  );

  const renderSignup = () => (
    <LinearGradient colors={['#FEF3C7', '#FECACA', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <ScrollView contentContainerStyle={styles.contentContainer} style={{backgroundColor: 'transparent'}}>
      <Animated.View 
        style={[
          styles.loginContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <View style={styles.loginBrand}>
          <FontAwesome5 name="utensils" size={56} color="#F97316" />
        </View>
        
        <Text style={styles.loginTitle}>Create<Text style={styles.loginTitleHighlight}> Account</Text></Text>
        <Text style={styles.loginSubtitle}>Join FoodMatch today</Text>

        {/* Name Input */}
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="user" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
          <TextInput
            style={styles.loginInput}
            placeholder="Full Name"
            placeholderTextColor="#9CA3AF"
            value={signupName}
            onChangeText={setSignupName}
            autoCapitalize="words"
          />
        </View>

        {/* Email Input */}
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="envelope" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={signupEmail}
            onChangeText={setSignupEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="lock" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
          <TextInput
            style={styles.loginInput}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={signupPassword}
            onChangeText={setSignupPassword}
            secureTextEntry
          />
        </View>

        {/* Confirm Password Input */}
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="lock" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
          <TextInput
            style={styles.loginInput}
            placeholder="Confirm Password"
            placeholderTextColor="#9CA3AF"
            value={signupConfirmPassword}
            onChangeText={setSignupConfirmPassword}
            secureTextEntry
          />
        </View>

        {/* Signup Button */}
        <TouchableOpacity 
          onPress={handleSignup}
          style={styles.loginButton}
        >
          <Text style={styles.loginButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Footer - Back to Login */}
        <View style={styles.loginFooter}>
          <Text style={styles.loginFooterText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => setShowSignup(false)}>
            <Text style={styles.loginFooterLink}>Sign in here</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
  
  const renderFridge = () => (
    <LinearGradient colors={['#FEF3C7', '#FECACA', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <ScrollView contentContainerStyle={styles.contentContainer} style={{backgroundColor: 'transparent'}}>
      <Animated.View 
        style={[
          styles.loginContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
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
          onSubmitEditing={addIngredient}
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
      </Animated.View>
      </ScrollView>
    </LinearGradient>
  );

  const renderRecipes = () => (
    <LinearGradient colors={['#DBEAFE', '#FEE2E2', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <ScrollView contentContainerStyle={styles.contentContainer} style={{backgroundColor: 'transparent'}}>
      <Animated.View 
        style={[
          styles.loginContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
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
          <TouchableOpacity key={recipe.id} style={styles.card} onPress={() => setSelectedRecipe(recipe)}>
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

            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${recipe.matchPercentage}%`, backgroundColor: recipe.matchPercentage === 100 ? '#22C55E' : '#FB923C' }
                ]} 
              />
            </View>

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
          </TouchableOpacity>
        ))
      )}
      </Animated.View>
      </ScrollView>
    </LinearGradient>
  );

  const renderRecipeDetails = () => (
    <LinearGradient colors={['#E0E7FF', '#FEE2E2', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <ScrollView contentContainerStyle={styles.contentContainer} style={{backgroundColor: 'transparent'}}>
      <Animated.View 
        style={[
          styles.loginContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#F97316" />
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>{selectedRecipe.title}</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.iconBox}>
          <FontAwesome5 name={selectedRecipe.icon} size={48} color="#F97316" />
        </View>
        <Text style={styles.detailsRecipeMeta}>{selectedRecipe.time} • {selectedRecipe.difficulty}</Text>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${selectedRecipe.matchPercentage}%`, backgroundColor: selectedRecipe.matchPercentage === 100 ? '#22C55E' : '#FB923C' }
            ]} 
          />
        </View>
        <Text style={styles.matchBadgeText}>{Math.round(selectedRecipe.matchPercentage)}% Match</Text>
      </View>

      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>Ingredients You Have</Text>
        {selectedRecipe.have.map((ing, idx) => (
          <View key={idx} style={styles.ingredientItem}>
            <FontAwesome5 name="check-circle" size={16} color="#22C55E" />
            <Text style={styles.ingredientText}>{ing}</Text>
          </View>
        ))}
      </View>

      {selectedRecipe.missing.length > 0 && (
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>Missing Ingredients</Text>
          {selectedRecipe.missing.map((ing, idx) => (
            <View key={idx} style={styles.ingredientItem}>
              <FontAwesome5 name="times-circle" size={16} color="#EF4444" />
              <Text style={styles.ingredientTextMissing}>{ing}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.stepsSection}>
        <Text style={styles.sectionTitle}>Cooking Steps</Text>
        {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
          selectedRecipe.steps.map((step, idx) => (
            <View key={idx} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStepsText}>No steps available</Text>
        )}
      </View>
      </Animated.View>
      </ScrollView>
    </LinearGradient>
  );

  const renderRecipeOfDay = () => (
    <LinearGradient colors={['#D1FAE5', '#FEC2C2', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <ScrollView contentContainerStyle={styles.contentContainer} style={{backgroundColor: 'transparent'}}>
      <Animated.View 
        style={[
          styles.loginContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
      <View style={styles.recipeOfDayHeader}>
        <Text style={styles.sectionTitle}>Recipe of the Day</Text>
        <TouchableOpacity onPress={() => setActiveTab("fridge")}>
          <Text style={styles.editLink}>Back</Text>
        </TouchableOpacity>
      </View>

      {recipeOfDay ? (
        <>
          <View style={styles.recipeOfDayCard}>
            <View style={styles.iconBox}>
              <FontAwesome5 name={recipeOfDay.icon} size={56} color="#F97316" />
            </View>
            <Text style={styles.detailsTitle}>{recipeOfDay.title}</Text>
            <Text style={styles.detailsRecipeMeta}>{recipeOfDay.time} • {recipeOfDay.difficulty}</Text>
          </View>

          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipeOfDay.ingredients && recipeOfDay.ingredients.length > 0 ? (
              recipeOfDay.ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingredientItem}>
                  <FontAwesome5 name="check-circle" size={16} color="#F97316" />
                  <Text style={styles.ingredientText}>{ing}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noStepsText}>No ingredients available</Text>
            )}
          </View>

          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>Cooking Steps</Text>
            {recipeOfDay.steps && recipeOfDay.steps.length > 0 ? (
              recipeOfDay.steps.map((step, idx) => (
                <View key={idx} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noStepsText}>No steps available</Text>
            )}
          </View>
        </>
      ) : isLoading ? (
        <View style={styles.emptyStateResults}>
          <FontAwesome5 name="spinner" size={48} color="#F97316" />
          <Text style={styles.emptyText}>Loading your recipe...</Text>
        </View>
      ) : (
        <View style={styles.emptyStateResults}>
          <FontAwesome5 name="cookie-bite" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No recipe selected.</Text>
          <TouchableOpacity onPress={getRecipeOfDay}>
            <Text style={styles.editLink}>Get Recipe of the Day</Text>
          </TouchableOpacity>
        </View>
      )}
      </Animated.View>
      </ScrollView>
    </LinearGradient>
  );

  const renderProfile = () => (
    <LinearGradient colors={['#F3E8FF', '#FEE2E2', '#F9FAFB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}}>
      <BackgroundDecoration />
      <ScrollView contentContainerStyle={styles.contentContainer} style={{backgroundColor: 'transparent'}}>
      <Animated.View 
        style={[
          styles.loginContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
      <View style={styles.profileHeader}>
        <Text style={styles.sectionTitle}>Profile</Text>
      </View>

      {!showChangePassword ? (
        <>
          <View style={styles.profileCard}>
            <View style={styles.profileIconContainer}>
              <FontAwesome5 name="user-circle" size={64} color="#F97316" />
            </View>
            <Text style={styles.profileName}>{loggedInUserName || "User"}</Text>
            <Text style={styles.profileEmail}>{loggedInUserEmail}</Text>
          </View>

          <View style={styles.profileMenuSection}>
            <TouchableOpacity 
              style={styles.profileMenuItem}
              onPress={() => setShowChangePassword(true)}
            >
              <View style={styles.profileMenuIconContainer}>
                <FontAwesome5 name="lock" size={20} color="#F97316" />
              </View>
              <View style={styles.profileMenuContent}>
                <Text style={styles.profileMenuTitle}>Change Password</Text>
                <Text style={styles.profileMenuSubtitle}>Update your password</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.changePasswordContainer}>
            <View style={styles.backButtonContainer}>
              <TouchableOpacity 
                onPress={() => setShowChangePassword(false)}
                style={styles.backButton}
              >
                <FontAwesome5 name="arrow-left" size={18} color="#F97316" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.changePasswordTitle}>Change Password</Text>

            {/* Old Password */}
            <View style={styles.loginInputContainer}>
              <FontAwesome5 name="lock" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
              <TextInput
                style={styles.loginInput}
                placeholder="Current Password"
                placeholderTextColor="#9CA3AF"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
              />
            </View>

            {/* New Password */}
            <View style={styles.loginInputContainer}>
              <FontAwesome5 name="lock" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
              <TextInput
                style={styles.loginInput}
                placeholder="New Password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            {/* Confirm New Password */}
            <View style={styles.loginInputContainer}>
              <FontAwesome5 name="lock" size={18} color="#9CA3AF" style={styles.loginInputIcon} />
              <TextInput
                style={styles.loginInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#9CA3AF"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
              />
            </View>

            {/* Change Password Button */}
            <TouchableOpacity 
              onPress={handleChangePassword}
              style={styles.changePasswordButton}
            >
              <Text style={styles.changePasswordButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      </Animated.View>
      </ScrollView>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {successMessage ? (
        renderSuccess()
      ) : !isLoggedIn ? (
        showSignup ? renderSignup() : renderLogin()
      ) : (
        <>
          <View style={{flex: 1}}>
            {selectedRecipe ? (
              renderRecipeDetails()
            ) : activeTab === 'fridge' ? (
              renderFridge()
            ) : activeTab === 'recipe-of-day' ? (
              renderRecipeOfDay()
            ) : activeTab === 'profile' ? (
              renderProfile()
            ) : (
              renderRecipes()
            )}
          </View>
          {!selectedRecipe && (
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

          <TouchableOpacity 
            style={styles.tabItem} 
            onPress={getRecipeOfDay}
          >
            <FontAwesome5 name="star" size={20} color={activeTab === 'recipe-of-day' ? '#F97316' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'recipe-of-day' && styles.tabTextActive]}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => setActiveTab("profile")}
          >
            <FontAwesome5 name="user" size={20} color={activeTab === 'profile' ? '#F97316' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// STYLES raman aceleasi din codul tau original
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, 
  },
  // --- BACKGROUND DECORATION STYLES ---
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  panContainer: {
    position: 'absolute',
    opacity: 0.15,
  },
  panTopRight: {
    top: -20,
    right: -30,
  },
  foodContainer: {
    position: 'absolute',
    opacity: 0.12,
  },
  foodBottomLeft: {
    bottom: -10,
    left: -20,
  },
  decorContainer: {
    position: 'absolute',
    opacity: 0.1,
  },
  decorTopLeft: {
    top: 40,
    left: -10,
  },
  decorBottomRight: {
    bottom: 80,
    right: -15,
  },
  // --- END BACKGROUND STYLES ---
  // --- SUCCESS STYLES ---
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  successContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  successIconContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  successDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    marginHorizontal: 6,
  },
  successMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  successDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    width: '100%',
    maxWidth: 280,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  successDetailsLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  successDetailsValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 4,
  },
  // --- END SUCCESS STYLES ---
  // --- LOGIN STYLES ---
  loginContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  loginBrand: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    backgroundColor: '#FEF3C7',
    borderRadius: 50,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  loginTitleHighlight: {
    color: '#F97316',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  loginInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  loginInputIcon: {
    marginRight: 12,
  },
  loginInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
    width: '100%',
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginFooterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginFooterLink: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
  // --- END LOGIN STYLES ---
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
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  backButton: {
    marginRight: 16,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsRecipeMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  matchBadgeText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#F97316',
    marginTop: 8,
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },
  ingredientTextMissing: {
    marginLeft: 12,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  stepsSection: {
    marginBottom: 80,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  noStepsText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // --- RECIPE OF THE DAY STYLES ---
  recipeOfDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recipeOfDayCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // --- END RECIPE OF THE DAY STYLES ---
  // --- PROFILE STYLES ---
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIconContainer: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  profileMenuSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileMenuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileMenuContent: {
    flex: 1,
  },
  profileMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileMenuSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  changePasswordContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonContainer: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
    marginLeft: 8,
  },
  changePasswordTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  changePasswordButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  // --- END PROFILE STYLES ---
});