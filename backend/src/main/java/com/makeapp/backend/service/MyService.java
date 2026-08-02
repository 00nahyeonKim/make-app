package com.makeapp.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.dto.response.MyProfileResponse;
import com.makeapp.backend.entity.User;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MyService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public MyProfileResponse getProfile(Long userId) {
        return MyProfileResponse.of(findUser(userId));
    }

    @Transactional
    public MyProfileResponse updateNickname(Long userId, String nickname) {
        User user = findUser(userId);

        if (nickname == null || nickname.isBlank()
                || nickname.length() < 2 || nickname.length() > 50) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        user.updateNickname(nickname);
        return MyProfileResponse.of(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));
    }
}
