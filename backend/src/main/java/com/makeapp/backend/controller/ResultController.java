package com.makeapp.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.makeapp.backend.common.ApiResponse;
import com.makeapp.backend.service.ResultService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/meetings/{inviteToken}/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResults(
            @PathVariable String inviteToken,
            @RequestParam(defaultValue = "recommend") String sort) {
        return ResponseEntity.ok(ApiResponse.ok(resultService.getResults(inviteToken, sort)));
    }
}