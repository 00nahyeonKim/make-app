package com.makeapp.backend.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor // 기본 생성자 자동 생성
public class ParticipantJoinRequest {

    private String displayName; // null이면 카카오 닉네임 사용, 충돌 시 프론트가 값을 채워 재요청
}
