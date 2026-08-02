package com.makeapp.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.makeapp.backend.dto.response.MyProfileResponse;
import com.makeapp.backend.entity.User;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class MyServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MyService myService;

    @Test
    void updateNicknamePreservesSpaces() {
        User user = User.builder()
                .kakaoId("123")
                .kakaoNickname("카카오닉네임")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        MyProfileResponse response =
                myService.updateNickname(1L, "  서비스닉네임  ");

        assertThat(user.getNickname()).isEqualTo("  서비스닉네임  ");
        assertThat(response.getKakaoNickname()).isEqualTo("카카오닉네임");
        assertThat(response.getNickname()).isEqualTo("  서비스닉네임  ");
        assertThat(response.getDisplayName()).isEqualTo("  서비스닉네임  ");
    }

    @Test
    void spacesAreIncludedInNicknameLength() {
        User user = User.builder()
                .kakaoId("123")
                .kakaoNickname("카카오닉네임")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        MyProfileResponse response =
                myService.updateNickname(1L, "  한  ");

        assertThat(user.getNickname()).isEqualTo("  한  ");
        assertThat(response.getNickname()).isEqualTo("  한  ");
    }

    @Test
    void nicknameLongerThanFiftyCharactersIsRejected() {
        User user = User.builder()
                .kakaoId("123")
                .kakaoNickname("카카오닉네임")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() ->
                myService.updateNickname(1L, "가".repeat(51)))
                .isInstanceOfSatisfying(
                        CustomException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_REQUEST));
    }

    @Test
    void unknownUserIsRejectedAsUnauthorized() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> myService.getProfile(99L))
                .isInstanceOfSatisfying(
                        CustomException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.UNAUTHORIZED));
    }
}
