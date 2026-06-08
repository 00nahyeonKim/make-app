package com.makeapp.backend.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;

@Component                                       // 스프링이 관리하는 빈으로 등록 (다른 곳에서 주입받아 사용)
public class JwtProvider {

    private final SecretKey key;                 // 토큰 서명/검증에 쓰는 비밀 키 (서버만 앎)
    private final long accessExpiration;         // access token 수명 (ms)
    private final long refreshExpiration;        // refresh token 수명 (ms)

    // application.yaml의 jwt.* 설정값을 생성자로 주입받아 초기화
    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration}") long accessExpiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));  // 문자열 비밀키 → 서명 키 객체
        this.accessExpiration = accessExpiration;
        this.refreshExpiration = refreshExpiration;
    }

    // 회원용 access token 발급 (subject = userId)
    public String createAccessToken(Long userId) {
        return createToken(String.valueOf(userId), accessExpiration, null, null);
    }

    // 회원용 refresh token 발급 (수명만 더 긺)
    public String createRefreshToken(Long userId) {
        return createToken(String.valueOf(userId), refreshExpiration, null, null);
    }

    // 게스트용 JWT: subject=participantId, claim에 meetingId와 role="GUEST" 포함
    public String createGuestToken(Long participantId, Long meetingId) {
        return createToken(String.valueOf(participantId), accessExpiration, meetingId, "GUEST");
    }

    // 실제 토큰을 만드는 공통 메서드
    private String createToken(String subject, long expiration, Long meetingId, String role) {
        Date now = new Date();
        var builder = Jwts.builder()
                .subject(subject)                        // 토큰 주인 식별값 (userId 또는 participantId)
                .issuedAt(now)                           // 발급 시각
                .expiration(new Date(now.getTime() + expiration));  // 만료 시각 = 지금 + 수명
        if (meetingId != null) builder.claim("meetingId", meetingId);  // 게스트일 때만 추가 정보 담음
        if (role != null) builder.claim("role", role);
        return builder.signWith(key).compact();          // 비밀 키로 서명 후 문자열로 압축 → 위조 불가
    }

    // 토큰에서 userId 꺼내기 (subject를 숫자로 변환)
    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    // 토큰에서 participantId 꺼내기 (게스트 토큰용, subject 위치는 동일)
    public Long getParticipantId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    // 게스트 토큰에 담긴 meetingId 꺼내기
    public Long getMeetingId(String token) {
        return parseClaims(token).get("meetingId", Long.class);
    }

    // role claim이 "GUEST"이면 게스트 토큰으로 판단
    public boolean isGuest(String token) {
        return "GUEST".equals(parseClaims(token).get("role", String.class));
    }

    // 예외 대신 boolean 반환 (refreshToken 유효성 사전 체크용)
    public boolean isValid(String token) {
        try {
            parseClaims(token);                  // 파싱/검증 성공하면 유효
            return true;
        } catch (JwtException e) {
            return false;                        // 만료/위조 등 문제 있으면 false
        }
    }

    // 토큰을 검증하고, 문제가 있으면 예외를 던짐 (필터에서 사용)
    public void validate(String token) {
        try {
            parseClaims(token);
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.EXPIRED_TOKEN);   // 만료됨 → 재발급 유도
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);   // 위조/형식 오류 → 재로그인 유도
        }
    }

    // 서명을 검증하고 토큰 안의 정보(Claims)를 꺼냄. 검증 실패 시 JwtException 발생
    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)                     // 우리 비밀 키로 서명이 맞는지 확인
            .build()
            .parseSignedClaims(token) // 서명 검증 수행, 만료 시각 확인, 실패 시 예외 발생 - jjwt 라이브러리가 만들어놓은 메서드
            .getPayload();
    }
}