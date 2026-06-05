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

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessExpiration;
    private final long refreshExpiration;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration}") long accessExpiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpiration = accessExpiration;
        this.refreshExpiration = refreshExpiration;
    }

    public String createAccessToken(Long userId) {
        return createToken(String.valueOf(userId), accessExpiration, null, null);
    }

    public String createRefreshToken(Long userId) {
        return createToken(String.valueOf(userId), refreshExpiration, null, null);
    }

    // 게스트용 JWT: subject=participantId, claim에 meetingId와 role="GUEST" 포함
    public String createGuestToken(Long participantId, Long meetingId) {
        return createToken(String.valueOf(participantId), accessExpiration, meetingId, "GUEST");
    }

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

    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public Long getParticipantId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public Long getMeetingId(String token) {
        return parseClaims(token).get("meetingId", Long.class);
    }

    public boolean isGuest(String token) {
        return "GUEST".equals(parseClaims(token).get("role", String.class));
    }

    // 예외 대신 boolean 반환 (refreshToken 유효성 사전 체크용)
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public void validate(String token) {
        try {
            parseClaims(token);
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.EXPIRED_TOKEN);
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
