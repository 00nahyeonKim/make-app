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

/**
 * JWT 토큰 생성·검증을 담당하는 컴포넌트.
 *
 * 토큰 종류
 *  - Access Token  : 일반 회원(subject = userId)
 *  - Refresh Token : 일반 회원 토큰 재발급용(subject = userId)
 *  - Guest Token   : 비회원(subject = participantId, claim에 meetingId·role="GUEST" 포함)
 */
@Component
public class JwtProvider {

    private final SecretKey key;          // HMAC-SHA 서명 키
    private final long accessExpiration;  // Access Token 유효 시간 (ms)
    private final long refreshExpiration; // Refresh Token 유효 시간 (ms)

    // application.yml의 jwt.* 값을 주입받아 서명 키와 만료 시간을 초기화
    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration}") long accessExpiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpiration = accessExpiration;
        this.refreshExpiration = refreshExpiration;
    }

    // ── 토큰 생성 ────────────────────────────────────────────────

    /** 일반 회원용 Access Token 발급 (subject = userId) */
    public String createAccessToken(Long userId) {
        return createToken(String.valueOf(userId), accessExpiration, null, null);
    }

    /** 일반 회원용 Refresh Token 발급 (subject = userId) */
    public String createRefreshToken(Long userId) {
        return createToken(String.valueOf(userId), refreshExpiration, null, null);
    }

    /**
     * 비회원용 Guest Token 발급.
     * subject = participantId, claim: meetingId·role="GUEST"
     * 비회원은 특정 미팅에만 접근 가능하므로 meetingId를 토큰에 내장.
     */
    public String createGuestToken(Long participantId, Long meetingId) {
        return createToken(String.valueOf(participantId), accessExpiration, meetingId, "GUEST");
    }

    /**
     * 실제 JWT를 만드는 내부 메서드.
     * meetingId·role은 게스트 전용이므로 null이면 claim을 추가하지 않음.
     */
    private String createToken(String subject, long expiration, Long meetingId, String role) {
        Date now = new Date();
        var builder = Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration));
        if (meetingId != null) builder.claim("meetingId", meetingId);
        if (role != null) builder.claim("role", role);
        return builder.signWith(key).compact();
    }

    // ── Claim 추출 ────────────────────────────────────────────────

    /** Access/Refresh Token에서 userId 추출 */
    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    /** Guest Token에서 participantId 추출 (subject 위치가 동일) */
    public Long getParticipantId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    /** Guest Token에서 meetingId 추출 */
    public Long getMeetingId(String token) {
        return parseClaims(token).get("meetingId", Long.class);
    }

    /** role claim이 "GUEST"이면 비회원 토큰으로 판단 */
    public boolean isGuest(String token) {
        return "GUEST".equals(parseClaims(token).get("role", String.class));
    }

    // ── 토큰 검증 ────────────────────────────────────────────────

    /**
     * 토큰 유효 여부를 boolean으로 반환 (예외를 던지지 않음).
     * Refresh Token 재발급 요청 전 사전 체크에 사용.
     */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * 토큰을 검증하고 문제가 있으면 CustomException을 던짐.
     * 필터·인터셉터에서 요청마다 호출되는 엄격한 검증용.
     *  - 만료 → EXPIRED_TOKEN
     *  - 위변조·형식 오류 → INVALID_TOKEN
     */
    public void validate(String token) {
        try {
            parseClaims(token);
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.EXPIRED_TOKEN);
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }

    // ── 내부 파싱 ────────────────────────────────────────────────

    /** 서명을 검증한 뒤 Claims(payload)를 파싱해 반환. 실패 시 JwtException 계열 예외 발생. */
    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
