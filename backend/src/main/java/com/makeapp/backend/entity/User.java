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

// 카카오 로그인 회원 전용 엔터티
@Entity
@Table(name = "USERS")
@SQLRestriction("deleted_at IS NULL") // deleted_at이 NULL인 데이터만 자동으로 가져옴
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 기본 생성자가 PROTECTED이므로 사실상 Builder가 유일한 생성 경로
public class User extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "SEQ_USERS", allocationSize = 50)
    private Long id;

    @Column(name = "kakao_id", nullable = false, unique = true, length = 50)
    private String kakaoId; // 카카오가 각 사용자에게 부여한 고정 번호

    @Column(name = "kakao_nickname", nullable = false, length = 50)
    private String kakaoNickname; // 카카오에서 받아온 닉네임

    @Column(name = "nickname", length = 50)
    private String nickname; // 수정한 닉네임

    @Builder
    public User(String kakaoId, String kakaoNickname, String nickname) {
        this.kakaoId = kakaoId; // 객체 필드의 kakaoId = 생성자 매개변수 kakaoId
        this.kakaoNickname = kakaoNickname;
        this.nickname = nickname;
    }

    public String getDisplayName() { // 사용자가 직접 설정한 닉네임이 있으면 그것을 우선 사용하고, 없으면 카카오 닉네임을 사용하도록 하는 메서드
        return nickname != null && !nickname.isBlank()
                ? nickname : kakaoNickname;
    }

    public void updateKakaoNickname(String kakaoNickname) {
        this.kakaoNickname = kakaoNickname;
    }

    // 로그인할 때마다 최신 닉네임으로 덮어씌우기 위한 메서드
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }
}
