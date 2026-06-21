package com.cloudkitchen.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthTokenResponse {
    private String accessToken;
    private String idToken;
    private String refreshToken;
    private String tokenType;
}
