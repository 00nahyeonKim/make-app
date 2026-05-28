package com.makeapp.backend.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "USERS")
@SQLRestriction("deleted_at IS NULL") // deleted_at이 NULL인 데이터만 자동으로 가져옴
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "SEQ_USERS", allocationSize = 50)
    private Long id;

    @Column(name = "kakao_id", nullable = false, unique = true, length = 50)
    private String kakaoId;

    @Column(nullable = false, length = 50)
    private String name;

    @Builder
    public User(String kakaoId, String name) {
        this.kakaoId = kakaoId; // 객체 필드의 kakaoId = 생성자 매개변수 kakaoId
        this.name = name;
    }

    public void updateName(String name) {
        this.name = name;
    }
}
