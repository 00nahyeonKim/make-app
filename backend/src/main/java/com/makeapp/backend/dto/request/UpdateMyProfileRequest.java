package com.makeapp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor // 기본 생성자 자동 생성
public class UpdateMyProfileRequest {

    @NotBlank(message = "닉네임을 입력해주세요")
    @Size(min = 2, max = 50, message = "닉네임은 2자 이상 20자 이하로 입력해주세요")
    private String nickname;
}
