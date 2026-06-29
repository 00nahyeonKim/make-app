package com.makeapp.backend.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import com.makeapp.backend.auth.JwtProvider;
import com.makeapp.backend.dto.response.AuthResponse;
import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.MeetingStatus;
import com.makeapp.backend.entity.Participant;
import com.makeapp.backend.entity.ParticipantType;
import com.makeapp.backend.entity.User;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.MeetingRepository;
import com.makeapp.backend.repository.ParticipantRepository;
import com.makeapp.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor // final 필드들의 생성자를 자동 생성
@Transactional // 메서드를 트랜잭션으로 묶음 (도중 예외 시 DB 롤백)
public class AuthService { 

    private final UserRepository userRepository; // 카카오에서 받은 kakaoId로 userRepository.findByKakaoId(...) 호출
    private final JwtProvider jwtProvider;
    private final BCryptPasswordEncoder passwordEncoder;
    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;

    @Value("${kakao.client-id}") // application.yaml의 kakao.client-id 값 주입
    private String kakaoClientId;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    private final RestClient restClient = RestClient.create(); // 외부(카카오) API 호출용 HTTP 클라이언트 - 카카오 토큰 서버에 엑세스 토큰 요청(POST), 카카오 API 서버에서 유저 정보 조회(GET) 같은 호출을 RestClient로 처리

    // 카카오 로그인 핵심 흐름: 인가코드 → 카카오 토큰 → 사용자정보 → 우리 회원 처리 → 우리 JWT 발급
    public AuthResponse kakaoLogin(String code) {
        String kakaoAccessToken = getKakaoAccessToken(code);          // 1) 인가코드로 카카오 토큰 받기
        Map<String, Object> kakaoUser = getKakaoUserInfo(kakaoAccessToken);  // 2) 토큰으로 사용자 정보 받기

        String kakaoId = String.valueOf(kakaoUser.get("id"));        // 카카오 고유 ID
        String name = extractNickname(kakaoUser);                    // 닉네임 추출

        // 3) 기존 회원이면 조회, 처음이면 가입(저장) → "있으면 로그인, 없으면 회원가입"
        User user = userRepository.findByKakaoId(kakaoId)
                .orElseGet(() -> userRepository.save(
                        User.builder().kakaoId(kakaoId).name(name).build()));
        user.updateName(name);                                       // 카카오에서 바뀐 이름 반영

        // 4) 우리 서비스용 access/refresh JWT 발급해서 반환
        return new AuthResponse(
                jwtProvider.createAccessToken(user.getId()),
                jwtProvider.createRefreshToken(user.getId()),
                new AuthResponse.UserInfo(user.getId(), user.getName()));
    }

    // 인가 코드를 카카오 토큰 발급 API에 보내 access_token을 받아옴
    @SuppressWarnings("unchecked")
    private String getKakaoAccessToken(String code) {
        try {
            // 카카오가 요구하는 폼 형식 파라미터 구성
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", kakaoClientId);
            params.add("redirect_uri", kakaoRedirectUri);
            params.add("code", code);

            Map<String, Object> response = restClient.post() // POST 요청을 보냄, Value를 Object로 선언해야 어떤 타입이든 받을 수 있음
                    .uri("https://kauth.kakao.com/oauth/token") // 이 주소로 보냄
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED) // 카카오가 요구하는 데이터 형식이 폼 형식이라 폼 형식으로 보내줌
                    .body(params) // 위에서 준비한 파라미터 요청을 body에 담음
                    .retrieve() // 실제 요청 실행
                    .body(Map.class); // JSON 데이터를 Map으로 변환

            return (String) response.get("access_token");
        } catch (Exception e) {
            log.error("카카오 토큰 요청 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.KAKAO_AUTH_FAILED);
        }
    }

    // 카카오 access_token으로 사용자 정보 API 호출
    @SuppressWarnings("unchecked")
    private Map<String, Object> getKakaoUserInfo(String kakaoAccessToken) {
        try {
            return restClient.get()
                    .uri("https://kapi.kakao.com/v2/user/me")
                    .header("Authorization", "Bearer " + kakaoAccessToken)  // 받은 카카오 토큰을 헤더로 전달
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("카카오 사용자 정보 요청 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.KAKAO_AUTH_FAILED);
        }
    }

    // 카카오 응답 JSON에서 닉네임만 꺼냄 (중첩 구조라 단계별로 null 체크). 없으면 "사용자"
    @SuppressWarnings("unchecked")
    private String extractNickname(Map<String, Object> kakaoUser) {
        Map<String, Object> account = (Map<String, Object>) kakaoUser.get("kakao_account");
        if (account != null) {
            Map<String, Object> profile = (Map<String, Object>) account.get("profile");
            if (profile != null) return (String) profile.get("nickname");
        }
        return "사용자";
    }

    // refresh token이 유효하면, 그 안의 userId로 새 access token을 발급
    public String refreshAccessToken(String refreshToken) {
        if (!jwtProvider.isValid(refreshToken)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN); // 만료/위조된 refresh면 거부
        }
        return jwtProvider.createAccessToken(jwtProvider.getUserId(refreshToken));
    }

    // 게스트 최초 참가: 초대 토큰의 모임에 닉네임+PIN으로 새 참가자(GUEST)를 만든다
    public Participant guestRegister(String inviteToken, String displayName, String rawPin) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND)); // 모임 없으면 404 
        if (meeting.getStatus() == MeetingStatus.EXPIRED) { // 만료된 모임은 참가 불가
            throw new CustomException(ErrorCode.MEETING_EXPIRED);            
        }
        if (displayName == null || displayName.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        
        if (participantRepository.findByMeetingAndDisplayName(meeting, displayName).isPresent()) {
            throw new CustomException(ErrorCode.PIN_MISMATCH);
        }
        
        String pinHash = passwordEncoder.encode(rawPin);    // PIN을 BCrypt 해시로 변환
        return participantRepository.save(Participant.builder()
                .meeting(meeting)
                .pinHash(pinHash)
                .displayName(displayName)
                .type(ParticipantType.GUEST)
                .build());
    }

    // 게스트 재로그인: 모임+닉네임으로 기존 참가자를 찾아 PIN을 검증
    public Participant guestLogin(String inviteToken, String displayName, String rawPin) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        Participant p = participantRepository.findByMeetingAndDisplayName(meeting, displayName)
                .orElseThrow(() -> new CustomException(ErrorCode.GUEST_NOT_FOUND));

        // 소셜 회원이 같은 닉네임으로 먼저 참가해 있을 경우 -> 게스트 로그인 불가
        if (p.getType() != ParticipantType.GUEST || p.getPinHash() == null) {
            throw new CustomException(ErrorCode.PIN_MISMATCH);
        }
        if (!passwordEncoder.matches(rawPin, p.getPinHash())) {
            throw new CustomException(ErrorCode.PIN_MISMATCH);
        }
        return p;
    }
}
