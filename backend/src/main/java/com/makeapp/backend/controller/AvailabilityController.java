package com.makeapp.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.makeapp.backend.common.ApiResponse;
import com.makeapp.backend.dto.request.AvailabilitySubmitRequest;
import com.makeapp.backend.service.AvailabilityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/meetings/{inviteToken}/availabilities")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PutMapping
    public ResponseEntity<ApiResponse<Map<String, Integer>>> upsert(
            @PathVariable String inviteToken,
            @RequestBody @Valid AvailabilitySubmitRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(availabilityService.upsert(inviteToken, request, auth)));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Map<String, String>>> submit(
            @PathVariable String inviteToken,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(availabilityService.submit(inviteToken, auth)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAvailabilities(
            @PathVariable String inviteToken) {
        return ResponseEntity.ok(ApiResponse.ok(availabilityService.getAvailabilities(inviteToken)));
    }
}
