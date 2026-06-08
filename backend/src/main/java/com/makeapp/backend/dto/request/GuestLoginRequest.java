package com.makeapp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 기존 비회원 참가자가 다른 기기에서 재접속할 때 사용.
@Getter
@NoArgsConstructor
public class GuestLoginRequest {

    @NotBlank(message = "유효하지 않은 초대 링크입니다.")
    private String inviteToken;

    @NotBlank(message = "닉네임을 입력해주세요.")
    private String displayName;

    @NotBlank(message = "PIN을 입력해주세요.")
    @Pattern(regexp = "\\d{4}", message = "PIN은 숫자 4자리여야 합니다.")
    private String pin;
}
