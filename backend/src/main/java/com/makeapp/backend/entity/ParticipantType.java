package com.makeapp.backend.entity;

public enum ParticipantType {
    LEADER, MEMBER, GUEST // LEADER - 카카오 로그인 유저가 모임을 생성, MEMBER - 카카오 로그인 유저가 초대 링크로 참가, GUEST - 비회원이 닉네임 + PIN으로 참가
}
