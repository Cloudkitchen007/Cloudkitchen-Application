package com.cloudkitchen.auth.service;

import com.cloudkitchen.auth.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.Map;

@Service
@Slf4j
public class CognitoAuthService {

    private final CognitoIdentityProviderClient cognito;

    @Value("${cognito.user-pool-id}")
    private String userPoolId;

    @Value("${cognito.user-client-id}")
    private String userClientId;

    @Value("${cognito.restaurant-pool-id}")
    private String restaurantPoolId;

    @Value("${cognito.restaurant-client-id}")
    private String restaurantClientId;

    public CognitoAuthService(@Value("${aws.region}") String region) {
        this.cognito = CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .build();
    }

    public void registerUser(UserRegisterRequest req) {
        try {
            cognito.signUp(SignUpRequest.builder()
                    .clientId(userClientId)
                    .username(req.getEmail())
                    .password(req.getPassword())
                    .userAttributes(
                            AttributeType.builder().name("email").value(req.getEmail()).build(),
                            AttributeType.builder().name("name").value(req.getName()).build()
                    )
                    .build());

            cognito.adminConfirmSignUp(AdminConfirmSignUpRequest.builder()
                    .userPoolId(userPoolId)
                    .username(req.getEmail())
                    .build());

            log.info("User registered: {}", req.getEmail());

        } catch (UsernameExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");
        } catch (CognitoIdentityProviderException e) {
            log.error("Cognito error during user registration: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.awsErrorDetails().errorMessage());
        }
    }

    public AuthTokenResponse loginUser(UserLoginRequest req) {
        return initiateAuth(req.getEmail(), req.getPassword(), userClientId);
    }

    public void registerRestaurant(RestaurantRegisterRequest req) {
        try {
            cognito.signUp(SignUpRequest.builder()
                    .clientId(restaurantClientId)
                    .username(req.getEmail())
                    .password(req.getPassword())
                    .userAttributes(
                            AttributeType.builder().name("email").value(req.getEmail()).build(),
                            AttributeType.builder().name("name").value(req.getOwnerName()).build(),
                            AttributeType.builder().name("custom:restaurant_name").value(req.getRestaurantName()).build()
                    )
                    .build());

            cognito.adminConfirmSignUp(AdminConfirmSignUpRequest.builder()
                    .userPoolId(restaurantPoolId)
                    .username(req.getEmail())
                    .build());

            log.info("Restaurant registered: {}", req.getEmail());

        } catch (UsernameExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Restaurant already exists");
        } catch (CognitoIdentityProviderException e) {
            log.error("Cognito error during restaurant registration: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.awsErrorDetails().errorMessage());
        }
    }

    public AuthTokenResponse loginRestaurant(RestaurantLoginRequest req) {
        return initiateAuth(req.getEmail(), req.getPassword(), restaurantClientId);
    }

    private AuthTokenResponse initiateAuth(String email, String password, String clientId) {
        try {
            InitiateAuthResponse resp = cognito.initiateAuth(InitiateAuthRequest.builder()
                    .clientId(clientId)
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .authParameters(Map.of(
                            "USERNAME", email,
                            "PASSWORD", password
                    ))
                    .build());

            AuthenticationResultType tokens = resp.authenticationResult();
            return AuthTokenResponse.builder()
                    .accessToken(tokens.accessToken())
                    .idToken(tokens.idToken())
                    .refreshToken(tokens.refreshToken())
                    .tokenType("Bearer")
                    .build();

        } catch (NotAuthorizedException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        } catch (CognitoIdentityProviderException e) {
            log.error("Cognito auth error: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.awsErrorDetails().errorMessage());
        }
    }
}
