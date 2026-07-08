package com.makeapp.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.makeapp.backend.common.ApiResponse;
import com.makeapp.backend.dto.request.ParticipantJoinRequest;
import com.makeapp.backend.dto.response.ParticipantResponse;
import com.makeapp.backend.service.ParticipantService;

import lombok.RequiredArgsConstructor;

@RestController // REST API를 만들기 위해 메서드의 반환값을 자동으로 JSON으로 변환 후 HTTP 응답 본문(Response Body)에 담아 클라이언트에 전달
@RequestMapping("/api/meetings/{inviteToken}/participants")
@RequiredArgsConstructor // final 필드 생성자 주입
public class ParticipantController {

    private final ParticipantService participantService;

    // 소셜 로그인 회원 참가용. 게스트는 POST /api/auth/guest/register 사용.
    // 흐름:
    //   1차 요청: request body 없이 호출 → 카카오 닉네임으로 참가 시도
    //   닉네임 충돌(DISPLAY_NAME_TAKEN 409): 프론트가 별칭 입력 모달 표시
    //   2차 요청: { "displayName": "새별칭" } 을 body에 담아 재호출 → 별칭으로 참가
    @PostMapping
    public ResponseEntity<ApiResponse<ParticipantResponse>> join(
            @PathVariable String inviteToken, // URL의 {inviteToken} 값
            @RequestBody(required = false) ParticipantJoinRequest request, // null 허용: 1차 요청 시 body 없음
            Authentication auth) {
        Long userId = (auth != null && auth.isAuthenticated()) ? (Long) auth.getPrincipal() : null; // 비인증 시 null → 서비스에서 UNAUTHORIZED 처리
        String customDisplayName = (request != null) ? request.getDisplayName() : null; // null이면 서비스에서 카카오 닉네임 사용
        return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.ok(participantService.join(inviteToken, userId, customDisplayName)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll( // findAll()이 반환하는 값이 단일 타입이 아닌 3가지가 섞인 구조이기 때문에 Map<String, Object> 사용
            @PathVariable String inviteToken) {
        return ResponseEntity.ok(ApiResponse.ok(participantService.findAll(inviteToken)));
    }

    // 내 참가 정보 조회
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findMe(
            @PathVariable String inviteToken,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(
                participantService.findMe(inviteToken, auth)));
    }
}
