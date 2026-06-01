package com.makeapp.backend.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor // enum 상수에 넣은 값(status, code, message)을 final 필드에 저장할 생성자를 자동 생성하려고 사용
public enum ErrorCode {

    // 인증
    KAKAO_AUTH_FAILED(401, "KAKAO_AUTH_FAILED", "카카오 인증에 실패했습니다."),
    UNAUTHORIZED(401, "UNAUTHORIZED", "로그인이 필요합니다."),
    INVALID_TOKEN(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다."),
    FORBIDDEN(403, "FORBIDDEN", "권한이 없습니다."), // 본인 모임이 아닌데 수정/삭제 시도할 때

    //모임
    MEETING_NOT_FOUND(404, "MEETING_NOT_FOUND", "모임을 찾을 수 없습니다."),
    MEETING_ALREADY_CONFIRMED(409, "MEETING_ALREADY_CONFIRMED", "이미 확정된 모임입니다."),
    MEETING_EXPIRED(410, "MEETING_EXPIRED", "만료된 모임입니다."),
    INVALID_SLOT(400, "INVALID_SLOT", "유효하지 않은 시간 슬롯입니다."),

    // 참가자
    PARTICIPANT_NOT_FOUND(404, "PARTICIPANT_NOT_FOUND", "참가자 정보를 찾을 수 없습니다."),
    DUPLICATED_PARTICIPATION(409, "DUPLICATED_PARTICIPATION", "이미 참가 중인 모임입니다."),

    // 공통
    INVALID_REQUEST(400, "INVALID_REQUEST", "잘못된 요청입니다");
    
    private final int status;
    private final String code;
    private final String message;
}
