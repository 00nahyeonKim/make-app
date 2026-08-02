package com.makeapp.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.makeapp.backend.common.ApiResponse;
import com.makeapp.backend.dto.request.UpdateMyProfileRequest;
import com.makeapp.backend.dto.response.MyProfileResponse;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.service.MyService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/my")
@RequiredArgsConstructor
public class MyController {

    private final MyService myService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<MyProfileResponse>> getProfile(
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                myService.getProfile(memberId(authentication))));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<MyProfileResponse>> updateProfile(
            @RequestBody @Valid UpdateMyProfileRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                myService.updateNickname(
                        memberId(authentication),
                        request.getNickname())));
    }

    private Long memberId(Authentication authentication) {
        boolean guest = authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        "ROLE_GUEST".equals(authority.getAuthority()));

        if (guest) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        return (Long) authentication.getPrincipal();
    }
}
