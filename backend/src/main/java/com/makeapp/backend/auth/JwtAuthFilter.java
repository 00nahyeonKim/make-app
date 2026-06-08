package com.makeapp.backend.auth;

import com.makeapp.backend.exception.CustomException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null) {
            try {
                jwtProvider.validate(token);
                if (jwtProvider.isGuest(token)) {
                    // 게스트 JWT: principal = participantId, 권한 = ROLE_GUEST
                    Long participantId = jwtProvider.getParticipantId(token);
                    var auth = new UsernamePasswordAuthenticationToken(
                            participantId, null,
                            List.of(new SimpleGrantedAuthority("ROLE_GUEST")));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    // 소셜 로그인 JWT: principal = userId
                    Long userId = jwtProvider.getUserId(token);
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (CustomException e) {
                // 만료/유효하지 않은 토큰 → 인증 없이 통과, Spring Security가 401 처리
            }
        }
        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        // 1순위: Authorization 헤더 (Bearer 토큰 — Postman 테스트, 소셜 로그인)
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7); // return되면 메서드 끝. 다음 if문 실행 안함.
        }
        // 2순위: HttpOnly Cookie (브라우저 자동 전송) - JS에서 접근 자체가 차단됨, HTTP 요청/응답으로만 전송
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
