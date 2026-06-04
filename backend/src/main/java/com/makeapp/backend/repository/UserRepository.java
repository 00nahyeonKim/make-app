package com.makeapp.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.makeapp.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> { // User — 이 Repository가 다루는 엔터티 타입, Long — User의 PK 타입
    // 카카오 ID로 유저를 찾고싶지만 kakaoId는 PK가 아니기에 명시적으로 선언
    Optional<User> findByKakaoId(String kakaoId); // 해당 카카오 ID를 가진 유저가 없을 수도 있으므로 null 안전하게 처리
}
