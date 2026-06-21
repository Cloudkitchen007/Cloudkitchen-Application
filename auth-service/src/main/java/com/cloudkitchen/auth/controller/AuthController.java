package com.cloudkitchen.auth.controller;

import com.cloudkitchen.auth.dto.*;
import com.cloudkitchen.auth.service.CognitoAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CognitoAuthService cognitoAuthService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("ok", "Auth service is running"));
    }

    @PostMapping("/user/register")
    public ResponseEntity<ApiResponse<Void>> registerUser(@Valid @RequestBody UserRegisterRequest req) {
        cognitoAuthService.registerUser(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "User registered successfully"));
    }

    @PostMapping("/user/login")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> loginUser(@Valid @RequestBody UserLoginRequest req) {
        AuthTokenResponse tokens = cognitoAuthService.loginUser(req);
        return ResponseEntity.ok(ApiResponse.success(tokens, "Login successful"));
    }

    @PostMapping("/restaurant/register")
    public ResponseEntity<ApiResponse<Void>> registerRestaurant(@Valid @RequestBody RestaurantRegisterRequest req) {
        cognitoAuthService.registerRestaurant(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Restaurant registered successfully"));
    }

    @PostMapping("/restaurant/login")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> loginRestaurant(@Valid @RequestBody RestaurantLoginRequest req) {
        AuthTokenResponse tokens = cognitoAuthService.loginRestaurant(req);
        return ResponseEntity.ok(ApiResponse.success(tokens, "Login successful"));
    }
}
