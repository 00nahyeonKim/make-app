package com.makeapp.backend.controller;

import com.makeapp.backend.auth.JwtProvider;
import com.makeapp.backend.common.ApiResponse;
import com.makeapp.backend.dto.request.GuestLoginRequest;
import com.makeapp.backend.dto.request.GuestRegisterRequest;
import com.makeapp.backend.dto.request.KakaoCallbackRequest;
import com.makeapp.backend.dto.response.AuthResponse;
import com.makeapp.backend.dto.response.ParticipantResponse;
import com.makeapp.backend.entity.Participant;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.service.AuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refresh(
            HttpServletRequest request,                      // 쿠키를 읽기 위해 요청 객체를 받음
            HttpServletResponse response) {
        // 요청 쿠키들 중 "refresh_token"을 찾아 값만 꺼냄 (없으면 401)
        String refreshToken = Arrays.stream(request.getCookies() != null ? request.getCookies() : new Cookie[0])
                .filter(c -> "refresh_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));
        String newToken = authService.refreshAccessToken(refreshToken);  // 새 access token 발급
        addCookie(response, "access_token", newToken, 3600);             // 새 토큰으로 쿠키 갱신
        return ResponseEntity.ok(ApiResponse.ok(Map.of("accessToken", newToken)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        addCookie(response, "access_token", "", 0);      // 같은 이름 쿠키를 빈 값+수명0으로 덮어써 삭제
        addCookie(response, "refresh_token", "", 0);
        return ResponseEntity.noContent().build();       // 204 No Content (응답 본문 없음)
    }

    @PostMapping("/guest/register")
    public ResponseEntity<ApiResponse<ParticipantResponse>> guestRegister(
            @RequestBody @Valid GuestRegisterRequest request,
            HttpServletResponse response) {
    Participant p = authService.guestRegister(
            request.getInviteToken(), request.getDisplayName(), request.getPin());
        String token = jwtProvider.createGuestToken(p.getId(), p.getMeeting().getId());
        addCookie(response, "access_token", token, 3600);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(ParticipantResponse.of(p)));
    }
    
    @PostMapping("/guest/login")
    public ResponseEntity<ApiResponse<ParticipantResponse>> guestLogin (
        @RequestBody @Valid GuestLoginRequest request,
        HttpServletResponse response) {
            Participant p = authService.guestLogin(
                request.getInviteToken(), request.getDisplayName(), request.getPin());
            String token = jwtProvider.createGuestToken(p.getId(), p.getMeeting().getId());
            addCookie(response, "access_token", token, 3600);
            return ResponseEntity.ok(ApiResponse.ok(ParticipantResponse.of(p)));
    }
}