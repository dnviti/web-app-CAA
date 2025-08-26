package token

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// GenerateToken generates a JWT token for the given user ID
func GenerateToken(userID uint) (string, error) {
	tokenLifespan, err := getTokenLifespan()
	if err != nil {
		return "", err
	}

	claims := jwt.MapClaims{}
	claims["authorized"] = true
	claims["user_id"] = userID
	claims["exp"] = time.Now().Add(time.Hour * time.Duration(tokenLifespan)).Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(getAPISecret()))
}

// TokenValid validates the JWT token
func TokenValid(c *gin.Context) error {
	tokenString := ExtractToken(c)
	_, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(getAPISecret()), nil
	})
	if err != nil {
		return err
	}
	return nil
}

// ExtractToken extracts the JWT token from the request
func ExtractToken(c *gin.Context) string {
	token := c.Query("token")
	if token != "" {
		return token
	}

	bearerToken := c.Request.Header.Get("Authorization")
	if len(strings.Split(bearerToken, " ")) == 2 {
		return strings.Split(bearerToken, " ")[1]
	}
	return ""
}

// ExtractTokenID extracts the user ID from the JWT token
func ExtractTokenID(c *gin.Context) (uint, error) {
	tokenString := ExtractToken(c)
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(getAPISecret()), nil
	})
	if err != nil {
		return 0, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if ok && token.Valid {
		uid, err := strconv.ParseUint(fmt.Sprintf("%.0f", claims["user_id"]), 10, 32)
		if err != nil {
			return 0, err
		}
		return uint(uid), nil
	}
	return 0, nil
}

// getAPISecret gets the API secret from environment variables
func getAPISecret() string {
	apiSecret := os.Getenv("API_SECRET")
	if apiSecret == "" {
		// Fallback to JWT_SECRET for backwards compatibility
		apiSecret = os.Getenv("JWT_SECRET")
		if apiSecret == "" {
			log.Println("Warning: No API_SECRET or JWT_SECRET set, using default secret")
			return "your-default-secret-key"
		}
	}
	return apiSecret
}

// getTokenLifespan gets the token lifespan from environment variables
func getTokenLifespan() (int, error) {
	lifespanStr := os.Getenv("TOKEN_HOUR_LIFESPAN")
	if lifespanStr == "" {
		return 1, nil // Default to 1 hour
	}

	lifespan, err := strconv.Atoi(lifespanStr)
	if err != nil {
		return 0, fmt.Errorf("invalid TOKEN_HOUR_LIFESPAN: %v", err)
	}

	return lifespan, nil
}
