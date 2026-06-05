package com.makeapp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class KakaoCallbackRequest {

    @NotBlank(message = "인가 코드를 입력해주세요.")
    private String code;
}
