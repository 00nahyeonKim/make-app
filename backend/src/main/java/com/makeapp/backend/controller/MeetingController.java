package com.makeapp.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.makeapp.backend.common.ApiResponse;
import com.makeapp.backend.dto.request.MeetingCreateRequest;
import com.makeapp.backend.dto.response.MeetingCreateResponse;
import com.makeapp.backend.dto.response.MeetingDetailResponse;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.service.MeetingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor // final 필드 생성자 주입
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping
    public ResponseEntity<ApiResponse<MeetingCreateResponse>> create(
            @RequestBody @Valid MeetingCreateRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(meetingService.create(getLoginUserId(auth), request)));
    }

    private Long getLoginUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        return (Long) auth.getPrincipal(); // getPrincipal()의 반환 타입은 Object라 Long으로 강제 형변환 필요 - JWT 필터에서 principal에 userId를 넣어 둠
    }

    @GetMapping("/invite/{inviteToken}")
    public ResponseEntity<ApiResponse<MeetingDetailResponse>> findByInviteToken(
        @PathVariable String inviteToken) {
            return ResponseEntity.ok(ApiResponse.ok(meetingService.findByInviteToken(inviteToken)));
        }

    @GetMapping("/result/{resultToken}")
    public ResponseEntity<ApiResponse<MeetingDetailResponse>> findByResultToken(
        @PathVariable String resultToken) {
            return ResponseEntity.ok(ApiResponse.ok(meetingService.findByResultToken(resultToken)));
        }
}
