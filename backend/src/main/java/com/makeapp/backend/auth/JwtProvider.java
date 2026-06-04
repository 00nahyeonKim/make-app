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
            // @Value 어노테이션 - Spring이 application.yml(또는 .properties)의 값을 자동으로 주입해주는 어노테이션
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration}") long accessExpiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); // 문자열을 바이트 배열로 변환 후 HMAC-SHA 알고리즘(암호화)용 SerectKey 객체로 만듦
        this.accessExpiration = accessExpiration;
        this.refreshExpiration = refreshExpiration;
        }

    // JWT는 eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fwpMeJf36P
    //            헤더                    페이로드             서명
    // 처럼 점(.)으로 구분된 문자열이므로 반환값이 String
    public String createAccessToken(Long userId) {
        return createToken(userId, accessExpiration);
    }

    public String createToken(Long userId) {
        return createToken(userId, refreshExpiration);
    }

    private String createToken(Long userId, long expiration) {
        Date now = new Date();
        // jjwt 라이브러리의 빌더 패턴 시작
        // 클레임(claim) - JWT 페이로드에 담기는 key-value 형태의 정보 조각
        return Jwts.builder()
                .subject(String.valueOf(userId)) // JWT 클레임은 문자열만 받기 때문에 Long인 userId를 String.valueOf()로 변환
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key)
                .compact(); // 최종적으로 String 반환
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject()); // JWT 문자열을 분해 후 Claims 객체에서 sub 클래임 값을 꺼내고 String -> Long으로 복원
    }

    public void validate(String token) { // 유효한 토큰인지 검증 및 에러 던짐
        try {
            parseClaims(token);
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.EXPIRED_TOKEN);
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }

    // 점(.)을 기준으로 세 부분으로 분리 -> 서명 검증 -> 페이로드 Base64 디코딩 -> Claims 객체로 변환
    private Claims parseClaims(String token) {
        return Jwts.parser() // JWT 파서를 만들기 위한 빌더 객체 생성
            .verifyWith(key) // 파서에 어떤 키를 사용하는지 알려줌
            .build() // 파서 객체 완성 -> 이제부터 파싱 가능
            .parseSignedClaims(token) // 토큰을 점(.)으로 분리 -> 서명 검증 -> 만료 검증 -> 페이로드 파싱(Claims 객체 반환)
            .getPayload(); // Claims 객체에서 헤더 정보, 서명 정보는 제외하고 페이로드만 꺼냄
    }

/*   소문자 claim - 개별 클레임(key-value 쌍 하나하나)

    {
    "sub": "123",       ← 이게 클레임 하나
    "iat": 1717123200,  ← 이게 클레임 하나
    "exp": 1717126800   ← 이게 클레임 하나
    }
    
    대문자 Claims - 클레임 객체(개별 클레임들을 모두 담고 있는 컨테이너 객체)

    {
    "sub": "123",
    "iat": 1717123200,
    "exp": 1717126800
    } */
}
