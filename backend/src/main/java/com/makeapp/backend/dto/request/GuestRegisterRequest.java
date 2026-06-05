package com.makeapp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 비회원이 처음 모임에 참가할 때 사용.
@Getter
@NoArgsConstructor // 기본 생성자 자동 생성
public class GuestRegisterRequest {

    @NotBlank(message = "초대 토큰을 입력해주세요")
    private String inviteToken;

    @NotBlank(message = "닉네임을 입력해주세요")
    @Size(max = 50, message = "닉네임은 최대 50자입니다.")
    private String displayName;

    @NotBlank(message = "PIN을 입력해주세요.")
    @Pattern(regexp = "\\d{4}", message = "PIN은 숫자 4자리여야 합니다.")
    private String pin;
}
