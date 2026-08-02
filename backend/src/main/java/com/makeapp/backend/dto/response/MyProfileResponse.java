package com.makeapp.backend.dto.response;

import com.makeapp.backend.entity.User;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyProfileResponse {

    private Long id;
    private String kakaoNickname;
    private String nickname;
    private String displayName; // 화면에 실제로 표시할 최종 닉네임

    public static MyProfileResponse of(User user) {
        return MyProfileResponse.builder()
                .id(user.getId())
                .kakaoNickname(user.getKakaoNickname())
                .nickname(user.getNickname())
                .displayName(user.getDisplayName())
                .build();
    }
}
