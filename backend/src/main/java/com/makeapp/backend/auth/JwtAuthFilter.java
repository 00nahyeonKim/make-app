package com.makeapp.backend.auth;

import com.makeapp.backend.exception.CustomException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component // Spring Bean으로 등록
@RequiredArgsConstructor // final 필드인 jwtProvider를 생성자 주입
// 언제 검증하고 어디에 저장하는가에 대한 클래스
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override // OncePerRequestFilter 내부의 추상 메서드를 오버라이딩
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null) {
            try {
                jwtProvider.validate(token);
                Long userId = jwtProvider.getUserId(token);
                var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (CustomException e) {
                // 만료/유효하지 않은 토큰 → 인증 없이 통과, Spring Security가 401 처리
            }
        }
        filterChain.doFilter(request, response);
    }

    // HTTP 요청 헤더에서 JWT 토큰 문자열만 추출하는 메서드 - HTTP 요청 헤더란? -> 클라이언트가 서버에 요청을 보낼 때 본문(body) 외에 부가 정보를 담는 곳
    private String resolveToken(HttpServletRequest request) { // HttpServletRequest - 클라이언트가 보낸 HTTP 요청을 Java 객체로 포장한 것
        String bearer = request.getHeader("Authorization"); // HTTP 요청에서 Authorization 헤더 값을 꺼냄. ex) Bearer eyJhbGci....
        if (bearer != null && bearer.startsWith("Bearer ")) { // Bearer은 소지자라는 뜻. 즉 아이디 비밀번호 방식도 아닌 토큰 방식이라는 것
            return bearer.substring(7); // Bearer 뒤부터 읽어와야함
        }
        return null;
    }
}
