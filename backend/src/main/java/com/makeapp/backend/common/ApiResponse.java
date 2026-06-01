package com.makeapp.backend.common;


import lombok.Getter;

// 모든 API 응답을 { success, data, error } 구조로 통일하는 클래스
// 컨트롤러는 ok()만, 실패 응답은 GlobalExceptionHandler가 fail()을 호출
@Getter
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final ErrorInfo error;

    private ApiResponse(boolean success, T data, ErrorInfo error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    // <T>: static은 객체 없이 사용 가능한데, T는 객체가 생성될 때 결정된다. 그래서 메서드가 자기만의 T를 선언
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null); // <>: 컴파일러가 제네릭 타입을 자동 추론
    }

    public static ApiResponse<Void> ok() { // <Void>: 반환 데이터는 없지만, 응답 객체 형태는 유지하고 싶을 때 사용. ex) 삭제, 로그아웃
        return new ApiResponse<>(true, null, null);
    }

    // GlobalExceptionHandler에서 예외 발생 시 호출
    public static ApiResponse<Void> fail(String code, String message) {
        return new ApiResponse<Void>(false, null, new ErrorInfo(code, message));
    }

    // 객체를 생성해서 ApiResponse 안에 에로 코드와 메시지를 넣음
    @Getter
    public static class ErrorInfo {
        private final String code;
        private final String message;

        public ErrorInfo(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }
}
