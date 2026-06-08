package com.makeapp.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 최초 로그인 시에만 사용되는 DTO
@Getter
@AllArgsConstructor // 모든 필드를 받는 생성자 자동 생성 - 이 클래스는 JPA Entity가 아니라 응답 DTO라서 기본 생성자가 필요 없음. 항상 값을 채워서 생성하기 때문
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private UserInfo user;

    @Getter
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String name;
    }
}
