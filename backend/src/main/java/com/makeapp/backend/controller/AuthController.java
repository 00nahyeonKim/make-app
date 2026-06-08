package com.makeapp.backend.controller;

import com.makeapp.backend.auth.JwtProvider;
import com.makeapp.backend.common.ApiResponse;
import com.makeapp.backend.dto.request.KakaoCallbackRequest;
import com.makeapp.backend.dto.response.AuthResponse;
import com.makeapp.backend.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProvider jwtProvider;

    @PostMapping("/kakao/callback")              // POST /api/auth/kakao/callback
    public ResponseEntity<ApiResponse<AuthResponse>> kakaoCallback(
            @RequestBody @Valid KakaoCallbackRequest request,  // 요청 본문을 객체로 변환 + @Valid 검증
            HttpServletResponse response) {                    // 응답에 쿠키를 달기 위해 받음
        AuthResponse authResponse = authService.kakaoLogin(request.getCode());  // 로그인 로직은 서비스에 위임
        addCookie(response, "access_token", authResponse.getAccessToken(), 3600);        // 1시간짜리 쿠키
        addCookie(response, "refresh_token", authResponse.getRefreshToken(), 604800);    // 7일짜리 쿠키
        return ResponseEntity.ok(ApiResponse.ok(authResponse));                 // 200 OK + 통일된 응답 포맷
    }

    // 토큰을 HttpOnly 쿠키로 만들어 응답 헤더에 추가하는 공통 헬퍼
    private void addCookie(HttpServletResponse response, String name, String token, long maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, token)
                .httpOnly(true)                  // JS에서 접근 불가 (XSS로부터 토큰 보호)
                .path("/")                       // 모든 경로 요청에 쿠키 전송
                .sameSite("Lax")                 // 교차 사이트 요청에 쿠키 제한 (CSRF 완화)
                .maxAge(maxAge)                  // 쿠키 수명(초). 0이면 즉시 삭제
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}