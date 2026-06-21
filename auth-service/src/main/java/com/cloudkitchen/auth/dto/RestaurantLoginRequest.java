package com.cloudkitchen.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RestaurantLoginRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String password;
}
